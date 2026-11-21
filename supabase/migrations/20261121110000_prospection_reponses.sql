-- =====================================================================
-- Prospection : réponses et conversation, sur le même modèle que les devis
--
-- Devis      : réponse du client → devis-<jeton>@reponses.jercat.fr → resend-inbound
--              → campaign_messages + événement + alerte à l'artisan ; réponse depuis le site.
-- Prospection: réponse de l'artisan démarché → prospect-reponse-<jeton>@reponses.jercat.fr
--              → resend-inbound → prospect_messages + journal + alerte à Jercat ;
--              réponse depuis le site (envoyée par Gmail SMTP, dans le même fil).
-- Seule différence voulue : l'expédition (Gmail au lieu de Resend), voir la migration
-- 20261121100000_prospection_envoi_serveur.sql.
-- =====================================================================

-- 1. Adresse de réponse propre à chaque prospect (Reply-To des e-mails de prospection)
alter table public.prospects add column if not exists reply_token text;
select set_config('prospect.via_function', 'on', false);
update public.prospects set reply_token = encode(extensions.gen_random_bytes(12), 'hex') where reply_token is null;
select set_config('prospect.via_function', 'off', false);
alter table public.prospects alter column reply_token set default encode(extensions.gen_random_bytes(12), 'hex');
alter table public.prospects alter column reply_token set not null;
create unique index if not exists prospects_reply_token_key on public.prospects (reply_token);

-- 2. Messages échangés (mêmes colonnes que campaign_messages)
create table if not exists public.prospect_messages (
  id                uuid primary key default gen_random_uuid(),
  prospect_id       uuid not null references public.prospects (id) on delete cascade,
  direction         text not null check (direction in ('in', 'out')),
  kind              text not null default 'reply' check (kind in ('reply', 'auto_reply', 'opt_out', 'suspicious', 'jercat')),
  from_address      text check (char_length(from_address) <= 320),
  to_addresses      text[] not null default '{}',
  subject           text check (char_length(subject) <= 300),
  body              text not null default '' check (char_length(body) <= 20000),
  provider_email_id text unique,
  message_id        text check (char_length(message_id) <= 500),
  in_reply_to       text check (char_length(in_reply_to) <= 500),
  status            text not null default 'received' check (status in ('received', 'sending', 'sent', 'failed')),
  error             text check (char_length(error) <= 500),
  smtp_response     text check (char_length(smtp_response) <= 500),
  files_note        text check (char_length(files_note) <= 1000),
  read_at           timestamptz,
  sent_at           timestamptz,
  created_at        timestamptz not null default now()
);
create index if not exists prospect_messages_prospect_idx on public.prospect_messages (prospect_id, created_at);
create index if not exists prospect_messages_unread_idx on public.prospect_messages (prospect_id) where direction = 'in' and read_at is null;

alter table public.prospect_messages enable row level security;
revoke all on public.prospect_messages from anon, authenticated;
grant select on public.prospect_messages to authenticated;
drop policy if exists "prospect_messages_admin_read" on public.prospect_messages;
create policy "prospect_messages_admin_read" on public.prospect_messages
  for select to authenticated using ((select public.is_platform_admin()));
drop trigger if exists prospect_messages_write_guard on public.prospect_messages;
create trigger prospect_messages_write_guard before insert or update or delete on public.prospect_messages
  for each row execute function public.prospect_write_guard();

-- 3. Réception d'une réponse (appelée par resend-inbound, rôle service)
create or replace function public.prospect_register_inbound(
  p_token text, p_provider_email_id text, p_from text, p_to text[], p_subject text, p_body text,
  p_kind text, p_message_id text, p_files_note text default null
) returns table (prospect_id uuid, company text, prospect_email text, last_subject text, already boolean, kind text, sender_matches boolean)
language plpgsql security definer set search_path = public as $$
declare p public.prospects; k text := p_kind; m_id uuid; matches boolean; subj text;
begin
  perform set_config('prospect.via_function', 'on', true);
  select * into p from public.prospects where reply_token = lower(p_token) for update;
  if not found then return; end if;
  select coalesce(x.subject_snapshot, p.subject) into subj from public.prospect_attempts x
   where x.prospect_id = p.id and x.channel = 'email' and x.state in ('envoyee', 'verifiee') order by x.opened_at desc limit 1;
  subj := coalesce(subj, p.subject);
  if exists (select 1 from public.prospect_messages where provider_email_id = p_provider_email_id) then
    return query select p.id, p.company, p.email, subj, true, k, true; return;
  end if;
  if k not in ('reply', 'auto_reply', 'opt_out', 'suspicious') then k := 'reply'; end if;
  matches := p.email is not null and position(lower(p.email) in lower(coalesce(p_from, ''))) > 0;
  insert into public.prospect_messages (prospect_id, direction, kind, from_address, to_addresses, subject, body,
                                        provider_email_id, message_id, status, files_note)
  values (p.id, 'in', k, left(p_from, 320), coalesce(p_to, '{}'), left(p_subject, 300), left(coalesce(p_body, ''), 20000),
          p_provider_email_id, left(p_message_id, 500), 'received', left(p_files_note, 1000))
  returning id into m_id;
  if k = 'reply' then
    update public.prospects
       set stage = case when stage in ('a_preparer', 'pret', 'contacte') then 'en_discussion' else stage end,
           version = version + 1, updated_at = now()
     where id = p.id;
  elsif k = 'opt_out' then
    update public.prospects
       set stage = 'ne_plus_contacter', do_not_contact_at = coalesce(do_not_contact_at, now()),
           do_not_contact_reason = coalesce(do_not_contact_reason, 'A répondu « STOP » par e-mail'),
           version = version + 1, updated_at = now()
     where id = p.id;
  end if;
  insert into public.prospect_events (prospect_id, actor, type, detail)
  values (p.id, 'reception',
          case k when 'reply' then 'reponse_recue' when 'opt_out' then 'stop_recu' when 'auto_reply' then 'reponse_automatique' else 'message_non_authentifie' end,
          jsonb_build_object('from', p_from, 'subject', p_subject, 'email_id', p_provider_email_id, 'message', m_id,
                             'unexpected_sender', not matches));
  return query select p.id, p.company, p.email, subj, false, k, matches;
end;
$$;

-- 4. Répondre depuis le site — étape A : réserver (le message apparaît « envoi en cours »)
create or replace function public.prospect_reply_begin(p_id uuid, p_body text)
returns table (message_id uuid, to_address text, subject text, in_reply_to text, reply_token text)
language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); p public.prospects; m public.prospect_messages; subj text; parent text; sent_today integer;
begin
  select * into p from public.prospects where id = p_id for update;
  if not found then raise exception 'Prospect introuvable.' using errcode = 'P0002'; end if;
  if p.do_not_contact_at is not null then raise exception 'Ce prospect ne veut plus être contacté (STOP).' using errcode = 'P0001'; end if;
  if p.archived_at is not null then raise exception 'Prospect archivé.' using errcode = 'P0001'; end if;
  if p.email is null then raise exception 'Aucune adresse e-mail pour ce prospect.' using errcode = 'P0001'; end if;
  if char_length(trim(coalesce(p_body, ''))) < 2 then raise exception 'Écrivez votre message.' using errcode = 'P0001'; end if;
  if char_length(p_body) > 5000 then raise exception 'Message trop long (5000 caractères maximum).' using errcode = 'P0001'; end if;
  if exists (select 1 from public.prospect_messages x where x.prospect_id = p_id and x.direction = 'out' and x.status = 'sending'
              and x.created_at > now() - interval '2 minutes') then
    raise exception 'Un message est déjà en cours d''envoi.' using errcode = 'P0001';
  end if;
  select count(*) into sent_today from public.prospect_messages x where x.direction = 'out' and x.status = 'sent' and x.sent_at > now() - interval '24 hours';
  if sent_today >= 100 then raise exception 'Limite de 100 réponses par 24 h atteinte.' using errcode = 'P0001'; end if;
  -- Même fil que la conversation : objet « Re: … », en réponse au dernier message reçu
  select x.subject, x.message_id into subj, parent from public.prospect_messages x
   where x.prospect_id = p_id and x.direction = 'in' order by x.created_at desc limit 1;
  if subj is null then
    select x.subject_snapshot, x.smtp_message_id into subj, parent from public.prospect_attempts x
     where x.prospect_id = p_id and x.channel = 'email' and x.state in ('envoyee', 'verifiee') order by x.opened_at desc limit 1;
  end if;
  subj := coalesce(subj, p.subject, 'Artisan Relance');
  subj := left('Re: ' || regexp_replace(subj, '^\s*((re|tr|fw|fwd)\s*:\s*)+', '', 'i'), 300);
  insert into public.prospect_messages (prospect_id, direction, kind, from_address, to_addresses, subject, body, in_reply_to, status)
  values (p_id, 'out', 'jercat', null, array[p.email], subj, p_body, parent, 'sending')
  returning * into m;
  perform public._prospect_log(p_id, null, 'utilisateur', 'reponse_demandee', jsonb_build_object('message', m.id, 'destinataire', p.email));
  return query select m.id, p.email, subj, parent, p.reply_token;
end;
$$;

-- 5. Répondre depuis le site — étape B : résultat réel de l'envoi SMTP
create or replace function public.prospect_reply_result(p_message_id uuid, p_ok boolean, p_smtp_message_id text, p_response text, p_error text)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); m public.prospect_messages;
begin
  select * into m from public.prospect_messages where id = p_message_id for update;
  if not found or m.direction <> 'out' then raise exception 'Message introuvable.' using errcode = 'P0002'; end if;
  if m.status <> 'sending' then raise exception 'Ce message n''est plus en cours d''envoi.' using errcode = 'P0001'; end if;
  if p_ok then
    update public.prospect_messages
       set status = 'sent', sent_at = now(), message_id = left(p_smtp_message_id, 500), smtp_response = left(p_response, 500)
     where id = p_message_id;
    update public.prospects set stage = case when stage in ('pret', 'contacte') then 'en_discussion' else stage end,
           version = version + 1, updated_at = now() where id = m.prospect_id;
    perform public._prospect_log(m.prospect_id, null, 'systeme', 'reponse_envoyee',
      jsonb_build_object('message', m.id, 'message_id', p_smtp_message_id, 'reponse_smtp', p_response));
  else
    update public.prospect_messages set status = 'failed', error = left(coalesce(p_error, 'Erreur inconnue'), 500), smtp_response = left(p_response, 500)
     where id = p_message_id;
    perform public._prospect_log(m.prospect_id, null, 'systeme', 'reponse_echec',
      jsonb_build_object('message', m.id, 'erreur', p_error, 'reponse_smtp', p_response));
  end if;
end;
$$;

-- 6. Réponses marquées comme lues à l'ouverture (comme dans un dossier de devis)
create or replace function public.prospect_mark_read(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin();
begin
  update public.prospect_messages set read_at = now() where prospect_id = p_id and direction = 'in' and read_at is null;
end;
$$;

-- 7. Droits
revoke execute on function public.prospect_register_inbound(text, text, text, text[], text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.prospect_register_inbound(text, text, text, text[], text, text, text, text, text) to service_role;
revoke execute on function public.prospect_reply_begin(uuid, text), public.prospect_reply_result(uuid, boolean, text, text, text),
  public.prospect_mark_read(uuid) from public, anon;
grant execute on function public.prospect_reply_begin(uuid, text), public.prospect_reply_result(uuid, boolean, text, text, text),
  public.prospect_mark_read(uuid) to authenticated;
