-- =====================================================================
-- ARTISAN RELANCE — v2 : campagnes de relance (envoi du devis + relances)
-- Ré-exécutable. Les anciens devis (table quotes) sont convertis en
-- campagnes ; les anciennes tables restent en place pour l'historique.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 0. RÉGLAGES DE LA PLATEFORME (garde-fous, modifiables sans redéployer)
-- ---------------------------------------------------------------------
create table if not exists public.platform_settings (
  key         text primary key,
  value       text not null,
  description text
);
insert into public.platform_settings (key, value, description) values
  ('daily_email_limit', '90', 'Plafond global d''e-mails par jour, toutes campagnes (offre gratuite Resend : 100/jour, marge pour les e-mails de connexion)'),
  ('user_daily_email_limit', '30', 'Plafond d''e-mails par artisan et par jour (devis + relances + transferts)'),
  ('failure_breaker_per_hour', '20', 'Au-delà de N envois en échec sur 1 h, tous les envois sont suspendus (disjoncteur)'),
  ('reply_forward_daily_limit', '10', 'Transferts de réponses maximum par dossier et par 24 h (anti-boucle)'),
  ('attachment_retention_months', '12', 'Durée de conservation des pièces jointes après la clôture du dossier'),
  ('orphan_upload_retention_days', '2', 'Suppression des fichiers téléversés mais jamais rattachés à un devis')
on conflict (key) do nothing;
alter table public.platform_settings enable row level security;
revoke all on public.platform_settings from anon, authenticated;

create or replace function public.setting_int(p_key text, p_default integer)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select value::integer from public.platform_settings where key = p_key), p_default);
$$;

-- ---------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------
create table if not exists public.campaigns (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles (id) on delete cascade,
  idempotency_key     uuid not null,                         -- anti double-clic
  reference           text check (char_length(reference) <= 50),
  prospect_name       text not null check (char_length(prospect_name) between 1 and 120),
  recipients          text[] not null check (cardinality(recipients) between 1 and 5),
  subject             text not null check (char_length(subject) between 1 and 200),
  message             text not null check (char_length(message) between 1 and 5000),
  followup_message    text not null check (char_length(followup_message) between 1 and 5000),
  amount              numeric(12, 2) not null default 0 check (amount >= 0),
  client_phone        text check (char_length(client_phone) <= 30),
  notes               text check (char_length(notes) <= 1000),

  -- Envoi initial
  send_initial        boolean not null default true,         -- false = devis déjà envoyé hors appli
  initial_send_status text not null default 'pending'
                      check (initial_send_status in ('pending', 'processing', 'sent', 'failed', 'skipped')),
  initial_sent_at     timestamptz,                           -- date et heure exactes de l'envoi

  -- Stratégie de relance
  followup_enabled    boolean not null default true,
  interval_days       integer not null default 7 check (interval_days between 1 and 90),
  max_followups       integer not null default 3 check (max_followups between 1 and 20),
  end_date            date,                                  -- date de fin de campagne (optionnelle)
  max_days            integer check (max_days between 1 and 365), -- ou durée maximale en jours
  attach_on_followups boolean not null default false,        -- rejoindre les PJ aux relances

  -- Suivi
  followups_sent      integer not null default 0,
  next_followup_at    timestamptz,
  last_followup_at    timestamptz,
  ends_at             timestamptz,
  status              text not null default 'draft'
                      check (status in ('draft', 'active', 'paused', 'replied', 'won', 'lost', 'completed', 'stopped')),
  pause_reason        text,
  reply_token         text not null unique default encode(gen_random_bytes(12), 'hex'),
  replied_at          timestamptz,
  won_at              timestamptz,
  lost_at             timestamptz,
  stopped_at          timestamptz,
  completed_at        timestamptz,
  legacy_quote_id     uuid unique,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index if not exists campaigns_user_status_idx on public.campaigns (user_id, status);
create index if not exists campaigns_user_created_idx on public.campaigns (user_id, created_at desc);
create index if not exists campaigns_due_idx on public.campaigns (next_followup_at)
  where status = 'active' and followup_enabled;
create index if not exists campaigns_draft_idx on public.campaigns (updated_at) where status = 'draft';
create index if not exists campaigns_closed_idx on public.campaigns
  (coalesce(won_at, lost_at, stopped_at, completed_at, replied_at, updated_at))
  where status in ('replied', 'won', 'lost', 'completed', 'stopped');

create table if not exists public.campaign_attachments (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.campaigns (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  storage_path  text not null unique,
  file_name     text not null check (char_length(file_name) between 1 and 200),
  mime_type     text not null,
  size_bytes    integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at    timestamptz not null default now()
);
create index if not exists campaign_attachments_campaign_idx on public.campaign_attachments (campaign_id);
create index if not exists campaign_attachments_user_idx on public.campaign_attachments (user_id);

-- Un envoi = une ligne. (campaign_id, sequence) unique : impossible d'envoyer
-- deux fois la même relance. sequence 0 = envoi initial.
create table if not exists public.campaign_sends (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.campaigns (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  sequence      integer not null check (sequence >= 0),
  kind          text not null check (kind in ('initial', 'followup')),
  status        text not null default 'processing' check (status in ('processing', 'sent', 'failed')),
  attempts      integer not null default 1,
  recipients    text[] not null,
  provider_id   text,
  error         text,
  claimed_at    timestamptz not null default now(),
  sent_at       timestamptz,
  created_at    timestamptz not null default now(),
  unique (campaign_id, sequence)
);
create index if not exists campaign_sends_user_idx on public.campaign_sends (user_id, claimed_at);
create index if not exists campaign_sends_claimed_idx on public.campaign_sends (claimed_at, status);

-- Journal complet (historique affiché à l'artisan + logs)
create table if not exists public.campaign_events (
  id            bigint generated always as identity primary key,
  campaign_id   uuid not null references public.campaigns (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  type          text not null,
  detail        jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists campaign_events_campaign_idx on public.campaign_events (campaign_id, created_at);
create index if not exists campaign_events_user_idx on public.campaign_events (user_id);

-- Réponses reçues (webhook Resend). provider_email_id unique = idempotence.
create table if not exists public.inbound_replies (
  id                 uuid primary key default gen_random_uuid(),
  provider_email_id  text not null unique,
  campaign_id        uuid references public.campaigns (id) on delete cascade,
  user_id            uuid references public.profiles (id) on delete cascade,
  from_address       text,
  subject            text,
  forwarded          boolean not null default false,
  forward_error      text,
  created_at         timestamptz not null default now()
);
create index if not exists inbound_replies_campaign_idx on public.inbound_replies (campaign_id, created_at);
create index if not exists inbound_replies_created_idx on public.inbound_replies (created_at) where forwarded;
create index if not exists inbound_replies_user_idx on public.inbound_replies (user_id);

-- ---------------------------------------------------------------------
-- 2. CONVERSION DES ANCIENS DEVIS (avant les déclencheurs de contrôle)
-- ---------------------------------------------------------------------
insert into public.campaigns (
  user_id, idempotency_key, reference, prospect_name, recipients, subject, message,
  followup_message, amount, client_phone, notes, send_initial, initial_send_status, initial_sent_at,
  followup_enabled, interval_days, max_followups, followups_sent, last_followup_at,
  status, won_at, lost_at, legacy_quote_id, created_at
)
select
  q.user_id, q.id, q.reference, q.client_name, array[lower(q.client_email)],
  'Votre devis' || coalesce(' n° ' || q.reference, ''),
  'Devis envoyé hors application.',
  E'Bonjour {client},\n\nJe me permets de revenir vers vous au sujet de notre devis envoyé le {date_envoi}.\n\nAvez-vous eu le temps d''en prendre connaissance ? Je reste disponible pour en discuter ou l''adapter à vos besoins.',
  q.amount, q.client_phone, q.notes, false, 'skipped',
  (q.quote_date + time '09:00') at time zone 'Europe/Paris',
  true, 6, 2,
  (select count(*) from public.scheduled_emails se where se.quote_id = q.id and se.status = 'sent'),
  (select max(se.sent_at) from public.scheduled_emails se where se.quote_id = q.id and se.status = 'sent'),
  case q.status when 'signed' then 'won' when 'lost' then 'lost' else 'active' end,
  case when q.status = 'signed' then coalesce(q.signed_at, q.updated_at) end,
  case when q.status = 'lost' then q.updated_at end,
  q.id, q.created_at
from public.quotes q
-- un devis recréé par le script de retour arrière porte l'id de sa campagne : pas de doublon
where not exists (select 1 from public.campaigns c2 where c2.id = q.id)
on conflict (legacy_quote_id) do nothing;

-- L'ancien moteur J+4/J+10 s'arrête. Les relances annulées sont marquées
-- « v2_migration » pour pouvoir être restaurées par le retour arrière.
update public.scheduled_emails set status = 'cancelled', last_error = 'v2_migration'
 where status in ('pending', 'failed', 'processing');

-- Contrôle d'intégrité : chaque ancien devis a exactement une campagne,
-- montants identiques. Sinon toute la migration est annulée.
do $$
declare
  n_quotes integer; n_conv integer; sum_quotes numeric; sum_conv numeric;
begin
  select count(*), coalesce(sum(amount), 0) into n_quotes, sum_quotes
    from public.quotes q where not exists (select 1 from public.campaigns c2 where c2.id = q.id);
  select count(*), coalesce(sum(amount), 0) into n_conv, sum_conv
    from public.campaigns where legacy_quote_id is not null;
  if n_quotes <> n_conv or sum_quotes <> sum_conv then
    raise exception 'Migration interrompue : % devis pour % campagnes converties (montants % / %)',
      n_quotes, n_conv, sum_quotes, sum_conv;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 3. PLANIFICATION
-- ---------------------------------------------------------------------

-- Ramène un instant dans la plage d'envoi : lundi-samedi, 8 h-19 h (Paris).
create or replace function public.paris_send_window(p_ts timestamptz)
returns timestamptz
language plpgsql
stable
set search_path = public
as $$
declare
  local_ts timestamp := p_ts at time zone 'Europe/Paris';
  d date := local_ts::date;
begin
  if extract(hour from local_ts) >= 19 then
    d := d + 1;
    local_ts := d + time '09:00';
  elsif extract(hour from local_ts) < 8 then
    local_ts := d + time '09:00';
  end if;
  if extract(isodow from local_ts) = 7 then           -- dimanche -> lundi 9 h
    local_ts := (local_ts::date + 1) + time '09:00';
  end if;
  return local_ts at time zone 'Europe/Paris';
end;
$$;

-- Recalcule la prochaine relance (ou termine la campagne).
-- Règle : relance n = envoi initial + n × intervalle, jamais moins d'un
-- intervalle après la relance précédente, dans la plage 8 h-19 h.
create or replace function public.campaign_reschedule(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c        public.campaigns%rowtype;
  v_ends   timestamptz;
  v_next   timestamptz;
  v_reason text;
begin
  select * into c from public.campaigns where id = p_id for update;
  if not found then return; end if;

  if c.initial_sent_at is not null then
    v_ends := least(
      case when c.max_days is not null then c.initial_sent_at + make_interval(days => c.max_days) end,
      case when c.end_date is not null then ((c.end_date + 1)::timestamp at time zone 'Europe/Paris') end
    );
  end if;

  if c.status <> 'active' or c.initial_sent_at is null or not c.followup_enabled then
    update public.campaigns set next_followup_at = null, ends_at = v_ends where id = p_id;
    return;
  end if;

  if c.followups_sent >= c.max_followups then
    v_reason := 'max_followups';
  else
    v_next := public.paris_send_window(greatest(
      c.initial_sent_at + make_interval(days => c.interval_days * (c.followups_sent + 1)),
      coalesce(c.last_followup_at, c.initial_sent_at) + make_interval(days => c.interval_days)
    ));
    if v_ends is not null and v_next > v_ends then
      v_reason := 'max_duration';
      v_next := null;
    end if;
  end if;

  if v_reason is not null then
    update public.campaigns
       set status = 'completed', completed_at = now(), next_followup_at = null, ends_at = v_ends
     where id = p_id;
    insert into public.campaign_events (campaign_id, user_id, type, detail)
    values (p_id, c.user_id, 'completed', jsonb_build_object('reason', v_reason, 'followups_sent', c.followups_sent));
  else
    update public.campaigns set next_followup_at = v_next, ends_at = v_ends where id = p_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. DÉCLENCHEURS
-- ---------------------------------------------------------------------
create or replace function public.campaign_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent integer;
begin
  -- Anti-abus : 50 campagnes par 24 h et par compte
  select count(*) into recent from public.campaigns
   where user_id = new.user_id and created_at > now() - interval '24 hours';
  if recent >= 50 then
    raise exception 'Limite de 50 nouveaux devis par 24 h atteinte. Réessayez demain.' using errcode = 'P0001';
  end if;

  -- Adresses : minuscules, sans doublon, format valide
  -- minuscules, sans doublon, ordre de saisie conservé (le 1er reste le destinataire principal)
  new.recipients := array(
    select e from (
      select lower(trim(x)) as e, min(ord) as first_pos
        from unnest(new.recipients) with ordinality as t(x, ord)
       where trim(x) <> ''
       group by lower(trim(x))
    ) d order by first_pos);
  if cardinality(new.recipients) = 0 or exists (
    select 1 from unnest(new.recipients) r where r !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ) then
    raise exception 'Adresse e-mail invalide.' using errcode = 'P0001';
  end if;

  -- Champs gérés par le système : jamais fournis par le client
  new.followups_sent := 0;
  new.last_followup_at := null;
  new.next_followup_at := null;
  new.replied_at := null; new.won_at := null; new.lost_at := null;
  new.stopped_at := null; new.completed_at := null; new.pause_reason := null;
  new.reply_token := encode(extensions.gen_random_bytes(12), 'hex');
  new.created_at := now();

  if new.send_initial then
    new.status := 'draft';
    new.initial_send_status := 'pending';
    new.initial_sent_at := null;
  else
    new.status := 'active';
    new.initial_send_status := 'skipped';
    new.initial_sent_at := coalesce(new.initial_sent_at, now());
    if new.initial_sent_at > now() + interval '1 hour' then
      raise exception 'La date d''envoi ne peut pas être dans le futur.' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.campaign_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.campaign_events (campaign_id, user_id, type, detail)
  values (new.id, new.user_id, 'created', jsonb_build_object(
    'send_initial', new.send_initial, 'interval_days', new.interval_days,
    'max_followups', new.max_followups, 'followup_enabled', new.followup_enabled));
  if not new.send_initial then
    perform public.campaign_reschedule(new.id);
  end if;
  return null;
end;
$$;

drop trigger if exists campaigns_before_insert on public.campaigns;
create trigger campaigns_before_insert before insert on public.campaigns
  for each row execute function public.campaign_before_insert();

drop trigger if exists campaigns_after_insert on public.campaigns;
create trigger campaigns_after_insert after insert on public.campaigns
  for each row execute function public.campaign_after_insert();

drop trigger if exists campaigns_updated_at on public.campaigns;
create trigger campaigns_updated_at before update on public.campaigns
  for each row execute function public.set_updated_at();

-- Planifie les campagnes converties depuis l'ancien système
do $$
declare r record;
begin
  for r in select id from public.campaigns where legacy_quote_id is not null and status = 'active' and next_followup_at is null loop
    perform public.campaign_reschedule(r.id);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 4 bis. BUDGET D'ENVOI (anti-coût, anti-boucle)
-- Un e-mail = un destinataire (+ la copie de l'artisan pour le devis initial).
-- ---------------------------------------------------------------------
create or replace function public.paris_day_start()
returns timestamptz
language sql
stable
set search_path = public
as $$ select (public.today_paris())::timestamp at time zone 'Europe/Paris'; $$;

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
  )::integer;
$$;

create or replace function public.mailer_breaker_open()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select count(*) >= public.setting_int('failure_breaker_per_hour', 20)
    from public.campaign_sends
   where status = 'failed' and claimed_at > now() - interval '1 hour';
$$;

-- Budget restant, pour l'artisan connecté (affiché et vérifié avant l'envoi)
create or replace function public.my_send_budget()
returns table (user_remaining integer, global_remaining integer, user_limit integer, paused boolean)
language sql
stable
security definer
set search_path = public
as $$
  select greatest(public.setting_int('user_daily_email_limit', 30) - public.emails_used_today(auth.uid()), 0),
         greatest(public.setting_int('daily_email_limit', 90) - public.emails_used_today(null), 0),
         public.setting_int('user_daily_email_limit', 30),
         public.mailer_breaker_open();
$$;

-- État du moteur (journalisé à chaque passage du cron)
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
                 where status = 'active' and followup_enabled and next_followup_at <= now()));
$$;

-- ---------------------------------------------------------------------
-- 5. MOTEUR D'ENVOI (appelé uniquement par l'Edge Function, service_role)
-- ---------------------------------------------------------------------
do $$ begin
  if to_regtype('public.mailer_job') is null then
    create type public.mailer_job as (
      send_id uuid, sequence integer, kind text, attempts integer,
      campaign_id uuid, user_id uuid, reference text, prospect_name text, recipients text[],
      subject text, message text, followup_message text, amount numeric,
      initial_sent_at timestamptz, max_followups integer, attach_on_followups boolean,
      reply_token text, company_name text, contact_name text, phone text,
      user_email text, reply_to_email text
    );
  end if;
end $$;

create or replace function public.mailer_jobs(p_send_ids uuid[])
returns setof public.mailer_job
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.sequence, s.kind, s.attempts,
         c.id, c.user_id, c.reference, c.prospect_name, s.recipients,
         c.subject, c.message, c.followup_message, c.amount,
         c.initial_sent_at, c.max_followups, c.attach_on_followups,
         c.reply_token, p.company_name, p.contact_name, p.phone,
         p.email, p.reply_to_email
    from public.campaign_sends s
    join public.campaigns c on c.id = s.campaign_id
    join public.profiles  p on p.id = c.user_id
   where s.id = any(coalesce(p_send_ids, '{}'));
$$;

-- Réserve l'envoi initial d'une campagne (idempotent : 1 seul envoi possible)
create or replace function public.claim_initial_send(p_campaign_id uuid)
returns setof public.mailer_job
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids uuid[];
  v_weight integer;
  v_user uuid;
begin
  -- Garde-fous : disjoncteur, plafond global, plafond de l'artisan.
  -- Si dépassé, l'envoi reste en attente et repart au prochain passage du cron.
  select cardinality(recipients) + 1, user_id into v_weight, v_user
    from public.campaigns where id = p_campaign_id;
  if v_user is null or public.mailer_breaker_open()
     or public.emails_used_today(null) + v_weight > public.setting_int('daily_email_limit', 90)
     or public.emails_used_today(v_user) + v_weight > public.setting_int('user_daily_email_limit', 30) then
    return;
  end if;

  with c as (
    select * from public.campaigns
     where id = p_campaign_id and send_initial
       and status = 'draft' and initial_send_status in ('pending', 'failed', 'processing')
     for update skip locked
  ), ins as (
    insert into public.campaign_sends (campaign_id, user_id, sequence, kind, recipients)
    select c.id, c.user_id, 0, 'initial', c.recipients from c
    on conflict (campaign_id, sequence) do update
      set status = 'processing', attempts = campaign_sends.attempts + 1,
          claimed_at = now(), error = null
    where (campaign_sends.status = 'failed' and campaign_sends.attempts < 3)
       or (campaign_sends.status = 'processing' and campaign_sends.claimed_at < now() - interval '15 minutes')
    returning id
  )
  select array_agg(id) into v_ids from ins;

  if v_ids is not null then
    update public.campaigns set initial_send_status = 'processing' where id = p_campaign_id;
  end if;
  return query select * from public.mailer_jobs(v_ids);
end;
$$;

-- Réserve les relances arrivées à échéance (FOR UPDATE SKIP LOCKED + clé unique)
create or replace function public.claim_due_followups(p_limit integer default 40)
returns setof public.mailer_job
language plpgsql
security definer
set search_path = public
as $$
declare
  v_global     integer := public.setting_int('daily_email_limit', 90) - public.emails_used_today(null);
  v_user_limit integer := public.setting_int('user_daily_email_limit', 30);
  v_used       jsonb := '{}'::jsonb;
  v_ids        uuid[] := '{}';
  v_id         uuid;
  v_weight     integer;
  v_u          integer;
  r            record;
begin
  if public.mailer_breaker_open() or v_global <= 0 then
    return;
  end if;

  -- Consommation du jour par artisan, calculée une seule fois
  select coalesce(jsonb_object_agg(user_id::text, used), '{}'::jsonb) into v_used
    from (select s.user_id, sum(cardinality(s.recipients) + case when s.kind = 'initial' then 1 else 0 end) as used
            from public.campaign_sends s
           where s.claimed_at >= public.paris_day_start() and s.status in ('sent', 'processing')
           group by s.user_id) u;

  for r in
    select c.id, c.user_id, c.followups_sent, c.recipients
      from public.campaigns c
     where c.status = 'active' and c.followup_enabled
       and c.next_followup_at is not null and c.next_followup_at <= now()
       and c.followups_sent < c.max_followups
       and coalesce((v_used ->> c.user_id::text)::integer, 0) < v_user_limit
     order by c.next_followup_at
     limit p_limit * 3
     for update of c skip locked
  loop
    v_weight := cardinality(r.recipients);
    exit when v_global < v_weight;
    v_u := coalesce((v_used ->> r.user_id::text)::integer, 0);
    continue when v_u + v_weight > v_user_limit;

    v_id := null;
    insert into public.campaign_sends (campaign_id, user_id, sequence, kind, recipients)
    values (r.id, r.user_id, r.followups_sent + 1, 'followup', r.recipients)
    on conflict (campaign_id, sequence) do update
      set status = 'processing', attempts = campaign_sends.attempts + 1,
          claimed_at = now(), error = null
    where (campaign_sends.status = 'failed' and campaign_sends.attempts < 3)
       or (campaign_sends.status = 'processing' and campaign_sends.claimed_at < now() - interval '15 minutes')
    returning id into v_id;

    if v_id is not null then
      v_ids := v_ids || v_id;
      v_global := v_global - v_weight;
      v_used := jsonb_set(v_used, array[r.user_id::text], to_jsonb(v_u + v_weight));
    end if;
    exit when cardinality(v_ids) >= p_limit;
  end loop;

  return query select * from public.mailer_jobs(v_ids);
end;
$$;

-- Envois initiaux restés en attente (crash, timeout, budget) : repris par le cron
create or replace function public.pending_initial_campaigns(p_limit integer default 10)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.campaigns
   where status = 'draft' and send_initial
     and initial_send_status in ('pending', 'processing', 'failed')
     and updated_at < now() - interval '10 minutes'
     and not exists (select 1 from public.campaign_sends s
                      where s.campaign_id = campaigns.id and s.sequence = 0
                        and s.status = 'failed' and s.attempts >= 3)
   order by updated_at
   limit p_limit;
$$;

-- Envoi réussi
create or replace function public.complete_send(p_send_id uuid, p_provider_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.campaign_sends%rowtype;
begin
  update public.campaign_sends
     set status = 'sent', provider_id = p_provider_id, sent_at = now(), error = null
   where id = p_send_id and status <> 'sent'
  returning * into s;
  if not found then return; end if;

  if s.kind = 'initial' then
    update public.campaigns
       set initial_send_status = 'sent', initial_sent_at = s.sent_at,
           status = case when status = 'draft' then 'active' else status end
     where id = s.campaign_id;
    insert into public.campaign_events (campaign_id, user_id, type, detail)
    values (s.campaign_id, s.user_id, 'initial_sent',
            jsonb_build_object('recipients', s.recipients, 'provider_id', p_provider_id));
  else
    update public.campaigns
       set followups_sent = greatest(followups_sent, s.sequence), last_followup_at = s.sent_at
     where id = s.campaign_id;
    insert into public.campaign_events (campaign_id, user_id, type, detail)
    values (s.campaign_id, s.user_id, 'followup_sent',
            jsonb_build_object('number', s.sequence, 'recipients', s.recipients, 'provider_id', p_provider_id));
  end if;

  perform public.campaign_reschedule(s.campaign_id);
end;
$$;

-- Envoi en échec : 3 tentatives, puis campagne suspendue avec la raison
create or replace function public.fail_send(p_send_id uuid, p_error text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.campaign_sends%rowtype;
  final boolean;
begin
  update public.campaign_sends
     set status = 'failed', error = left(p_error, 500)
   where id = p_send_id and status = 'processing'
  returning * into s;
  if not found then return; end if;

  final := s.attempts >= 3;

  if s.kind = 'initial' then
    update public.campaigns set initial_send_status = 'failed' where id = s.campaign_id;
  elsif final then
    update public.campaigns
       set status = 'paused', pause_reason = 'send_failed', next_followup_at = null
     where id = s.campaign_id and status = 'active';
  else
    update public.campaigns set next_followup_at = now() + interval '1 hour'
     where id = s.campaign_id and status = 'active';
  end if;

  insert into public.campaign_events (campaign_id, user_id, type, detail)
  values (s.campaign_id, s.user_id, case when s.kind = 'initial' then 'initial_failed' else 'followup_failed' end,
          jsonb_build_object('number', s.sequence, 'attempt', s.attempts, 'final', final, 'error', left(p_error, 300)));
end;
$$;

-- Réponse du prospect (webhook) : arrête les relances, renvoie de quoi transférer
drop function if exists public.register_reply(text, text, text, text);
create or replace function public.register_reply(
  p_token text, p_provider_email_id text, p_from text, p_subject text
)
returns table (
  campaign_id uuid, prospect_name text, subject text, user_email text,
  reply_to_email text, company_name text, already_processed boolean, can_forward boolean
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  c public.campaigns%rowtype;
  inserted boolean;
begin
  select * into c from public.campaigns where reply_token = p_token for update;

  insert into public.inbound_replies (provider_email_id, campaign_id, user_id, from_address, subject)
  values (p_provider_email_id, c.id, c.user_id, left(p_from, 300), left(p_subject, 300))
  on conflict (provider_email_id) do nothing;
  inserted := found;

  if c.id is null then return; end if;

  if inserted then
    update public.campaigns
       set replied_at = coalesce(replied_at, now()),
           status = case when status in ('draft', 'active', 'paused') then 'replied' else status end,
           next_followup_at = case when status in ('draft', 'active', 'paused') then null else next_followup_at end
     where id = c.id;
    insert into public.campaign_events (campaign_id, user_id, type, detail)
    values (c.id, c.user_id, 'reply_received',
            jsonb_build_object('from', left(p_from, 300), 'subject', left(p_subject, 300)));
  end if;

  return query
    select c.id, c.prospect_name, c.subject, p.email, p.reply_to_email, p.company_name, not inserted,
           -- anti-boucle et anti-coût : transferts limités par dossier, budget global respecté
           (select count(*) from public.inbound_replies r
             where r.campaign_id = c.id and r.created_at > now() - interval '24 hours')
             <= public.setting_int('reply_forward_daily_limit', 10)
           and public.emails_used_today(null) < public.setting_int('daily_email_limit', 90)
      from public.profiles p where p.id = c.user_id;
end;
$$;

create or replace function public.mark_reply_forwarded(p_provider_email_id text, p_error text default null)
returns void
language sql
security definer
set search_path = public
as $$
  update public.inbound_replies
     set forwarded = (p_error is null), forward_error = left(p_error, 500)
   where provider_email_id = p_provider_email_id;
$$;

-- ---------------------------------------------------------------------
-- 5 bis. CONSERVATION : purge des pièces jointes (appelée chaque nuit)
-- Les fichiers sont supprimés via l'API Storage par l'Edge Function, puis
-- les lignes sont retirées ici. Supabase interdit la suppression SQL directe.
-- ---------------------------------------------------------------------
create or replace function public.attachments_to_purge(p_limit integer default 200)
returns table (id uuid, storage_path text)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.storage_path
    from public.campaign_attachments a
    join public.campaigns c on c.id = a.campaign_id
   where c.status in ('replied', 'won', 'lost', 'completed', 'stopped')
     -- date de clôture réelle (updated_at bouge à chaque modification)
     and coalesce(c.won_at, c.lost_at, c.stopped_at, c.completed_at, c.replied_at, c.updated_at)
         < now() - make_interval(months => public.setting_int('attachment_retention_months', 12))
   order by 1
   limit p_limit;
$$;

create or replace function public.orphan_uploads(p_limit integer default 200)
returns setof text
language sql
stable
security definer
set search_path = public, storage
as $$
  select o.name
    from storage.objects o
   where o.bucket_id = 'devis'
     and o.created_at < now() - make_interval(days => public.setting_int('orphan_upload_retention_days', 2))
     and not exists (select 1 from public.campaign_attachments a where a.storage_path = o.name)
   order by o.created_at
   limit p_limit;
$$;

create or replace function public.forget_attachments(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  insert into public.campaign_events (campaign_id, user_id, type, detail)
  select a.campaign_id, a.user_id, 'attachments_purged',
         jsonb_build_object('files', jsonb_agg(a.file_name), 'retention_months', public.setting_int('attachment_retention_months', 12))
    from public.campaign_attachments a where a.id = any(p_ids)
   group by a.campaign_id, a.user_id;
  delete from public.campaign_attachments where id = any(p_ids);
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. ACTIONS DE L'ARTISAN (RPC appelées avec la session de l'utilisateur)
-- ---------------------------------------------------------------------
create or replace function public.campaign_action(p_id uuid, p_action text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.campaigns%rowtype;
  v_status text;
begin
  select * into c from public.campaigns where id = p_id and user_id = auth.uid() for update;
  if not found then
    raise exception 'Devis introuvable.' using errcode = 'P0001';
  end if;

  case p_action
    when 'pause' then
      if c.status <> 'active' then raise exception 'Seule une campagne en cours peut être suspendue.' using errcode = 'P0001'; end if;
      update public.campaigns set status = 'paused', pause_reason = 'manual', next_followup_at = null where id = p_id;
    when 'resume' then
      if c.status <> 'paused' then raise exception 'Cette campagne n''est pas suspendue.' using errcode = 'P0001'; end if;
      if c.initial_sent_at is null then raise exception 'Le devis n''a pas encore été envoyé.' using errcode = 'P0001'; end if;
      -- les tentatives épuisées sont effacées pour permettre un nouvel essai
      delete from public.campaign_sends where campaign_id = p_id and status = 'failed';
      update public.campaigns set status = 'active', pause_reason = null where id = p_id;
      perform public.campaign_reschedule(p_id);
    when 'retry_initial' then
      if c.status <> 'draft' or c.initial_send_status <> 'failed' then
        raise exception 'Aucun envoi en échec à relancer.' using errcode = 'P0001';
      end if;
      delete from public.campaign_sends where campaign_id = p_id and sequence = 0 and status = 'failed';
      update public.campaigns set initial_send_status = 'pending' where id = p_id;
    when 'stop' then
      if c.status in ('won', 'lost', 'stopped') then raise exception 'Campagne déjà clôturée.' using errcode = 'P0001'; end if;
      update public.campaigns set status = 'stopped', stopped_at = now(), next_followup_at = null where id = p_id;
    when 'won' then
      update public.campaigns set status = 'won', won_at = now(), lost_at = null, next_followup_at = null where id = p_id;
    when 'lost' then
      update public.campaigns set status = 'lost', lost_at = now(), won_at = null, next_followup_at = null where id = p_id;
    when 'replied' then
      update public.campaigns
         set status = case when status in ('active', 'paused', 'draft') then 'replied' else status end,
             replied_at = coalesce(replied_at, now()), next_followup_at = null
       where id = p_id;
    when 'reopen' then
      if c.initial_sent_at is null then raise exception 'Le devis n''a pas encore été envoyé.' using errcode = 'P0001'; end if;
      update public.campaigns
         set status = 'paused', pause_reason = 'manual', won_at = null, lost_at = null,
             stopped_at = null, completed_at = null
       where id = p_id;
    else
      raise exception 'Action inconnue.' using errcode = 'P0001';
  end case;

  insert into public.campaign_events (campaign_id, user_id, type, detail)
  values (p_id, c.user_id, p_action, jsonb_build_object('from_status', c.status));

  select status into v_status from public.campaigns where id = p_id;
  return v_status;
end;
$$;

create or replace function public.campaign_update_strategy(
  p_id uuid, p_followup_enabled boolean, p_interval_days integer, p_max_followups integer,
  p_end_date date, p_max_days integer, p_attach_on_followups boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.campaigns%rowtype;
begin
  select * into c from public.campaigns where id = p_id and user_id = auth.uid() for update;
  if not found then raise exception 'Devis introuvable.' using errcode = 'P0001'; end if;
  if p_max_followups < c.followups_sent then
    raise exception 'Le maximum ne peut pas être inférieur aux % relance(s) déjà envoyée(s).', c.followups_sent using errcode = 'P0001';
  end if;

  update public.campaigns
     set followup_enabled = p_followup_enabled, interval_days = p_interval_days,
         max_followups = p_max_followups, end_date = p_end_date, max_days = p_max_days,
         attach_on_followups = p_attach_on_followups,
         -- une campagne terminée relancée par une nouvelle stratégie repart
         status = case when status = 'completed' then 'active' else status end,
         completed_at = case when status = 'completed' then null else completed_at end
   where id = p_id;

  insert into public.campaign_events (campaign_id, user_id, type, detail)
  values (p_id, c.user_id, 'strategy_updated', jsonb_build_object(
    'followup_enabled', p_followup_enabled, 'interval_days', p_interval_days,
    'max_followups', p_max_followups, 'end_date', p_end_date, 'max_days', p_max_days));

  perform public.campaign_reschedule(p_id);
end;
$$;

-- ---------------------------------------------------------------------
-- 7. DROITS ET RLS
-- ---------------------------------------------------------------------
alter table public.campaigns            enable row level security;
alter table public.campaign_attachments enable row level security;
alter table public.campaign_sends       enable row level security;
alter table public.campaign_events      enable row level security;
alter table public.inbound_replies      enable row level security;

drop policy if exists campaigns_select_own on public.campaigns;
create policy campaigns_select_own on public.campaigns
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists campaigns_insert_own on public.campaigns;
create policy campaigns_insert_own on public.campaigns
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists campaigns_delete_own on public.campaigns;
create policy campaigns_delete_own on public.campaigns
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists attachments_select_own on public.campaign_attachments;
create policy attachments_select_own on public.campaign_attachments
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists attachments_insert_own on public.campaign_attachments;
create policy attachments_insert_own on public.campaign_attachments
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and storage_path like ((select auth.uid())::text || '/%')
    and exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = (select auth.uid()))
  );

drop policy if exists sends_select_own on public.campaign_sends;
create policy sends_select_own on public.campaign_sends
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists events_select_own on public.campaign_events;
create policy events_select_own on public.campaign_events
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists replies_select_own on public.inbound_replies;
create policy replies_select_own on public.inbound_replies
  for select to authenticated using ((select auth.uid()) = user_id);

-- Le client ne peut insérer que les champs « métier » ; tout le reste passe
-- par les fonctions ci-dessus.
revoke insert, update, delete on public.campaigns from anon, authenticated;
grant insert (user_id, idempotency_key, reference, prospect_name, recipients, subject, message,
              followup_message, amount, client_phone, notes, send_initial, initial_sent_at, followup_enabled,
              interval_days, max_followups, end_date, max_days, attach_on_followups)
  on public.campaigns to authenticated;
grant delete on public.campaigns to authenticated;

revoke insert, update, delete on public.campaign_attachments from anon, authenticated;
grant insert (campaign_id, user_id, storage_path, file_name, mime_type, size_bytes)
  on public.campaign_attachments to authenticated;

revoke insert, update, delete on public.campaign_sends   from anon, authenticated;
revoke insert, update, delete on public.campaign_events  from anon, authenticated;
revoke insert, update, delete on public.inbound_replies  from anon, authenticated;

-- Fonctions internes : serveur uniquement
revoke execute on function public.campaign_reschedule(uuid)                 from public, anon, authenticated;
revoke execute on function public.campaign_before_insert()                  from public, anon, authenticated;
revoke execute on function public.campaign_after_insert()                   from public, anon, authenticated;
revoke execute on function public.mailer_jobs(uuid[])                       from public, anon, authenticated;
revoke execute on function public.claim_initial_send(uuid)                  from public, anon, authenticated;
revoke execute on function public.claim_due_followups(integer)              from public, anon, authenticated;
revoke execute on function public.complete_send(uuid, text)                 from public, anon, authenticated;
revoke execute on function public.fail_send(uuid, text)                     from public, anon, authenticated;
revoke execute on function public.register_reply(text, text, text, text)    from public, anon, authenticated;
revoke execute on function public.mark_reply_forwarded(text, text)          from public, anon, authenticated;
revoke execute on function public.pending_initial_campaigns(integer)         from public, anon, authenticated;
revoke execute on function public.setting_int(text, integer)                 from public, anon, authenticated;
revoke execute on function public.emails_used_today(uuid)                    from public, anon, authenticated;
revoke execute on function public.mailer_breaker_open()                      from public, anon, authenticated;
revoke execute on function public.mailer_status()                            from public, anon, authenticated;
revoke execute on function public.attachments_to_purge(integer)              from public, anon, authenticated;
revoke execute on function public.orphan_uploads(integer)                    from public, anon, authenticated;
revoke execute on function public.forget_attachments(uuid[])                 from public, anon, authenticated;
revoke execute on function public.my_send_budget()                           from public, anon;
grant execute on function public.my_send_budget() to authenticated;
grant execute on function public.mailer_jobs(uuid[]), public.claim_initial_send(uuid),
  public.claim_due_followups(integer), public.complete_send(uuid, text), public.fail_send(uuid, text),
  public.register_reply(text, text, text, text), public.mark_reply_forwarded(text, text),
  public.pending_initial_campaigns(integer), public.mailer_status(),
  public.attachments_to_purge(integer), public.orphan_uploads(integer), public.forget_attachments(uuid[])
  to service_role;

-- Actions artisan : utilisateurs connectés uniquement
revoke execute on function public.campaign_action(uuid, text) from public, anon;
revoke execute on function public.campaign_update_strategy(uuid, boolean, integer, integer, date, integer, boolean) from public, anon;
grant execute on function public.campaign_action(uuid, text) to authenticated;
grant execute on function public.campaign_update_strategy(uuid, boolean, integer, integer, date, integer, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- 8. STOCKAGE DES PIÈCES JOINTES (bucket privé, 10 Mo / fichier)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('devis', 'devis', false, 10485760, array[
  'application/pdf', 'image/jpeg', 'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Chaque artisan n'accède qu'à son dossier : devis/<user_id>/...
drop policy if exists devis_select_own on storage.objects;
create policy devis_select_own on storage.objects for select to authenticated
  using (bucket_id = 'devis' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists devis_insert_own on storage.objects;
create policy devis_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'devis' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists devis_delete_own on storage.objects;
create policy devis_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'devis' and (storage.foldername(name))[1] = (select auth.uid())::text);
