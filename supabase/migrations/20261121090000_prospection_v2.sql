-- =====================================================================
-- Prospection v2 : INTENTION / BROUILLON / ACTION / PREUVE séparées,
-- journal immuable, preuve d'envoi par copie cachée.
--
-- Règle d'or : aucune donnée affichée ne doit laisser croire qu'une action
-- a eu lieu sans preuve. Quatre niveaux, jamais confondus :
--   1. Intention   : tentative ouverte              (prospect_attempts.state = 'ouverte')
--   2. Brouillon   : brouillon ou outil réellement ouvert (draft_opened_at)
--   3. Action      : l'utilisateur déclare l'avoir faite (state = 'declaree', proof = 'declaration')
--   4. Preuve      : copie cachée reçue par la plateforme (state = 'verifiee', proof = 'cci_recue')
--
-- Toutes les écritures passent par des fonctions qui appliquent les règles
-- ET écrivent le journal. Un garde refuse toute écriture directe, même en
-- SQL manuel par le propriétaire de la base.
--
-- Migration ADDITIVE : la colonne prospects.status reste tant que l'ancienne
-- page est en ligne (voir supabase/post-deploy/ pour le nettoyage).
-- AUCUN ENVOI AUTOMATIQUE n'est ajouté ici.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Nouvelles colonnes sur prospects
-- ---------------------------------------------------------------------
alter table public.prospects
  add column if not exists stage text not null default 'a_preparer'
    check (stage in ('a_preparer', 'pret', 'contacte', 'en_discussion', 'interesse', 'pas_interesse', 'ne_plus_contacter')),
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users (id),
  add column if not exists approved_message_md5 text,
  add column if not exists do_not_contact_at timestamptz,
  add column if not exists do_not_contact_reason text check (char_length(do_not_contact_reason) <= 500),
  add column if not exists source_label text check (char_length(source_label) <= 200),
  add column if not exists source_url text check (char_length(source_url) <= 500),
  add column if not exists source_checked_at date,
  add column if not exists next_action_at date,
  add column if not exists archived_at timestamptz,
  add column if not exists is_test boolean not null default false,
  add column if not exists version integer not null default 1;

-- Doublons interdits parmi les prospects actifs (Mo7).
-- Normalisation : minuscules, sans accents, sans parenthèses (« Laon (02) » = « Laon »), sans ponctuation.
create or replace function public._prospect_norm(p text)
returns text language sql immutable parallel safe as $$
  select regexp_replace(
           translate(lower(regexp_replace(coalesce(p, ''), '\s*\([^)]*\)', '', 'g')),
                     'àâäáãåçéèêëíìîïñóòôöõúùûüýÿœæ', 'aaaaaaceeeeiiiinooooouuuuyyoa'),
           '[^a-z0-9]', '', 'g')
$$;
create unique index if not exists prospects_email_unique
  on public.prospects (lower(email)) where email is not null and archived_at is null;
create unique index if not exists prospects_company_city_unique
  on public.prospects (public._prospect_norm(company), public._prospect_norm(city)) where archived_at is null;

-- ---------------------------------------------------------------------
-- 2. Tentatives de contact
-- ---------------------------------------------------------------------
create table if not exists public.prospect_attempts (
  id               uuid primary key default gen_random_uuid(),
  prospect_id      uuid not null references public.prospects (id) on delete cascade,
  channel          text not null check (channel in ('email', 'formulaire', 'telephone')),
  state            text not null default 'ouverte'
                   check (state in ('ouverte', 'declaree', 'verifiee', 'echec', 'annulee')),
  proof            text not null default 'aucune'
                   check (proof in ('aucune', 'declaration', 'cci_recue', 'gmail_api')),
  bcc_token        text unique default encode(extensions.gen_random_bytes(12), 'hex'),
  to_address       text check (char_length(to_address) <= 200),
  subject_snapshot text check (char_length(subject_snapshot) <= 200),
  message_snapshot text check (char_length(message_snapshot) <= 5000),
  -- Niveau 2 : brouillon / outil réellement ouvert
  draft_opened_at  timestamptz,
  draft_method     text check (draft_method in ('gmail_web', 'gmail_app_android', 'gmail_app_ios', 'mailto', 'copie', 'site_ouvert', 'numero_compose', 'manuel')),
  call_outcome     text check (call_outcome in ('joint', 'messagerie', 'pas_de_reponse', 'faux_numero', 'a_rappeler')),
  -- Niveau 4 : preuve
  verified_from    text check (char_length(verified_from) <= 300),
  wrong_sender     boolean not null default false,
  content_check    text check (content_check in ('complet', 'tronque', 'inconnu')),
  provider_email_id text unique,
  failure_reason   text check (char_length(failure_reason) <= 500),
  cancel_reason    text check (char_length(cancel_reason) <= 500),
  opened_at        timestamptz not null default now(),
  declared_at      timestamptz,
  verified_at      timestamptz,
  closed_at        timestamptz,
  created_by       uuid references auth.users (id),
  constraint attempt_proof_coherent check (
    (state = 'ouverte'  and proof = 'aucune') or
    (state = 'declaree' and proof = 'declaration') or
    (state = 'verifiee' and proof in ('cci_recue', 'gmail_api') and channel = 'email') or
    (state in ('echec', 'annulee'))
  ),
  constraint attempt_call_outcome check (channel <> 'telephone' or state <> 'declaree' or call_outcome is not null),
  -- On ne peut pas déclarer une action sans avoir ouvert le brouillon / l'outil
  constraint attempt_declared_after_draft check (state <> 'declaree' or draft_opened_at is not null)
);

create unique index if not exists prospect_attempts_one_open
  on public.prospect_attempts (prospect_id) where state = 'ouverte';
create index if not exists prospect_attempts_prospect_idx on public.prospect_attempts (prospect_id, opened_at desc);

-- ---------------------------------------------------------------------
-- 3. Journal (ajout seul)
-- ---------------------------------------------------------------------
create table if not exists public.prospect_events (
  id          bigint generated always as identity primary key,
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  attempt_id  uuid references public.prospect_attempts (id) on delete set null,
  actor       text not null check (actor in ('utilisateur', 'systeme', 'reception')),
  actor_id    uuid,
  type        text not null check (char_length(type) <= 60),
  detail      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists prospect_events_prospect_idx on public.prospect_events (prospect_id, created_at desc);

-- ---------------------------------------------------------------------
-- 4. Droits : lecture admin, AUCUNE écriture directe
-- ---------------------------------------------------------------------
alter table public.prospect_attempts enable row level security;
alter table public.prospect_events enable row level security;
revoke all on public.prospect_attempts, public.prospect_events from anon, authenticated;
grant select on public.prospect_attempts, public.prospect_events to authenticated;

drop policy if exists "prospect_attempts_admin_read" on public.prospect_attempts;
create policy "prospect_attempts_admin_read" on public.prospect_attempts
  for select to authenticated using ((select public.is_platform_admin()));
drop policy if exists "prospect_events_admin_read" on public.prospect_events;
create policy "prospect_events_admin_read" on public.prospect_events
  for select to authenticated using ((select public.is_platform_admin()));

drop policy if exists "prospects_admin_all" on public.prospects;
drop policy if exists "prospects_admin_read" on public.prospects;
create policy "prospects_admin_read" on public.prospects
  for select to authenticated using ((select public.is_platform_admin()));
revoke insert, update, delete on public.prospects from anon, authenticated;

-- L'ancien déclencheur remplissait sent_at sans jamais le vider (M3) : supprimé.
drop trigger if exists prospects_touch on public.prospects;

-- ---------------------------------------------------------------------
-- 5. Gardes : journal immuable ; tables modifiables seulement par les fonctions
-- ---------------------------------------------------------------------
create or replace function public.prospect_events_immutable()
returns trigger language plpgsql as $$
begin
  -- Seule exception : l'effacement complet d'un prospect à sa demande (RGPD), via prospect_erase().
  if current_setting('prospect.erase', true) = 'on' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  raise exception 'Le journal de prospection ne peut pas être modifié.' using errcode = 'P0001';
end;
$$;
drop trigger if exists prospect_events_no_update on public.prospect_events;
create trigger prospect_events_no_update before update or delete on public.prospect_events
  for each row execute function public.prospect_events_immutable();

-- Toute écriture sur prospects / tentatives doit venir d'une fonction métier (C4, Mi2) :
-- même une requête SQL manuelle est refusée.
create or replace function public.prospect_write_guard()
returns trigger language plpgsql as $$
begin
  if current_setting('prospect.via_function', true) = 'on' or current_setting('prospect.erase', true) = 'on' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  raise exception 'Écriture directe interdite : passez par les fonctions de prospection (journal obligatoire).'
    using errcode = 'P0001';
end;
$$;
drop trigger if exists prospects_write_guard on public.prospects;
create trigger prospects_write_guard before insert or update or delete on public.prospects
  for each row execute function public.prospect_write_guard();
drop trigger if exists prospect_attempts_write_guard on public.prospect_attempts;
create trigger prospect_attempts_write_guard before insert or update or delete on public.prospect_attempts
  for each row execute function public.prospect_write_guard();

-- ---------------------------------------------------------------------
-- 6. Outils internes
-- ---------------------------------------------------------------------
create or replace function public._prospect_require_admin()
returns uuid language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Accès réservé à l''administrateur.' using errcode = '42501';
  end if;
  perform set_config('prospect.via_function', 'on', true); -- ouvre le garde pour CETTE transaction
  return auth.uid();
end;
$$;

create or replace function public._prospect_log(p_prospect uuid, p_attempt uuid, p_actor text, p_type text, p_detail jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.prospect_events (prospect_id, attempt_id, actor, actor_id, type, detail)
  values (p_prospect, p_attempt, p_actor, auth.uid(), p_type, coalesce(p_detail, '{}'::jsonb));
$$;

create or replace function public._prospect_lock(p_id uuid, p_version integer)
returns public.prospects language plpgsql security definer set search_path = public as $$
declare p public.prospects;
begin
  select * into p from public.prospects where id = p_id for update;
  if not found then raise exception 'Prospect introuvable.' using errcode = 'P0002'; end if;
  if p_version is not null and p.version <> p_version then
    raise exception 'Ce prospect a été modifié ailleurs. Rechargez la page.' using errcode = '40001';
  end if;
  return p;
end;
$$;

create or replace function public._prospect_md5(p_subject text, p_message text)
returns text language sql immutable as $$ select md5(coalesce(p_subject, '') || '|' || coalesce(p_message, '')) $$;

-- ---------------------------------------------------------------------
-- 7. Création et modification (Mi2, Mo7, Mo10)
-- ---------------------------------------------------------------------
create or replace function public.prospect_create(
  p_company text, p_city text, p_trade text, p_website text, p_email text, p_phone text, p_channel text,
  p_why text, p_findings text, p_subject text, p_message text, p_caution text,
  p_source_label text, p_source_url text, p_source_checked_at date
) returns uuid language plpgsql security definer set search_path = public as $$
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
                                source_label, source_url, source_checked_at, position, stage)
  values (trim(p_company), trim(p_city), trim(p_trade), nullif(trim(p_website), ''), nullif(lower(trim(p_email)), ''), nullif(trim(p_phone), ''),
          p_channel, coalesce(p_why, ''), coalesce(p_findings, ''), nullif(trim(p_subject), ''), coalesce(p_message, ''), nullif(trim(p_caution), ''),
          trim(p_source_label), nullif(trim(p_source_url), ''), p_source_checked_at,
          coalesce((select max(position) + 1 from public.prospects), 1), 'a_preparer')
  returning id into new_id;
  perform public._prospect_log(new_id, null, 'utilisateur', 'prospect_cree', jsonb_build_object('source', p_source_label));
  return new_id;
end;
$$;

-- Modifier le contenu. Si le texte change, la validation tombe (M9) : il faudra relire.
create or replace function public.prospect_update_content(
  p_id uuid, p_version integer, p_website text, p_email text, p_phone text,
  p_subject text, p_message text, p_caution text, p_source_label text, p_source_url text, p_source_checked_at date
) returns integer language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); p public.prospects; text_changed boolean;
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
  text_changed := public._prospect_md5(p.subject, p.message) is distinct from public._prospect_md5(nullif(trim(p_subject), ''), p_message);
  update public.prospects
     set website = nullif(trim(p_website), ''), email = nullif(lower(trim(p_email)), ''), phone = nullif(trim(p_phone), ''),
         subject = nullif(trim(p_subject), ''), message = p_message, caution = nullif(trim(p_caution), ''),
         source_label = coalesce(nullif(trim(p_source_label), ''), source_label), source_url = nullif(trim(p_source_url), ''),
         source_checked_at = coalesce(p_source_checked_at, source_checked_at),
         stage = case when text_changed and stage = 'pret' then 'a_preparer' else stage end,
         approved_at = case when text_changed then null else approved_at end,
         approved_message_md5 = case when text_changed then null else approved_message_md5 end,
         version = version + 1, updated_at = now()
   where id = p_id;
  perform public._prospect_log(p_id, null, 'utilisateur', 'fiche_modifiee', jsonb_build_object('texte_modifie', text_changed));
  return p.version + 1;
end;
$$;

-- ---------------------------------------------------------------------
-- 8. Actions du parcours (une fonction = une action = une ligne de journal)
-- ---------------------------------------------------------------------

-- Valider le texte (qui, quand, quelle version). Possible à toute étape tant que ce texte n'est pas validé.
create or replace function public.prospect_approve(p_id uuid, p_version integer)
returns integer language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); p public.prospects; h text;
begin
  p := public._prospect_lock(p_id, p_version);
  if p.do_not_contact_at is not null then raise exception 'Ce prospect ne veut plus être contacté.' using errcode = 'P0001'; end if;
  if p.archived_at is not null then raise exception 'Prospect archivé.' using errcode = 'P0001'; end if;
  h := public._prospect_md5(p.subject, p.message);
  if p.approved_message_md5 = h then raise exception 'Ce texte est déjà validé.' using errcode = 'P0001'; end if;
  if coalesce(trim(p.message), '') = '' then raise exception 'Le message est vide.' using errcode = 'P0001'; end if;
  update public.prospects
     set stage = case when stage = 'a_preparer' then 'pret' else stage end,
         approved_at = now(), approved_by = me, approved_message_md5 = h, version = version + 1, updated_at = now()
   where id = p_id;
  perform public._prospect_log(p_id, null, 'utilisateur', 'message_valide', jsonb_build_object('md5', h));
  return p.version + 1;
end;
$$;

-- Niveau 1 — Intention : ouvrir une tentative (fige le texte, fournit le jeton de copie cachée)
create or replace function public.prospect_start_attempt(p_id uuid, p_channel text, p_version integer)
returns table (attempt_id uuid, bcc_token text, new_version integer)
language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); p public.prospects; a public.prospect_attempts;
begin
  p := public._prospect_lock(p_id, p_version);
  if p.do_not_contact_at is not null then raise exception 'Ce prospect ne veut plus être contacté (STOP).' using errcode = 'P0001'; end if;
  if p.archived_at is not null then raise exception 'Prospect archivé.' using errcode = 'P0001'; end if;
  if p.stage not in ('pret', 'contacte', 'en_discussion') then
    raise exception 'Validez d''abord le message.' using errcode = 'P0001';
  end if;
  if p.approved_message_md5 is distinct from public._prospect_md5(p.subject, p.message) then
    raise exception 'Le message a changé depuis sa validation : validez-le à nouveau.' using errcode = 'P0001';
  end if;
  if p_channel not in ('email', 'formulaire', 'telephone') then raise exception 'Canal inconnu.' using errcode = 'P0001'; end if;
  if p_channel = 'email' and p.email is null then raise exception 'Aucune adresse e-mail pour ce prospect.' using errcode = 'P0001'; end if;
  if p_channel = 'formulaire' and p.website is null then raise exception 'Aucun site pour ce prospect.' using errcode = 'P0001'; end if;
  if p_channel = 'telephone' and p.phone is null then raise exception 'Aucun numéro pour ce prospect.' using errcode = 'P0001'; end if;
  if exists (select 1 from public.prospect_attempts where prospect_id = p_id and state = 'ouverte') then
    raise exception 'Une tentative est déjà en cours : terminez-la ou annulez-la.' using errcode = 'P0001';
  end if;
  insert into public.prospect_attempts (prospect_id, channel, to_address, subject_snapshot, message_snapshot, created_by)
  values (p_id, p_channel, case when p_channel = 'email' then p.email end, p.subject, p.message, me)
  returning * into a;
  update public.prospects set version = version + 1, updated_at = now() where id = p_id;
  perform public._prospect_log(p_id, a.id, 'utilisateur', 'tentative_ouverte', jsonb_build_object('canal', p_channel));
  return query select a.id, a.bcc_token, p.version + 1;
end;
$$;

-- Niveau 2 — Brouillon : l'utilisateur a réellement ouvert le brouillon / le site / composé le numéro
create or replace function public.prospect_mark_draft_opened(p_attempt_id uuid, p_method text)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); a public.prospect_attempts;
begin
  select * into a from public.prospect_attempts where id = p_attempt_id for update;
  if not found then raise exception 'Tentative introuvable.' using errcode = 'P0002'; end if;
  if a.state <> 'ouverte' then raise exception 'Cette tentative n''est plus en cours.' using errcode = 'P0001'; end if;
  if p_method not in ('gmail_web', 'gmail_app_android', 'gmail_app_ios', 'mailto', 'copie', 'site_ouvert', 'numero_compose', 'manuel') then
    raise exception 'Méthode inconnue.' using errcode = 'P0001';
  end if;
  update public.prospect_attempts
     set draft_opened_at = coalesce(draft_opened_at, now()), draft_method = coalesce(draft_method, p_method)
   where id = p_attempt_id;
  perform public._prospect_log(a.prospect_id, a.id, 'utilisateur', 'brouillon_ouvert', jsonb_build_object('methode', p_method));
end;
$$;

-- Niveau 3 — Action : déclaration. Contrôles : brouillon ouvert, 20 s minimum, toutes les confirmations,
-- résultat obligatoire pour un appel.
create or replace function public.prospect_declare_attempt(
  p_attempt_id uuid, p_confirmations text[], p_call_outcome text default null
) returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); a public.prospect_attempts; required text[];
begin
  select * into a from public.prospect_attempts where id = p_attempt_id for update;
  if not found then raise exception 'Tentative introuvable.' using errcode = 'P0002'; end if;
  if a.state <> 'ouverte' then raise exception 'Cette tentative n''est plus en cours.' using errcode = 'P0001'; end if;
  if a.draft_opened_at is null then
    raise exception 'Ouvrez d''abord le brouillon (ou le site, ou le numéro) avant de déclarer l''action.' using errcode = 'P0001';
  end if;
  if now() - a.opened_at < interval '20 seconds' then
    raise exception 'Trop rapide : vérifiez d''abord que l''action est réellement faite.' using errcode = 'P0001';
  end if;
  required := case a.channel
    when 'email' then array['bon_compte', 'clique_envoyer', 'vu_dans_envoyes']
    when 'formulaire' then array['formulaire_soumis', 'confirmation_du_site']
    else array['appel_passe'] end;
  if not (coalesce(p_confirmations, '{}') @> required) then
    raise exception 'Toutes les confirmations sont obligatoires.' using errcode = 'P0001';
  end if;
  if a.channel = 'telephone' and p_call_outcome is null then
    raise exception 'Indiquez le résultat de l''appel.' using errcode = 'P0001';
  end if;
  if p_call_outcome is not null and p_call_outcome not in ('joint', 'messagerie', 'pas_de_reponse', 'faux_numero', 'a_rappeler') then
    raise exception 'Résultat d''appel inconnu.' using errcode = 'P0001';
  end if;
  update public.prospect_attempts
     set state = 'declaree', proof = 'declaration', declared_at = now(),
         call_outcome = case when a.channel = 'telephone' then p_call_outcome end
   where id = p_attempt_id;
  update public.prospects
     set stage = case when stage = 'pret' and coalesce(p_call_outcome, 'joint') not in ('faux_numero', 'pas_de_reponse') then 'contacte' else stage end,
         next_action_at = case when p_call_outcome in ('a_rappeler', 'pas_de_reponse', 'messagerie') then (now() + interval '2 days')::date
                               else coalesce(next_action_at, (now() + interval '7 days')::date) end,
         version = version + 1, updated_at = now()
   where id = a.prospect_id;
  perform public._prospect_log(a.prospect_id, a.id, 'utilisateur', 'tentative_declaree',
    jsonb_build_object('canal', a.channel, 'confirmations', p_confirmations, 'resultat_appel', p_call_outcome,
                       'delai_secondes', extract(epoch from now() - a.opened_at)::int));
end;
$$;

-- Annuler une tentative ouverte, ou RETIRER une déclaration erronée (retour arrière tracé)
create or replace function public.prospect_cancel_attempt(p_attempt_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); a public.prospect_attempts;
begin
  if coalesce(trim(p_reason), '') = '' then raise exception 'Indiquez la raison.' using errcode = 'P0001'; end if;
  select * into a from public.prospect_attempts where id = p_attempt_id for update;
  if not found then raise exception 'Tentative introuvable.' using errcode = 'P0002'; end if;
  if a.state = 'verifiee' then raise exception 'Un envoi prouvé ne peut pas être annulé.' using errcode = 'P0001'; end if;
  if a.state in ('annulee', 'echec') then raise exception 'Tentative déjà close.' using errcode = 'P0001'; end if;
  update public.prospect_attempts set state = 'annulee', cancel_reason = left(p_reason, 500), closed_at = now() where id = p_attempt_id;
  -- Plus aucun contact déclaré ou prouvé : le prospect revient à « relu, pas encore contacté »
  update public.prospects p
     set stage = case when p.stage = 'contacte' and not exists (select 1 from public.prospect_attempts x
                        where x.prospect_id = p.id and x.state in ('declaree', 'verifiee')) then 'pret' else p.stage end,
         version = version + 1, updated_at = now()
   where p.id = a.prospect_id;
  perform public._prospect_log(a.prospect_id, a.id, 'utilisateur',
    case when a.state = 'ouverte' then 'tentative_annulee' else 'declaration_retiree' end,
    jsonb_build_object('raison', p_reason, 'etat_precedent', a.state));
end;
$$;

-- Signaler un échec (adresse refusée, formulaire en panne, faux numéro…)
create or replace function public.prospect_fail_attempt(p_attempt_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); a public.prospect_attempts;
begin
  if coalesce(trim(p_reason), '') = '' then raise exception 'Indiquez ce qui s''est passé.' using errcode = 'P0001'; end if;
  select * into a from public.prospect_attempts where id = p_attempt_id for update;
  if not found or a.state not in ('ouverte', 'declaree') then raise exception 'Tentative non modifiable.' using errcode = 'P0001'; end if;
  update public.prospect_attempts set state = 'echec', failure_reason = left(p_reason, 500), closed_at = now() where id = p_attempt_id;
  update public.prospects p
     set stage = case when p.stage = 'contacte' and not exists (select 1 from public.prospect_attempts x
                        where x.prospect_id = p.id and x.state in ('declaree', 'verifiee')) then 'pret' else p.stage end,
         version = version + 1, updated_at = now()
   where p.id = a.prospect_id;
  perform public._prospect_log(a.prospect_id, a.id, 'utilisateur', 'tentative_echouee', jsonb_build_object('raison', p_reason));
end;
$$;

-- Réponse du prospect (sens obligatoire ; « stop » bloque tout contact)
create or replace function public.prospect_record_reply(p_id uuid, p_kind text, p_note text, p_version integer)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); p public.prospects;
begin
  if p_kind not in ('positive', 'question', 'negative', 'stop') then raise exception 'Type de réponse inconnu.' using errcode = 'P0001'; end if;
  p := public._prospect_lock(p_id, p_version);
  if not exists (select 1 from public.prospect_attempts where prospect_id = p_id and state in ('declaree', 'verifiee')) then
    raise exception 'Aucun contact enregistré : impossible d''avoir une réponse.' using errcode = 'P0001';
  end if;
  update public.prospects
     set stage = case p_kind when 'positive' then 'interesse' when 'question' then 'en_discussion'
                             when 'negative' then 'pas_interesse' else 'ne_plus_contacter' end,
         do_not_contact_at = case when p_kind = 'stop' then now() else do_not_contact_at end,
         do_not_contact_reason = case when p_kind = 'stop' then 'Réponse « stop » du prospect' else do_not_contact_reason end,
         next_action_at = case when p_kind in ('positive', 'question') then (now() + interval '1 day')::date else null end,
         notes = case when coalesce(trim(p_note), '') = '' then notes
                      else left(notes || case when notes = '' then '' else E'\n' end
                                || to_char(now() at time zone 'Europe/Paris', 'DD/MM/YYYY HH24:MI') || ' — ' || p_note, 2000) end,
         version = version + 1, updated_at = now()
   where id = p_id;
  update public.prospect_attempts set state = 'annulee', cancel_reason = 'Réponse « stop »', closed_at = now()
   where prospect_id = p_id and state = 'ouverte' and p_kind = 'stop';
  perform public._prospect_log(p_id, null, 'utilisateur', 'reponse_enregistree', jsonb_build_object('type', p_kind, 'note', p_note));
end;
$$;

-- Opposition (sans attendre une réponse écrite : demande par téléphone, courrier…)
create or replace function public.prospect_do_not_contact(p_id uuid, p_reason text, p_version integer)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); p public.prospects;
begin
  if coalesce(trim(p_reason), '') = '' then raise exception 'Indiquez la raison.' using errcode = 'P0001'; end if;
  p := public._prospect_lock(p_id, p_version);
  update public.prospects set stage = 'ne_plus_contacter', do_not_contact_at = now(), next_action_at = null,
         do_not_contact_reason = left(p_reason, 500), version = version + 1, updated_at = now()
   where id = p_id;
  update public.prospect_attempts set state = 'annulee', cancel_reason = 'Opposition du prospect', closed_at = now()
   where prospect_id = p_id and state = 'ouverte';
  perform public._prospect_log(p_id, null, 'utilisateur', 'ne_plus_contacter', jsonb_build_object('raison', p_reason));
end;
$$;

create or replace function public.prospect_update_notes(p_id uuid, p_notes text, p_version integer)
returns integer language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); p public.prospects;
begin
  p := public._prospect_lock(p_id, p_version);
  update public.prospects set notes = left(coalesce(p_notes, ''), 2000), version = version + 1, updated_at = now() where id = p_id;
  perform public._prospect_log(p_id, null, 'utilisateur', 'notes_modifiees', '{}'::jsonb);
  return p.version + 1;
end;
$$;

-- Prochaine action (Mo6)
create or replace function public.prospect_set_next_action(p_id uuid, p_date date, p_version integer)
returns integer language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); p public.prospects;
begin
  p := public._prospect_lock(p_id, p_version);
  if p.do_not_contact_at is not null and p_date is not null then
    raise exception 'Ce prospect ne veut plus être contacté.' using errcode = 'P0001';
  end if;
  update public.prospects set next_action_at = p_date, version = version + 1, updated_at = now() where id = p_id;
  perform public._prospect_log(p_id, null, 'utilisateur', 'prochaine_action', jsonb_build_object('date', p_date));
  return p.version + 1;
end;
$$;

create or replace function public.prospect_archive(p_id uuid, p_archive boolean, p_version integer)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); p public.prospects;
begin
  p := public._prospect_lock(p_id, p_version);
  if p_archive and exists (select 1 from public.prospect_attempts where prospect_id = p_id and state = 'ouverte') then
    raise exception 'Une tentative est en cours : terminez-la ou annulez-la avant d''archiver.' using errcode = 'P0001';
  end if;
  if not p_archive and exists (select 1 from public.prospects x where x.archived_at is null and x.id <> p_id
       and (lower(x.email) = lower(p.email)
            or (public._prospect_norm(x.company) = public._prospect_norm(p.company) and public._prospect_norm(x.city) = public._prospect_norm(p.city)))) then
    raise exception 'Un prospect actif identique existe déjà : impossible de désarchiver.' using errcode = 'P0001';
  end if;
  update public.prospects set archived_at = case when p_archive then now() end, version = version + 1, updated_at = now() where id = p_id;
  perform public._prospect_log(p_id, null, 'utilisateur', case when p_archive then 'archive' else 'desarchive' end, '{}'::jsonb);
end;
$$;

-- Effacement définitif à la demande de la personne (RGPD). Seule suppression possible.
create or replace function public.prospect_erase(p_id uuid, p_confirm_company text)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); p public.prospects;
begin
  select * into p from public.prospects where id = p_id for update;
  if not found then raise exception 'Prospect introuvable.' using errcode = 'P0002'; end if;
  if p.company <> p_confirm_company then raise exception 'Le nom saisi ne correspond pas.' using errcode = 'P0001'; end if;
  perform set_config('prospect.erase', 'on', true);
  delete from public.prospects where id = p_id; -- tentatives et journal supprimés en cascade
  perform set_config('prospect.erase', 'off', true);
end;
$$;

-- ---------------------------------------------------------------------
-- 9. Niveau 4 — PREUVE : copie cachée reçue (appelée par la fonction de réception)
--    L'e-mail contient en Cci « prospect-<jeton>@<domaine de réception> ».
--    p_received_text sert à vérifier que le message n'a pas été tronqué (Mo3).
-- ---------------------------------------------------------------------
create or replace function public.prospect_verify_by_bcc(
  p_token text, p_provider_email_id text, p_from text, p_expected_from text, p_received_text text default null
) returns table (attempt_id uuid, prospect_id uuid, wrong_sender boolean, content_check text)
language plpgsql security definer set search_path = public as $$
declare a public.prospect_attempts; wrong boolean; last_line text; check_result text;
        norm text := lower(regexp_replace(coalesce(p_received_text, ''), '\s+', ' ', 'g'));
begin
  perform set_config('prospect.via_function', 'on', true);
  select * into a from public.prospect_attempts x where x.bcc_token = lower(p_token) for update;
  if not found then return; end if;
  -- Idempotence : la même copie reçue deux fois (renvoi du webhook) ne crée rien de plus
  if a.provider_email_id is not null and a.provider_email_id = p_provider_email_id then
    return query select a.id, a.prospect_id, a.wrong_sender, a.content_check; return;
  end if;
  wrong := position(lower(p_expected_from) in lower(coalesce(p_from, ''))) = 0;
  select lower(trim(regexp_replace(t.l, '\s+', ' ', 'g'))) into last_line
    from regexp_split_to_table(coalesce(a.message_snapshot, ''), E'\n') with ordinality as t(l, n)
   where trim(t.l) <> '' order by t.n desc limit 1;
  check_result := case when norm = '' or last_line is null then 'inconnu'
                       when position(last_line in norm) > 0 then 'complet' else 'tronque' end;
  -- La preuve l'emporte toujours sur une déclaration (même annulée ou en échec)
  if a.state <> 'verifiee' then
    update public.prospect_attempts
       set state = 'verifiee', proof = 'cci_recue', verified_at = now(), declared_at = coalesce(declared_at, now()),
           draft_opened_at = coalesce(draft_opened_at, now()),
           verified_from = left(p_from, 300), wrong_sender = wrong, content_check = check_result,
           provider_email_id = p_provider_email_id, closed_at = null
     where id = a.id;
    update public.prospects p set stage = case when p.stage in ('a_preparer', 'pret') then 'contacte' else p.stage end,
           next_action_at = coalesce(p.next_action_at, (now() + interval '7 days')::date),
           version = p.version + 1, updated_at = now()
     where p.id = a.prospect_id;
  end if;
  insert into public.prospect_events (prospect_id, attempt_id, actor, type, detail)
  values (a.prospect_id, a.id, 'reception',
          case when wrong then 'envoi_prouve_mauvais_expediteur' else 'envoi_prouve' end,
          jsonb_build_object('expediteur', p_from, 'email_id', p_provider_email_id, 'etat_precedent', a.state, 'contenu', check_result));
  return query select a.id, a.prospect_id, wrong, check_result;
end;
$$;

-- ---------------------------------------------------------------------
-- 10. Droits d'exécution
-- ---------------------------------------------------------------------
revoke execute on function public._prospect_require_admin(), public._prospect_log(uuid, uuid, text, text, jsonb),
  public._prospect_lock(uuid, integer) from public, anon, authenticated;
revoke execute on function public.prospect_verify_by_bcc(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.prospect_verify_by_bcc(text, text, text, text, text) to service_role;

revoke execute on function
  public.prospect_create(text, text, text, text, text, text, text, text, text, text, text, text, text, text, date),
  public.prospect_update_content(uuid, integer, text, text, text, text, text, text, text, text, date),
  public.prospect_approve(uuid, integer), public.prospect_start_attempt(uuid, text, integer),
  public.prospect_mark_draft_opened(uuid, text), public.prospect_declare_attempt(uuid, text[], text),
  public.prospect_cancel_attempt(uuid, text), public.prospect_fail_attempt(uuid, text),
  public.prospect_record_reply(uuid, text, text, integer), public.prospect_do_not_contact(uuid, text, integer),
  public.prospect_update_notes(uuid, text, integer), public.prospect_set_next_action(uuid, date, integer),
  public.prospect_archive(uuid, boolean, integer), public.prospect_erase(uuid, text)
  from public, anon;
grant execute on function
  public.prospect_create(text, text, text, text, text, text, text, text, text, text, text, text, text, text, date),
  public.prospect_update_content(uuid, integer, text, text, text, text, text, text, text, text, date),
  public.prospect_approve(uuid, integer), public.prospect_start_attempt(uuid, text, integer),
  public.prospect_mark_draft_opened(uuid, text), public.prospect_declare_attempt(uuid, text[], text),
  public.prospect_cancel_attempt(uuid, text), public.prospect_fail_attempt(uuid, text),
  public.prospect_record_reply(uuid, text, text, integer), public.prospect_do_not_contact(uuid, text, integer),
  public.prospect_update_notes(uuid, text, integer), public.prospect_set_next_action(uuid, date, integer),
  public.prospect_archive(uuid, boolean, integer), public.prospect_erase(uuid, text)
  to authenticated;

-- ---------------------------------------------------------------------
-- 11. Reprise des données existantes : AUCUN « envoyé » sans preuve
-- ---------------------------------------------------------------------
-- Réglage de SESSION (et non de transaction) : la migration peut être exécutée instruction par instruction.
select set_config('prospect.via_function', 'on', false);

update public.prospects
   set stage = case status when 'a_valider' then 'a_preparer' when 'pas_interesse' then 'pas_interesse' else 'pret' end,
       approved_at = case when status <> 'a_valider' then coalesce(approved_at, updated_at) end,
       approved_message_md5 = case when status <> 'a_valider' then public._prospect_md5(subject, message) end,
       is_test = company like 'TEST%',
       source_label = coalesce(source_label, 'Fiche créée avant la v2 : voir « Ce qui a été vérifié »'),
       source_checked_at = coalesce(source_checked_at, created_at::date)
 where stage = 'a_preparer';

insert into public.prospect_events (prospect_id, actor, type, detail)
select id, 'systeme', 'reprise_v2',
       jsonb_build_object('ancien_statut', status, 'ancienne_date_envoi', sent_at,
                          'remarque', case when status in ('envoye', 'repondu')
                                           then 'Statut déclaré sans preuve : non repris comme envoi.' end)
  from public.prospects;

select set_config('prospect.via_function', 'off', false);
