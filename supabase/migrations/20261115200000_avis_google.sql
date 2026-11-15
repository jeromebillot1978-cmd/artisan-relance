-- =====================================================================
-- ARTISAN RELANCE — Demande d'avis Google
--
--  * review_settings : lien Google Avis, nom affiché, modèle d'e-mail,
--                      automatisations (X jours après Gagné / Terminé)
--  * review_requests : une demande par dossier (programmée, envoyée,
--                      en échec, annulée), avec suivi des clics et de l'avis
--  * review_events   : journal détaillé (programmation, envoi, échec,
--                      clic, désinscription, avis reçu…)
--  * review_optouts  : clients qui ne veulent plus de demande d'avis (RGPD)
--
-- Envoi : Edge Function campaign-mailer (mode « reviews », et à chaque
-- passage du cron toutes les 15 min). Même budget quotidien et même
-- disjoncteur que les devis et relances.
-- Ré-exécutable.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------
create table if not exists public.review_settings (
  user_id              uuid primary key references public.profiles (id) on delete cascade,
  google_review_url    text check (google_review_url is null
                                   or (char_length(google_review_url) <= 500 and google_review_url ~* '^https://')),
  company_name         text check (char_length(company_name) <= 120),
  template_key         text not null default 'professionnel'
                       check (template_key in ('professionnel', 'court', 'chaleureux', 'personnalise')),
  subject              text not null default 'Votre avis compte pour nous — {{company_name}}'
                       check (char_length(subject) between 1 and 200),
  body                 text not null default $tpl$Bonjour,

Nous espérons que notre intervention vous a donné entière satisfaction.

Votre avis compte énormément pour notre entreprise et nous aiderait à continuer à améliorer nos services.

Vous pouvez laisser votre avis en cliquant sur le lien ci-dessous :
{{google_review_link}}

Merci pour votre confiance.

Cordialement,
{{company_name}}$tpl$
                       check (char_length(body) between 1 and 3000 and position('{{google_review_link}}' in body) > 0),
  auto_on_won          boolean not null default false,
  won_delay_days       integer not null default 7 check (won_delay_days between 0 and 90),
  auto_on_completed    boolean not null default true,
  completed_delay_days integer not null default 2 check (completed_delay_days between 0 and 90),
  -- Prévu pour une future connexion à l'API Google Business Profile
  google_place_id      text check (char_length(google_place_id) <= 200),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists public.review_requests (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  campaign_id      uuid references public.campaigns (id) on delete cascade,
  client_name      text not null check (char_length(client_name) between 1 and 120),
  recipients       text[] not null check (cardinality(recipients) between 1 and 5),
  trigger          text not null check (trigger in ('manual', 'won', 'completed')),
  status           text not null default 'scheduled'
                   check (status in ('scheduled', 'processing', 'sent', 'failed', 'cancelled')),
  scheduled_at     timestamptz not null default now(),
  claimed_at       timestamptz,
  sent_at          timestamptz,
  attempts         integer not null default 0,
  last_error       text,
  provider_id      text,
  cancel_reason    text,
  subject          text,                 -- copie de l'e-mail réellement envoyé
  body             text,
  click_token      text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  clicks           integer not null default 0,
  first_clicked_at timestamptz,
  last_clicked_at  timestamptz,
  -- Avis obtenu : saisi par l'artisan aujourd'hui ; « google » réservé à
  -- une future synchronisation avec l'API Google Business Profile.
  review_status    text not null default 'unknown' check (review_status in ('unknown', 'received')),
  review_source    text check (review_source in ('manual', 'google')),
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Une seule demande « vivante » par dossier : pas de harcèlement du client
create unique index if not exists review_requests_one_active
  on public.review_requests (campaign_id) where status in ('scheduled', 'processing', 'sent');
create index if not exists review_requests_due_idx
  on public.review_requests (scheduled_at) where status = 'scheduled';
create index if not exists review_requests_user_idx
  on public.review_requests (user_id, created_at desc);

create table if not exists public.review_events (
  id          bigserial primary key,
  request_id  uuid references public.review_requests (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        text not null,
  detail      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists review_events_user_idx on public.review_events (user_id, created_at desc);
create index if not exists review_events_request_idx on public.review_events (request_id);

create table if not exists public.review_optouts (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  email      text not null check (email = lower(email)),
  created_at timestamptz not null default now(),
  primary key (user_id, email)
);

insert into public.platform_settings (key, value, description) values
  ('review_retention_months', '24', 'Durée de conservation de l''historique des demandes d''avis')
on conflict (key) do nothing;

drop trigger if exists review_settings_updated_at on public.review_settings;
create trigger review_settings_updated_at before update on public.review_settings
  for each row execute function public.set_updated_at();
drop trigger if exists review_requests_updated_at on public.review_requests;
create trigger review_requests_updated_at before update on public.review_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2. OUTILS INTERNES
-- ---------------------------------------------------------------------

-- Journal
create or replace function public.review_log(p_request uuid, p_user uuid, p_type text, p_detail jsonb default '{}'::jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.review_events (request_id, user_id, type, detail)
  values (p_request, p_user, p_type, coalesce(p_detail, '{}'::jsonb));
$$;

-- Destinataires encore joignables (désinscrits retirés)
create or replace function public.review_reachable(p_user uuid, p_emails text[])
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(e order by e), '{}')
    from (select distinct lower(trim(x)) as e from unnest(p_emails) x) t
   where not exists (select 1 from public.review_optouts o where o.user_id = p_user and o.email = t.e);
$$;

-- Réveille l'Edge Function tout de suite (sinon le cron passe dans les 15 min)
create or replace function public.review_kick()
returns bigint
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url    text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'mailer_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'mailer_secret';
  if v_url is null or v_secret is null then
    return null;
  end if;
  return net.http_post(
    url     := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret),
    body    := jsonb_build_object('mode', 'reviews'),
    timeout_milliseconds := 60000
  );
end;
$$;

-- Programme une demande pour un dossier (utilisé par le déclencheur et le bouton)
create or replace function public.review_schedule(p_campaign uuid, p_trigger text, p_at timestamptz)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  c       public.campaigns%rowtype;
  v_to    text[];
  v_id    uuid;
begin
  select * into c from public.campaigns where id = p_campaign;
  if not found then return null; end if;

  v_to := public.review_reachable(c.user_id, c.recipients);
  if cardinality(v_to) = 0 then
    perform public.review_log(null, c.user_id, 'skipped_opt_out',
      jsonb_build_object('campaign_id', c.id, 'client', c.prospect_name, 'trigger', p_trigger));
    return null;
  end if;

  insert into public.review_requests (user_id, campaign_id, client_name, recipients, trigger, scheduled_at)
  values (c.user_id, c.id, c.prospect_name, v_to, p_trigger, p_at)
  on conflict (campaign_id) where status in ('scheduled', 'processing', 'sent') do nothing
  returning id into v_id;

  if v_id is not null then
    perform public.review_log(v_id, c.user_id, 'scheduled',
      jsonb_build_object('trigger', p_trigger, 'scheduled_at', p_at, 'recipients', v_to));
  end if;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. AUTOMATISATION : changement de statut d'un dossier
-- ---------------------------------------------------------------------
create or replace function public.campaign_review_on_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s     public.review_settings%rowtype;
  v_on  boolean;
  v_days integer;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status in ('won', 'completed') then
    select * into s from public.review_settings where user_id = new.user_id;
    if found and s.google_review_url is not null then
      v_on   := case when new.status = 'won' then s.auto_on_won else s.auto_on_completed end;
      v_days := case when new.status = 'won' then s.won_delay_days else s.completed_delay_days end;
      if v_on then
        perform public.review_schedule(new.id, new.status,
          public.paris_send_window(now() + make_interval(days => v_days)));
      end if;
    end if;
  else
    -- Dossier rouvert, perdu, arrêté… : on n'envoie plus la demande prévue
    with cancelled as (
      update public.review_requests
         set status = 'cancelled', cancel_reason = 'status_changed'
       where campaign_id = new.id and status = 'scheduled'
      returning id, user_id
    )
    insert into public.review_events (request_id, user_id, type, detail)
    select id, user_id, 'cancelled', jsonb_build_object('reason', 'status_changed', 'new_status', new.status)
      from cancelled;
  end if;
  return new;
end;
$$;

drop trigger if exists campaigns_review_on_status on public.campaigns;
create trigger campaigns_review_on_status after update of status on public.campaigns
  for each row execute function public.campaign_review_on_status();

-- ---------------------------------------------------------------------
-- 4. ACTIONS DE L'ARTISAN (connecté)
-- ---------------------------------------------------------------------

-- Bouton « Demander un avis Google » : envoi immédiat
create or replace function public.review_request_now(p_campaign_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  c        public.campaigns%rowtype;
  s        public.review_settings%rowtype;
  r        public.review_requests%rowtype;
  v_id     uuid;
begin
  select * into c from public.campaigns where id = p_campaign_id and user_id = auth.uid();
  if not found then
    raise exception 'Devis introuvable.' using errcode = 'P0001';
  end if;
  if c.status not in ('won', 'completed') then
    raise exception 'Marquez d''abord ce devis comme Gagné ou Terminé.' using errcode = 'P0001';
  end if;
  select * into s from public.review_settings where user_id = c.user_id;
  if not found or s.google_review_url is null then
    raise exception 'Ajoutez d''abord votre lien Google Avis dans Paramètres.' using errcode = 'P0001';
  end if;

  select * into r from public.review_requests
   where campaign_id = c.id and status in ('scheduled', 'processing', 'sent')
   for update;
  if found then
    if r.status = 'sent' then
      raise exception 'Une demande d''avis a déjà été envoyée à ce client le %.',
        to_char(r.sent_at at time zone 'Europe/Paris', 'DD/MM/YYYY') using errcode = 'P0001';
    elsif r.status = 'processing' then
      raise exception 'La demande d''avis est en cours d''envoi.' using errcode = 'P0001';
    end if;
    update public.review_requests set scheduled_at = now(), trigger = 'manual' where id = r.id;
    perform public.review_log(r.id, c.user_id, 'rescheduled', jsonb_build_object('reason', 'manual_now'));
    v_id := r.id;
  else
    v_id := public.review_schedule(c.id, 'manual', now());
    if v_id is null then
      raise exception 'Ce client s''est désinscrit des demandes d''avis.' using errcode = 'P0001';
    end if;
  end if;

  perform public.review_kick();
  return v_id;
end;
$$;

-- Actions sur une demande : envoyer maintenant, annuler, réessayer, avis reçu
create or replace function public.review_request_action(p_id uuid, p_action text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.review_requests%rowtype;
begin
  select * into r from public.review_requests where id = p_id and user_id = auth.uid() for update;
  if not found then
    raise exception 'Demande introuvable.' using errcode = 'P0001';
  end if;

  case p_action
    when 'send_now' then
      if r.status <> 'scheduled' then raise exception 'Cette demande n''est pas en attente.' using errcode = 'P0001'; end if;
      update public.review_requests set scheduled_at = now() where id = p_id;
      perform public.review_kick();
    when 'cancel' then
      if r.status <> 'scheduled' then raise exception 'Seule une demande en attente peut être annulée.' using errcode = 'P0001'; end if;
      update public.review_requests set status = 'cancelled', cancel_reason = 'manual' where id = p_id;
    when 'retry' then
      if r.status <> 'failed' then raise exception 'Cette demande n''est pas en échec.' using errcode = 'P0001'; end if;
      if exists (select 1 from public.review_requests x
                  where x.campaign_id = r.campaign_id and x.id <> r.id
                    and x.status in ('scheduled', 'processing', 'sent')) then
        raise exception 'Une autre demande existe déjà pour ce client.' using errcode = 'P0001';
      end if;
      update public.review_requests
         set status = 'scheduled', scheduled_at = now(), attempts = 0, last_error = null,
             recipients = case when cardinality(public.review_reachable(r.user_id, r.recipients)) > 0
                               then public.review_reachable(r.user_id, r.recipients) else recipients end
       where id = p_id;
      perform public.review_kick();
    when 'mark_received' then
      if r.status <> 'sent' then raise exception 'La demande n''a pas encore été envoyée.' using errcode = 'P0001'; end if;
      update public.review_requests
         set review_status = 'received', review_source = 'manual', reviewed_at = now()
       where id = p_id;
    when 'unmark_received' then
      update public.review_requests
         set review_status = 'unknown', review_source = null, reviewed_at = null
       where id = p_id;
    else
      raise exception 'Action inconnue.' using errcode = 'P0001';
  end case;

  perform public.review_log(p_id, r.user_id, p_action, jsonb_build_object('from_status', r.status));
  return (select status from public.review_requests where id = p_id);
end;
$$;

-- ---------------------------------------------------------------------
-- 5. MOTEUR D'ENVOI (Edge Function, service_role)
-- ---------------------------------------------------------------------

-- Le budget quotidien compte aussi les demandes d'avis
create or replace function public.emails_used_today(p_user uuid default null)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select (
    coalesce((select sum(cardinality(s.recipients) + case when s.kind = 'initial' then 1 else 0 end)
                from public.campaign_sends s
               where s.claimed_at >= public.paris_day_start()
                 and s.status in ('sent', 'processing')
                 and (p_user is null or s.user_id = p_user)), 0)
  + coalesce((select count(*) from public.inbound_replies r
               where r.forwarded and r.created_at >= public.paris_day_start()
                 and (p_user is null or r.user_id = p_user)), 0)
  + coalesce((select sum(cardinality(q.recipients)) from public.review_requests q
               where q.claimed_at >= public.paris_day_start()
                 and q.status in ('sent', 'processing')
                 and (p_user is null or q.user_id = p_user)), 0)
  )::integer;
$$;

-- Le disjoncteur compte aussi les échecs d'envoi d'avis
create or replace function public.mailer_breaker_open()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select count(*) from public.campaign_sends
           where status = 'failed' and claimed_at > now() - interval '1 hour')
       + (select count(*) from public.review_events
           where type = 'send_failed' and created_at > now() - interval '1 hour')
       >= public.setting_int('failure_breaker_per_hour', 20);
$$;

do $$ begin
  if to_regtype('public.review_job') is null then
    create type public.review_job as (
      request_id uuid, attempts integer, user_id uuid, campaign_id uuid,
      client_name text, recipients text[], click_token text, google_review_url text,
      company_name text, subject text, body text,
      contact_name text, phone text, user_email text, reply_to_email text
    );
  end if;
end $$;

create or replace function public.claim_due_review_requests(p_limit integer default 20)
returns setof public.review_job
language plpgsql
security definer
set search_path = public
as $$
declare
  v_global     integer := public.setting_int('daily_email_limit', 90) - public.emails_used_today(null);
  v_user_limit integer := public.setting_int('user_daily_email_limit', 30);
  v_ids        uuid[] := '{}';
  v_to         text[];
  r            record;
begin
  if public.mailer_breaker_open() or v_global <= 0 then
    return;
  end if;

  for r in
    select q.id, q.user_id, q.recipients, s.google_review_url
      from public.review_requests q
      left join public.review_settings s on s.user_id = q.user_id
     where (q.status = 'scheduled' and q.scheduled_at <= now())
        or (q.status = 'processing' and q.claimed_at < now() - interval '15 minutes')
     order by q.scheduled_at
     limit p_limit * 3
     for update of q skip locked
  loop
    -- Lien Google retiré entre-temps : on suspend la demande
    if r.google_review_url is null then
      update public.review_requests set status = 'cancelled', cancel_reason = 'no_google_link' where id = r.id;
      perform public.review_log(r.id, r.user_id, 'cancelled', jsonb_build_object('reason', 'no_google_link'));
      continue;
    end if;

    v_to := public.review_reachable(r.user_id, r.recipients);
    if cardinality(v_to) = 0 then
      update public.review_requests set status = 'cancelled', cancel_reason = 'opt_out' where id = r.id;
      perform public.review_log(r.id, r.user_id, 'cancelled', jsonb_build_object('reason', 'opt_out'));
      continue;
    end if;

    exit when v_global < cardinality(v_to);
    continue when public.emails_used_today(r.user_id) + cardinality(v_to) > v_user_limit;

    update public.review_requests
       set status = 'processing', claimed_at = now(), attempts = attempts + 1, recipients = v_to
     where id = r.id;
    v_ids := v_ids || r.id;
    v_global := v_global - cardinality(v_to);
    exit when cardinality(v_ids) >= p_limit;
  end loop;

  return query
    select q.id, q.attempts, q.user_id, q.campaign_id, q.client_name, q.recipients, q.click_token,
           s.google_review_url,
           coalesce(nullif(trim(s.company_name), ''), nullif(trim(p.company_name), ''), 'Votre artisan'),
           s.subject, s.body, p.contact_name, p.phone, p.email, p.reply_to_email
      from public.review_requests q
      join public.review_settings s on s.user_id = q.user_id
      join public.profiles p on p.id = q.user_id
     where q.id = any(v_ids);
end;
$$;

create or replace function public.complete_review_send(p_id uuid, p_provider_id text, p_subject text, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.review_requests%rowtype;
begin
  update public.review_requests
     set status = 'sent', sent_at = now(), provider_id = p_provider_id, last_error = null,
         subject = left(p_subject, 200), body = left(p_body, 5000)
   where id = p_id and status = 'processing'
  returning * into r;
  if not found then return; end if;
  perform public.review_log(p_id, r.user_id, 'sent',
    jsonb_build_object('recipients', r.recipients, 'provider_id', p_provider_id, 'attempt', r.attempts));
end;
$$;

-- Échec : 3 tentatives espacées (30 min, 1 h), puis « en échec »
create or replace function public.fail_review_send(p_id uuid, p_error text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r     public.review_requests%rowtype;
  final boolean;
begin
  select * into r from public.review_requests where id = p_id and status = 'processing' for update;
  if not found then return; end if;
  final := r.attempts >= 3;

  update public.review_requests
     set status = case when final then 'failed' else 'scheduled' end,
         scheduled_at = case when final then scheduled_at else now() + make_interval(mins => 30 * r.attempts) end,
         last_error = left(p_error, 500)
   where id = p_id;

  perform public.review_log(p_id, r.user_id, 'send_failed',
    jsonb_build_object('attempt', r.attempts, 'final', final, 'error', left(p_error, 300)));
end;
$$;

-- ---------------------------------------------------------------------
-- 6. LIENS PUBLICS (client final, sans compte)
-- ---------------------------------------------------------------------

-- Clic sur le lien de l'e-mail : compte le clic, renvoie le lien Google
create or replace function public.register_review_click(p_token text, p_count boolean default true)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  r     public.review_requests%rowtype;
  v_url text;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{32}$' then return null; end if;
  select * into r from public.review_requests where click_token = p_token;
  if not found then return null; end if;
  select google_review_url into v_url from public.review_settings where user_id = r.user_id;

  if p_count and r.status = 'sent' then
    update public.review_requests
       set clicks = clicks + 1, first_clicked_at = coalesce(first_clicked_at, now()), last_clicked_at = now()
     where id = r.id;
    if r.clicks = 0 then
      perform public.review_log(r.id, r.user_id, 'clicked', '{}'::jsonb);
    end if;
  end if;
  return v_url;
end;
$$;

-- Page de désinscription : nom de l'entreprise à afficher
create or replace function public.review_token_company(p_token text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(nullif(trim(s.company_name), ''), nullif(trim(p.company_name), ''), 'cette entreprise')
    from public.review_requests q
    join public.profiles p on p.id = q.user_id
    left join public.review_settings s on s.user_id = q.user_id
   where p_token ~ '^[0-9a-f]{32}$' and q.click_token = p_token;
$$;

-- Désinscription : plus aucune demande d'avis de cet artisan vers ces adresses
create or replace function public.review_opt_out(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.review_requests%rowtype;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{32}$' then return false; end if;
  select * into r from public.review_requests where click_token = p_token;
  if not found then return false; end if;

  insert into public.review_optouts (user_id, email)
  select r.user_id, lower(trim(e)) from unnest(r.recipients) e
  on conflict do nothing;

  update public.review_requests
     set status = 'cancelled', cancel_reason = 'opt_out'
   where user_id = r.user_id and status = 'scheduled'
     and cardinality(public.review_reachable(user_id, recipients)) = 0;

  perform public.review_log(r.id, r.user_id, 'opted_out', jsonb_build_object('client', r.client_name));
  return true;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. CONSERVATION (RGPD) : appelée par la maintenance nocturne
-- ---------------------------------------------------------------------
create or replace function public.purge_review_history()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from public.review_requests
   where created_at < now() - make_interval(months => public.setting_int('review_retention_months', 24))
     and status in ('sent', 'failed', 'cancelled');
  get diagnostics n = row_count;
  delete from public.review_events
   where created_at < now() - make_interval(months => public.setting_int('review_retention_months', 24));
  return n;
end;
$$;

-- État du moteur : ajoute les demandes d'avis dues
create or replace function public.mailer_status()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'used_today', public.emails_used_today(null),
    'daily_limit', public.setting_int('daily_email_limit', 90),
    'breaker_open', public.mailer_breaker_open(),
    'due_now', (select count(*) from public.campaigns
                 where status = 'active' and followup_enabled and next_followup_at <= now()),
    'reviews_due', (select count(*) from public.review_requests
                     where status = 'scheduled' and scheduled_at <= now()));
$$;

-- ---------------------------------------------------------------------
-- 8. DROITS ET RLS
-- ---------------------------------------------------------------------
alter table public.review_settings enable row level security;
alter table public.review_requests enable row level security;
alter table public.review_events   enable row level security;
alter table public.review_optouts  enable row level security;

drop policy if exists review_settings_select_own on public.review_settings;
create policy review_settings_select_own on public.review_settings
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists review_settings_insert_own on public.review_settings;
create policy review_settings_insert_own on public.review_settings
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists review_settings_update_own on public.review_settings;
create policy review_settings_update_own on public.review_settings
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists review_requests_select_own on public.review_requests;
create policy review_requests_select_own on public.review_requests
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists review_events_select_own on public.review_events;
create policy review_events_select_own on public.review_events
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists review_optouts_select_own on public.review_optouts;
create policy review_optouts_select_own on public.review_optouts
  for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.review_settings, public.review_requests, public.review_events, public.review_optouts from anon;
revoke insert, update, delete on public.review_requests, public.review_events, public.review_optouts from authenticated;
revoke insert, update, delete on public.review_settings from authenticated;
grant select on public.review_settings, public.review_requests, public.review_events, public.review_optouts to authenticated;
grant insert (user_id, google_review_url, company_name, template_key, subject, body, auto_on_won, won_delay_days,
              auto_on_completed, completed_delay_days)
  on public.review_settings to authenticated;
grant update (google_review_url, company_name, template_key, subject, body, auto_on_won, won_delay_days,
              auto_on_completed, completed_delay_days)
  on public.review_settings to authenticated;
grant all on public.review_settings, public.review_requests, public.review_events, public.review_optouts to service_role;
grant usage on sequence public.review_events_id_seq to service_role;

-- Fonctions internes : serveur uniquement
revoke execute on function public.review_log(uuid, uuid, text, jsonb)           from public, anon, authenticated;
revoke execute on function public.review_reachable(uuid, text[])                from public, anon, authenticated;
revoke execute on function public.review_kick()                                 from public, anon, authenticated;
revoke execute on function public.review_schedule(uuid, text, timestamptz)      from public, anon, authenticated;
revoke execute on function public.campaign_review_on_status()                   from public, anon, authenticated;
revoke execute on function public.claim_due_review_requests(integer)            from public, anon, authenticated;
revoke execute on function public.complete_review_send(uuid, text, text, text)  from public, anon, authenticated;
revoke execute on function public.fail_review_send(uuid, text)                  from public, anon, authenticated;
revoke execute on function public.purge_review_history()                        from public, anon, authenticated;
revoke execute on function public.emails_used_today(uuid)                       from public, anon, authenticated;
revoke execute on function public.mailer_breaker_open()                         from public, anon, authenticated;
revoke execute on function public.mailer_status()                               from public, anon, authenticated;
grant execute on function public.claim_due_review_requests(integer), public.complete_review_send(uuid, text, text, text),
  public.fail_review_send(uuid, text), public.purge_review_history(), public.mailer_status()
  to service_role;

-- Artisan connecté
revoke execute on function public.review_request_now(uuid)           from public, anon;
revoke execute on function public.review_request_action(uuid, text)  from public, anon;
grant execute on function public.review_request_now(uuid), public.review_request_action(uuid, text) to authenticated;

-- Liens publics de l'e-mail (sans compte)
revoke execute on function public.register_review_click(text, boolean) from public;
revoke execute on function public.review_token_company(text)          from public;
revoke execute on function public.review_opt_out(text)                from public;
grant execute on function public.register_review_click(text, boolean), public.review_token_company(text),
  public.review_opt_out(text) to anon, authenticated;
