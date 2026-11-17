-- =====================================================================
-- Pièces jointes dans les réponses écrites par l'artisan depuis le site
--  - téléversement direct dans le bucket privé « messages », dossier
--    <uid>/out/… (l'artisan ne peut écrire que dans son propre dossier) ;
--  - 5 fichiers et 15 Mo au plus par réponse (photos réduites dans le
--    navigateur avant l'envoi) ;
--  - fichiers jamais envoyés : supprimés après 2 jours (purge existante).
-- =====================================================================
drop policy if exists messages_insert_own on storage.objects;
create policy messages_insert_own on storage.objects for insert to authenticated
  with check (
    bucket_id = 'messages'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'out'
  );

create or replace function public.send_campaign_message(p_campaign_id uuid, p_body text, p_files jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  c        public.campaigns%rowtype;
  v_body   text := btrim(coalesce(p_body, ''));
  v_files  jsonb := coalesce(p_files, '[]'::jsonb);
  v_count  integer;
  v_total  bigint := 0;
  v_id     uuid;
  v_url    text;
  v_secret text;
  f        record;
  o        record;
begin
  select * into c from public.campaigns where id = p_campaign_id and user_id = auth.uid();
  if c.id is null then
    raise exception 'Dossier introuvable.' using errcode = 'P0001';
  end if;
  if jsonb_typeof(v_files) <> 'array' then
    raise exception 'Pièces jointes invalides.' using errcode = 'P0001';
  end if;
  v_count := jsonb_array_length(v_files);
  if v_count > 5 then
    raise exception 'Pièces jointes : 5 fichiers maximum.' using errcode = 'P0001';
  end if;
  if char_length(v_body) < 2 and v_count = 0 then
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

  -- Fichiers : déjà téléversés par l'artisan, dans SON dossier d'envoi, jamais réutilisés
  for f in select * from jsonb_to_recordset(v_files) as x(path text, name text) loop
    if f.path is null or f.path not like auth.uid()::text || '/out/%' then
      raise exception 'Pièce jointe invalide.' using errcode = 'P0001';
    end if;
    select (so.metadata->>'size')::bigint as size, so.metadata->>'mimetype' as mime into o
      from storage.objects so where so.bucket_id = 'messages' and so.name = f.path;
    if o.size is null then
      raise exception 'Pièce jointe introuvable : renvoyez-la.' using errcode = 'P0001';
    end if;
    if exists (select 1 from public.campaign_message_files mf where mf.storage_path = f.path) then
      raise exception 'Pièce jointe déjà envoyée.' using errcode = 'P0001';
    end if;
    v_total := v_total + o.size;
  end loop;
  if v_total > 15 * 1024 * 1024 then
    raise exception 'Pièces jointes : 15 Mo maximum au total.' using errcode = 'P0001';
  end if;

  insert into public.campaign_messages (campaign_id, user_id, direction, kind, to_addresses, body, status)
  values (c.id, c.user_id, 'out', 'artisan', c.recipients, v_body, 'queued')
  returning id into v_id;

  insert into public.campaign_message_files (message_id, user_id, storage_path, file_name, mime_type, size_bytes, original_size_bytes)
  select v_id, c.user_id, x.path, left(coalesce(nullif(btrim(x.name), ''), 'fichier'), 200),
         coalesce(so.metadata->>'mimetype', 'application/octet-stream'), (so.metadata->>'size')::integer, null
    from jsonb_to_recordset(v_files) as x(path text, name text)
    join storage.objects so on so.bucket_id = 'messages' and so.name = x.path;

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

-- L'ancienne version (texte seul) appelle la nouvelle
create or replace function public.send_campaign_message(p_campaign_id uuid, p_body text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public.send_campaign_message(p_campaign_id, p_body, '[]'::jsonb);
$$;

-- Le mailer reçoit la liste des fichiers à joindre
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
                                 order by created_at desc limit 8) x), '[]'::jsonb),
    'files', coalesce((select jsonb_agg(jsonb_build_object('path', f.storage_path, 'name', f.file_name) order by f.created_at, f.storage_path)
                         from public.campaign_message_files f where f.message_id = m.id), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.send_campaign_message(uuid, text, jsonb) from public, anon;
grant execute on function public.send_campaign_message(uuid, text, jsonb) to authenticated;
