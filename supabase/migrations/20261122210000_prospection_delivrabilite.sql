-- =====================================================================
-- Prospection — délivrabilité (boîte de réception principale plutôt que Promotions / spam)
--  1. Prénom du contact (facultatif) sur la fiche.
--  2. Personnalisation au moment de l'envoi : {prenom}, {entreprise}, {ville} dans l'objet et le message.
--     Le texte ENVOYÉ (personnalisé) est celui conservé dans la tentative (preuve, historique).
--  3. Rythme d'un envoi fait à la main : 90 s minimum entre deux envois automatiques,
--     20 envois par 24 h au plus (fiches de test exclues).
-- =====================================================================

alter table public.prospects add column if not exists first_name text;
alter table public.prospects drop constraint if exists prospects_first_name_len;
alter table public.prospects add constraint prospects_first_name_len check (first_name is null or char_length(first_name) <= 60);

create or replace function public._prospect_daily_cap() returns integer language sql immutable as $$ select 20 $$;
create or replace function public._prospect_min_gap_seconds() returns integer language sql immutable as $$ select 90 $$;

-- Ville affichable : « Liège (BE) » → « Liège », « Laon (02) » → « Laon »
create or replace function public._prospect_city_label(p_city text) returns text
language sql immutable as $$ select nullif(trim(regexp_replace(coalesce(p_city, ''), '\s*\([^)]*\)\s*$', '')), '') $$;

-- Remplace {prenom}, {entreprise}, {ville}. Sans prénom : « Bonjour {prenom}, » devient « Bonjour, ».
create or replace function public._prospect_render(p_text text, p_first_name text, p_company text, p_city text) returns text
language plpgsql immutable as $$
declare t text := coalesce(p_text, ''); fn text := nullif(trim(coalesce(p_first_name, '')), '');
begin
  if fn is null then
    t := regexp_replace(t, '[ \t]*\{prenom\}', '', 'gi');
  else
    t := regexp_replace(t, '\{prenom\}', fn, 'gi');
  end if;
  t := regexp_replace(t, '\{entreprise\}', coalesce(nullif(trim(p_company), ''), 'votre entreprise'), 'gi');
  t := regexp_replace(t, '\{ville\}', coalesce(public._prospect_city_label(p_city), 'votre secteur'), 'gi');
  return t;
end $$;

-- ---------------------------------------------------------------------
-- Création : prénom facultatif (nouvelle signature, l'ancienne est retirée)
-- ---------------------------------------------------------------------
drop function if exists public.prospect_create(text, text, text, text, text, text, text, text, text, text, text, text, text, text, date);
create or replace function public.prospect_create(
  p_company text, p_city text, p_trade text, p_website text, p_email text, p_phone text, p_channel text,
  p_why text, p_findings text, p_subject text, p_message text, p_caution text,
  p_source_label text, p_source_url text, p_source_checked_at date, p_first_name text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); new_id uuid;
begin
  if coalesce(trim(p_company), '') = '' or coalesce(trim(p_city), '') = '' or coalesce(trim(p_trade), '') = '' then
    raise exception 'Entreprise, ville et métier sont obligatoires.' using errcode = 'P0001';
  end if;
  if coalesce(trim(p_source_label), '') = '' or p_source_checked_at is null then
    raise exception 'Indiquez d''où viennent les coordonnées et quand elles ont été vérifiées.' using errcode = 'P0001';
  end if;
  if nullif(trim(p_email), '') is null and nullif(trim(p_phone), '') is null and nullif(trim(p_website), '') is null then
    raise exception 'Au moins un moyen de contact est nécessaire.' using errcode = 'P0001';
  end if;
  if p_channel not in ('email', 'formulaire', 'telephone') then raise exception 'Canal inconnu.' using errcode = 'P0001'; end if;
  if exists (select 1 from public.prospects where archived_at is null
              and (lower(email) = lower(nullif(trim(p_email), ''))
                   or (public._prospect_norm(company) = public._prospect_norm(p_company)
                       and public._prospect_norm(city) = public._prospect_norm(p_city)))) then
    raise exception 'Ce prospect existe déjà (même e-mail, ou même entreprise dans la même ville).' using errcode = 'P0001';
  end if;
  insert into public.prospects (company, city, trade, website, email, phone, channel, why, findings, subject, message, caution,
                                source_label, source_url, source_checked_at, position, stage, first_name)
  values (trim(p_company), trim(p_city), trim(p_trade), nullif(trim(p_website), ''), nullif(lower(trim(p_email)), ''), nullif(trim(p_phone), ''),
          p_channel, coalesce(p_why, ''), coalesce(p_findings, ''), nullif(trim(p_subject), ''), coalesce(p_message, ''), nullif(trim(p_caution), ''),
          trim(p_source_label), nullif(trim(p_source_url), ''), p_source_checked_at,
          coalesce((select max(position) + 1 from public.prospects), 1), 'a_preparer', nullif(trim(p_first_name), ''))
  returning id into new_id;
  perform public._prospect_log(new_id, null, 'utilisateur', 'prospect_cree', jsonb_build_object('source', p_source_label));
  return new_id;
end $$;

-- ---------------------------------------------------------------------
-- Modification : prénom facultatif (nouvelle signature, l'ancienne est retirée).
-- Changer le prénom change le texte envoyé : la validation est retirée, comme pour le message.
-- ---------------------------------------------------------------------
drop function if exists public.prospect_update_content(uuid, integer, text, text, text, text, text, text, text, text, date);
create or replace function public.prospect_update_content(
  p_id uuid, p_version integer, p_website text, p_email text, p_phone text, p_subject text, p_message text, p_caution text,
  p_source_label text, p_source_url text, p_source_checked_at date, p_first_name text default null
) returns integer
language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); p public.prospects; text_changed boolean; fn text := nullif(trim(p_first_name), '');
begin
  p := public._prospect_lock(p_id, p_version);
  if exists (select 1 from public.prospect_attempts where prospect_id = p_id and state = 'ouverte') then
    raise exception 'Une tentative est en cours : terminez-la avant de modifier la fiche.' using errcode = 'P0001';
  end if;
  if coalesce(trim(p_message), '') = '' then raise exception 'Le message ne peut pas être vide.' using errcode = 'P0001'; end if;
  if exists (select 1 from public.prospects where archived_at is null and id <> p_id
              and lower(email) = lower(nullif(trim(p_email), ''))) then
    raise exception 'Cette adresse e-mail appartient déjà à un autre prospect.' using errcode = 'P0001';
  end if;
  text_changed := public._prospect_md5(p.subject, p.message) is distinct from public._prospect_md5(nullif(trim(p_subject), ''), p_message)
                  or p.first_name is distinct from fn;
  update public.prospects
     set website = nullif(trim(p_website), ''), email = nullif(lower(trim(p_email)), ''), phone = nullif(trim(p_phone), ''),
         subject = nullif(trim(p_subject), ''), message = p_message, caution = nullif(trim(p_caution), ''),
         first_name = fn,
         source_label = coalesce(nullif(trim(p_source_label), ''), source_label), source_url = nullif(trim(p_source_url), ''),
         source_checked_at = coalesce(p_source_checked_at, source_checked_at),
         stage = case when text_changed and stage = 'pret' then 'a_preparer' else stage end,
         approved_at = case when text_changed then null else approved_at end,
         approved_message_md5 = case when text_changed then null else approved_message_md5 end,
         version = version + 1, updated_at = now()
   where id = p_id;
  perform public._prospect_log(p_id, null, 'utilisateur', 'fiche_modifiee', jsonb_build_object('texte_modifie', text_changed));
  return p.version + 1;
end $$;

-- ---------------------------------------------------------------------
-- Envoi serveur : texte personnalisé + rythme « humain »
-- ---------------------------------------------------------------------
create or replace function public.prospect_server_send_begin(p_id uuid, p_version integer)
returns table(attempt_id uuid, bcc_token text, to_address text, subject text, message text, new_version integer)
language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); p public.prospects; a public.prospect_attempts; h text; hr text;
        rs text; rm text; sent_today integer; v integer; last_sent timestamptz; wait_s integer;
begin
  p := public._prospect_lock(p_id, p_version);
  if p.do_not_contact_at is not null then raise exception 'Ce prospect ne veut plus être contacté (STOP).' using errcode = 'P0001'; end if;
  if p.archived_at is not null then raise exception 'Prospect archivé.' using errcode = 'P0001'; end if;
  if p.email is null then raise exception 'Aucune adresse e-mail pour ce prospect.' using errcode = 'P0001'; end if;
  if coalesce(trim(p.subject), '') = '' then raise exception 'Ajoutez un objet avant d''envoyer.' using errcode = 'P0001'; end if;
  if coalesce(trim(p.message), '') = '' then raise exception 'Le message est vide.' using errcode = 'P0001'; end if;
  if p.stage not in ('a_preparer', 'pret', 'contacte', 'en_discussion') then
    raise exception 'Étape « % » : envoi impossible.', p.stage using errcode = 'P0001';
  end if;
  if exists (select 1 from public.prospect_attempts x where x.prospect_id = p_id and x.state = 'ouverte') then
    raise exception 'Un envoi est déjà en cours pour ce prospect. Attendez quelques secondes.' using errcode = 'P0001';
  end if;

  rs := public._prospect_render(p.subject, p.first_name, p.company, p.city);
  rm := public._prospect_render(p.message, p.first_name, p.company, p.city);
  if rs ~ '\{[a-z_]+\}' or rm ~ '\{[a-z_]+\}' then
    raise exception 'Le message contient une variable inconnue entre accolades. Variables possibles : {prenom}, {entreprise}, {ville}.' using errcode = 'P0001';
  end if;
  h := public._prospect_md5(p.subject, p.message);   -- validation : sur le modèle saisi
  hr := public._prospect_md5(rs, rm);                -- anti-doublon : sur le texte réellement envoyé
  if exists (select 1 from public.prospect_attempts x
              where x.prospect_id = p_id and x.state in ('envoyee', 'verifiee') and x.channel = 'email'
                and public._prospect_md5(x.subject_snapshot, x.message_snapshot) = hr
                and coalesce(x.sent_at, x.verified_at) > now() - interval '24 hours') then
    raise exception 'Ce message a déjà été envoyé à ce prospect dans les dernières 24 h.' using errcode = 'P0001';
  end if;
  if not p.is_test then
    select count(*), max(x.sent_at) into sent_today, last_sent
      from public.prospect_attempts x join public.prospects y on y.id = x.prospect_id
     where x.draft_method = 'serveur' and x.state in ('envoyee', 'verifiee', 'ouverte') and not y.is_test
       and coalesce(x.sent_at, x.opened_at) > now() - interval '24 hours';
    if sent_today >= public._prospect_daily_cap() then
      raise exception 'Limite de % envois automatiques par 24 h atteinte (un rythme raisonnable protège votre boîte Gmail et la remise en boîte de réception).', public._prospect_daily_cap()
        using errcode = 'P0001';
    end if;
    wait_s := ceil(public._prospect_min_gap_seconds() - extract(epoch from (now() - coalesce(last_sent, now() - interval '1 day'))))::int;
    if wait_s > 0 then
      raise exception 'Attendez encore % s avant le prochain envoi : des envois espacés ressemblent à des e-mails écrits à la main et arrivent plus souvent en boîte de réception principale.', wait_s
        using errcode = 'P0001';
    end if;
  end if;

  v := p.version;
  if p.approved_message_md5 is distinct from h then
    update public.prospects
       set stage = case when stage = 'a_preparer' then 'pret' else stage end,
           approved_at = now(), approved_by = me, approved_message_md5 = h, version = version + 1, updated_at = now()
     where id = p_id;
    v := v + 1;
    perform public._prospect_log(p_id, null, 'utilisateur', 'message_valide', jsonb_build_object('md5', h, 'via', 'valider_et_envoyer'));
  end if;

  insert into public.prospect_attempts (prospect_id, channel, to_address, subject_snapshot, message_snapshot, created_by,
                                        draft_opened_at, draft_method)
  values (p_id, 'email', p.email, rs, rm, me, now(), 'serveur')
  returning * into a;
  update public.prospects set version = version + 1, updated_at = now() where id = p_id;
  v := v + 1;
  perform public._prospect_log(p_id, a.id, 'utilisateur', 'envoi_serveur_demande',
    jsonb_build_object('destinataire', p.email, 'objet', rs, 'md5', hr, 'personnalise', rs is distinct from p.subject or rm is distinct from p.message));
  return query select a.id, a.bcc_token, p.email, rs, rm, v;
end $$;

-- Droits : mêmes règles que les fonctions remplacées
revoke execute on function
  public.prospect_create(text, text, text, text, text, text, text, text, text, text, text, text, text, text, date, text),
  public.prospect_update_content(uuid, integer, text, text, text, text, text, text, text, text, date, text)
  from public, anon;
grant execute on function
  public.prospect_create(text, text, text, text, text, text, text, text, text, text, text, text, text, text, date, text),
  public.prospect_update_content(uuid, integer, text, text, text, text, text, text, text, text, date, text)
  to authenticated;
revoke execute on function public._prospect_render(text, text, text, text), public._prospect_city_label(text),
  public._prospect_min_gap_seconds() from public, anon, authenticated;
