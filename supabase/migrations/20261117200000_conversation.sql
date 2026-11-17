-- =====================================================================
-- Conversation client dans le site (« niveau 2 »)
--  - les réponses des clients sont enregistrées dans le dossier (texte +
--    pièces jointes filtrées et réduites), l'artisan peut répondre depuis
--    la fiche du devis ;
--  - notification à l'artisan au choix : alerte courte (défaut),
--    transfert complet, ou aucun e-mail ;
--  - conservation : pièces jointes 6 mois, messages 24 mois.
-- =====================================================================

-- 1. Réglage de notification
alter table public.profiles
  add column if not exists reply_notification text not null default 'alert';
alter table public.profiles drop constraint if exists profiles_reply_notification_check;
alter table public.profiles add constraint profiles_reply_notification_check
  check (reply_notification in ('alert', 'full', 'none'));
grant update (reply_notification) on public.profiles to authenticated;

insert into public.platform_settings (key, value, description) values
  ('message_file_retention_months', '6', 'Conservation des pièces jointes des messages clients (mois)'),
  ('message_retention_months', '24', 'Conservation du texte des messages (mois)'),
  ('user_daily_message_limit', '20', 'Réponses envoyées depuis le site par artisan et par jour')
on conflict (key) do nothing;

-- 2. Messages (entrants : réponses des clients ; sortants : réponses de l'artisan)
create table if not exists public.campaign_messages (
  id                uuid primary key default gen_random_uuid(),
  campaign_id       uuid not null references public.campaigns (id) on delete cascade,
  user_id           uuid not null references public.profiles (id) on delete cascade,
  direction         text not null check (direction in ('in', 'out')),
  kind              text not null default 'reply'
                    check (kind in ('reply', 'auto_reply', 'opt_out', 'suspicious', 'artisan')),
  from_address      text check (char_length(from_address) <= 320),
  to_addresses      text[] not null default '{}',
  subject           text check (char_length(subject) <= 300),
  body              text not null default '' check (char_length(body) <= 20000),
  provider_email_id text unique,
  message_id        text check (char_length(message_id) <= 500),
  status            text not null default 'received'
                    check (status in ('received', 'queued', 'sending', 'sent', 'failed')),
  attempts          integer not null default 0,
  error             text,
  files_note        text check (char_length(files_note) <= 1000),
  read_at           timestamptz,
  sent_at           timestamptz,
  created_at        timestamptz not null default now()
);
create index if not exists campaign_messages_campaign_idx on public.campaign_messages (campaign_id, created_at);
create index if not exists campaign_messages_unread_idx on public.campaign_messages (user_id)
  where direction = 'in' and read_at is null;
create index if not exists campaign_messages_queue_idx on public.campaign_messages (status, created_at)
  where direction = 'out' and status in ('queued', 'failed');
alter table public.campaign_messages enable row level security;
revoke all on public.campaign_messages from anon, authenticated;
grant select on public.campaign_messages to authenticated;
drop policy if exists campaign_messages_select_own on public.campaign_messages;
create policy campaign_messages_select_own on public.campaign_messages for select to authenticated
  using (user_id = (select auth.uid()));

create table if not exists public.campaign_message_files (
  id                  uuid primary key default gen_random_uuid(),
  message_id          uuid not null references public.campaign_messages (id) on delete cascade,
  user_id             uuid not null references public.profiles (id) on delete cascade,
  storage_path        text not null unique,
  file_name           text not null check (char_length(file_name) between 1 and 200),
  mime_type           text not null,
  size_bytes          integer not null check (size_bytes > 0),
  original_size_bytes integer,
  created_at          timestamptz not null default now()
);
create index if not exists campaign_message_files_message_idx on public.campaign_message_files (message_id);
alter table public.campaign_message_files enable row level security;
revoke all on public.campaign_message_files from anon, authenticated;
grant select on public.campaign_message_files to authenticated;
drop policy if exists campaign_message_files_select_own on public.campaign_message_files;
create policy campaign_message_files_select_own on public.campaign_message_files for select to authenticated
  using (user_id = (select auth.uid()));

-- Réponses reçues avant cette version : rattachées au dossier (le texte complet est dans la boîte mail)
insert into public.campaign_messages (campaign_id, user_id, direction, kind, from_address, subject, body, provider_email_id, status, read_at, created_at)
select r.campaign_id, r.user_id, 'in', coalesce(nullif(r.kind, 'artisan_copy'), 'reply'), r.from_address, r.subject,
       '(Réponse reçue avant l''affichage des messages dans le site : son texte complet est dans votre boîte mail.)',
       r.provider_email_id, 'received', now(), r.created_at
  from public.inbound_replies r
 where r.campaign_id is not null and r.user_id is not null and coalesce(r.kind, 'reply') <> 'artisan_copy'
on conflict (provider_email_id) do nothing;

-- 3. Stockage privé des pièces jointes reçues (10 Mo par fichier, types limités)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('messages', 'messages', false, 10485760, array[
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.spreadsheet', 'text/plain'
])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists messages_select_own on storage.objects;
create policy messages_select_own on storage.objects for select to authenticated
  using (bucket_id = 'messages' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 4. Réception : enregistrement du message et de ses fichiers (service_role)
create or replace function public.register_inbound_message(
  p_campaign_id uuid, p_provider_email_id text, p_from text, p_to text[], p_subject text,
  p_body text, p_kind text, p_message_id text
)
returns table (message_id uuid, already boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.campaigns%rowtype;
  v_id uuid;
begin
  select * into c from public.campaigns where id = p_campaign_id;
  if c.id is null then return; end if;
  insert into public.campaign_messages
    (campaign_id, user_id, direction, kind, from_address, to_addresses, subject, body, provider_email_id, message_id, status)
  values
    (c.id, c.user_id, 'in',
     case when p_kind in ('reply', 'auto_reply', 'opt_out', 'suspicious') then p_kind else 'reply' end,
     left(p_from, 320), coalesce(p_to, '{}'), left(p_subject, 300), left(coalesce(p_body, ''), 20000),
     p_provider_email_id, left(p_message_id, 500), 'received')
  on conflict (provider_email_id) do nothing
  returning id into v_id;
  if v_id is not null then
    return query select v_id, false;
  else
    return query select m.id, true from public.campaign_messages m where m.provider_email_id = p_provider_email_id;
  end if;
end;
$$;

create or replace function public.add_message_file(
  p_message_id uuid, p_path text, p_name text, p_mime text, p_size integer, p_original_size integer
)
returns uuid
language sql
security definer
set search_path = public
as $$
  insert into public.campaign_message_files (message_id, user_id, storage_path, file_name, mime_type, size_bytes, original_size_bytes)
  select m.id, m.user_id, p_path, left(p_name, 200), p_mime, p_size, p_original_size
    from public.campaign_messages m where m.id = p_message_id
  on conflict (storage_path) do nothing
  returning id;
$$;

create or replace function public.set_message_files_note(p_message_id uuid, p_note text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.campaign_messages set files_note = nullif(left(p_note, 1000), '') where id = p_message_id;
$$;

-- 5. Réponse de l'artisan depuis le site
create or replace function public.send_campaign_message(p_campaign_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  c        public.campaigns%rowtype;
  v_body   text := btrim(coalesce(p_body, ''));
  v_id     uuid;
  v_url    text;
  v_secret text;
begin
  select * into c from public.campaigns where id = p_campaign_id and user_id = auth.uid();
  if c.id is null then
    raise exception 'Dossier introuvable.' using errcode = 'P0001';
  end if;
  if char_length(v_body) < 2 then
    raise exception 'Message requis.' using errcode = 'P0001';
  end if;
  if char_length(v_body) > 5000 then
    raise exception 'Message trop long (5 000 caractères maximum).' using errcode = 'P0001';
  end if;
  if c.initial_sent_at is null and not exists (
    select 1 from public.campaign_messages m where m.campaign_id = c.id and m.direction = 'in'
  ) then
    raise exception 'Le devis n''a pas encore été envoyé.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.campaign_events e where e.campaign_id = c.id and e.type in ('opt_out', 'delivery_complained')) then
    raise exception 'Envoi impossible, ce client a demandé à ne plus recevoir d''e-mails (STOP) ou les a signalés comme indésirables.'
      using errcode = 'P0001';
  end if;
  if (select count(*) from public.campaign_messages m
       where m.user_id = c.user_id and m.direction = 'out' and m.created_at >= public.paris_day_start())
     >= public.setting_int('user_daily_message_limit', 20) then
    raise exception 'Limite de réponses du jour atteinte. Réessayez demain.' using errcode = 'P0001';
  end if;
  if public.emails_used_today(c.user_id) + cardinality(c.recipients) > public.setting_int('user_daily_email_limit', 30)
     or public.emails_used_today(null) + cardinality(c.recipients) > public.setting_int('daily_email_limit', 90) then
    raise exception 'Limite d''envoi du jour atteinte. Réessayez demain.' using errcode = 'P0001';
  end if;

  insert into public.campaign_messages (campaign_id, user_id, direction, kind, to_addresses, body, status)
  values (c.id, c.user_id, 'out', 'artisan', c.recipients, v_body, 'queued')
  returning id into v_id;

  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'mailer_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'mailer_secret';
  if v_url is not null and v_secret is not null then
    perform net.http_post(
      url     := v_url,
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret),
      body    := jsonb_build_object('mode', 'message', 'message_id', v_id),
      timeout_milliseconds := 60000
    );
  end if;
  return v_id;
end;
$$;

-- Réservation d'un message sortant par le mailer (au plus 3 essais)
create or replace function public.claim_campaign_message(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.campaign_messages%rowtype;
  c public.campaigns%rowtype;
  p public.profiles%rowtype;
begin
  update public.campaign_messages
     set status = 'sending', attempts = attempts + 1
   where id = p_id and direction = 'out' and status in ('queued', 'failed') and attempts < 3
  returning * into m;
  if m.id is null then return null; end if;
  select * into c from public.campaigns where id = m.campaign_id;
  select * into p from public.profiles where id = m.user_id;
  return jsonb_build_object(
    'message_id', m.id, 'body', m.body, 'to', m.to_addresses, 'attempts', m.attempts,
    'campaign_id', c.id, 'reference', c.reference, 'prospect_name', c.prospect_name, 'subject', c.subject,
    'amount', c.amount, 'initial_sent_at', c.initial_sent_at, 'reply_token', c.reply_token,
    'company_name', p.company_name, 'contact_name', p.contact_name, 'phone', p.phone,
    'user_email', p.email, 'reply_to_email', p.reply_to_email,
    'initial_message_id', (select s.message_id from public.campaign_sends s
                            where s.campaign_id = c.id and s.sequence = 0 and s.status = 'sent'),
    'initial_provider_id', (select s.provider_id from public.campaign_sends s
                             where s.campaign_id = c.id and s.sequence = 0 and s.status = 'sent'),
    'thread', coalesce((select jsonb_agg(x.message_id order by x.created_at)
                          from (select message_id, created_at from public.campaign_messages
                                 where campaign_id = c.id and message_id is not null
                                 order by created_at desc limit 8) x), '[]'::jsonb)
  );
end;
$$;

create or replace function public.complete_campaign_message(p_id uuid, p_provider_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.campaign_messages%rowtype;
begin
  update public.campaign_messages
     set status = 'sent', provider_email_id = p_provider_id, sent_at = now(), error = null
   where id = p_id
  returning * into m;
  if m.id is not null then
    insert into public.campaign_events (campaign_id, user_id, type, detail)
    values (m.campaign_id, m.user_id, 'message_sent', jsonb_build_object('recipients', m.to_addresses));
  end if;
end;
$$;

create or replace function public.fail_campaign_message(p_id uuid, p_error text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.campaign_messages set status = 'failed', error = left(p_error, 500) where id = p_id;
$$;

-- Messages restés en attente (appel manqué, panne) : repris par le passage de 15 min
create or replace function public.pending_campaign_messages(p_limit integer default 20)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.campaign_messages
   where direction = 'out' and status in ('queued', 'failed') and attempts < 3
     and created_at < now() - interval '2 minutes'
   order by created_at
   limit p_limit;
$$;

-- Lecture : marque les réponses d'un dossier comme lues
create or replace function public.mark_campaign_messages_read(p_campaign_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.campaign_messages set read_at = now()
   where campaign_id = p_campaign_id and user_id = auth.uid() and direction = 'in' and read_at is null;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- 6. Budget d'envoi : les réponses de l'artisan comptent comme des e-mails
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
  + coalesce((select sum(cardinality(m.to_addresses)) from public.campaign_messages m
               where m.direction = 'out' and m.created_at >= public.paris_day_start()
                 and m.status in ('queued', 'sending', 'sent')
                 and (p_user is null or m.user_id = p_user)), 0)
  )::integer;
$$;

-- 7. Conservation : pièces jointes 6 mois (+ fichiers orphelins), messages 24 mois
create or replace function public.message_files_to_purge(p_limit integer default 200)
returns table (id uuid, storage_path text)
language sql
stable
security definer
set search_path = public, storage
as $$
  (select f.id, f.storage_path from public.campaign_message_files f
    where f.created_at < now() - make_interval(months => public.setting_int('message_file_retention_months', 6))
    order by f.created_at limit p_limit)
  union all
  (select null::uuid, o.name from storage.objects o
    where o.bucket_id = 'messages'
      and o.created_at < now() - interval '2 days'
      and not exists (select 1 from public.campaign_message_files f where f.storage_path = o.name)
    order by o.created_at limit p_limit);
$$;

create or replace function public.forget_message_files(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.campaign_messages m
     set files_note = left(coalesce(m.files_note || ' ', '') || 'Pièces jointes supprimées automatiquement (conservation de '
                      || public.setting_int('message_file_retention_months', 6) || ' mois).', 1000)
   where m.id in (select f.message_id from public.campaign_message_files f where f.id = any(p_ids));
  delete from public.campaign_message_files where id = any(p_ids);
  get diagnostics n = row_count;
  return n;
end;
$$;

select cron.unschedule('artisan-relance-messages-purge')
 where exists (select 1 from cron.job where jobname = 'artisan-relance-messages-purge');
select cron.schedule('artisan-relance-messages-purge', '50 2 * * *', $$
  delete from public.campaign_messages
   where created_at < now() - make_interval(months => public.setting_int('message_retention_months', 24))
     and not exists (select 1 from public.campaign_message_files f where f.message_id = campaign_messages.id);
  delete from public.inbound_replies where created_at < now() - interval '13 months';
  delete from public.email_delivery_issues where created_at < now() - interval '13 months';
$$);

-- 8. Droits : fonctions du service réservées au mailer et à la réception
revoke execute on function public.register_inbound_message(uuid, text, text, text[], text, text, text, text) from public, anon, authenticated;
revoke execute on function public.add_message_file(uuid, text, text, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.set_message_files_note(uuid, text) from public, anon, authenticated;
revoke execute on function public.claim_campaign_message(uuid) from public, anon, authenticated;
revoke execute on function public.complete_campaign_message(uuid, text) from public, anon, authenticated;
revoke execute on function public.fail_campaign_message(uuid, text) from public, anon, authenticated;
revoke execute on function public.pending_campaign_messages(integer) from public, anon, authenticated;
revoke execute on function public.message_files_to_purge(integer) from public, anon, authenticated;
revoke execute on function public.forget_message_files(uuid[]) from public, anon, authenticated;
grant execute on function public.register_inbound_message(uuid, text, text, text[], text, text, text, text),
  public.add_message_file(uuid, text, text, text, integer, integer), public.set_message_files_note(uuid, text),
  public.claim_campaign_message(uuid), public.complete_campaign_message(uuid, text), public.fail_campaign_message(uuid, text),
  public.pending_campaign_messages(integer), public.message_files_to_purge(integer), public.forget_message_files(uuid[])
  to service_role;
revoke execute on function public.send_campaign_message(uuid, text) from public, anon;
revoke execute on function public.mark_campaign_messages_read(uuid) from public, anon;
grant execute on function public.send_campaign_message(uuid, text), public.mark_campaign_messages_read(uuid) to authenticated;
revoke execute on function public.emails_used_today(uuid) from public, anon, authenticated;
grant execute on function public.emails_used_today(uuid) to service_role;
