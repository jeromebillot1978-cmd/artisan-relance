-- =====================================================================
-- Prospection v2 : séparation ÉTAPE / TENTATIVE / PREUVE + journal.
--
-- Principe : aucune donnée affichée ne doit laisser croire qu'une action
-- a eu lieu sans preuve. On distingue donc :
--   * prospects.stage            : l'étape commerciale (décision humaine)
--   * prospect_attempts          : chaque tentative de contact (e-mail,
--                                  formulaire, appel), avec son état et
--                                  son niveau de preuve
--   * prospect_events            : journal en ajout seul (jamais modifié)
--
-- Toutes les écritures passent par des fonctions qui appliquent les
-- règles ET écrivent le journal. L'application n'a plus le droit de
-- modifier les tables directement.
--
-- Migration ADDITIVE : la colonne prospects.status reste en place tant
-- que l'ancienne page est en ligne. Elle sera supprimée par une
-- migration de nettoyage après déploiement du nouveau code.
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

-- Un même e-mail ne peut appartenir qu'à un seul prospect actif
create unique index if not exists prospects_email_unique
  on public.prospects (lower(email)) where email is not null and archived_at is null;

-- ---------------------------------------------------------------------
-- 2. Tentatives de contact
-- ---------------------------------------------------------------------
create table if not exists public.prospect_attempts (
  id               uuid primary key default gen_random_uuid(),
  prospect_id      uuid not null references public.prospects (id) on delete cascade,
  channel          text not null check (channel in ('email', 'formulaire', 'telephone')),
  -- ouverte   : préparée, l'utilisateur est en train d'agir
  -- declaree  : l'utilisateur déclare l'avoir faite (preuve = sa déclaration)
  -- verifiee  : preuve technique reçue (copie cachée, API Gmail)
  -- echec     : impossible (adresse refusée, faux numéro, formulaire en panne)
  -- annulee   : abandonnée ou déclaration retirée (jamais supprimée)
  state            text not null default 'ouverte'
                   check (state in ('ouverte', 'declaree', 'verifiee', 'echec', 'annulee')),
  proof            text not null default 'aucune'
                   check (proof in ('aucune', 'declaration', 'cci_recue', 'gmail_api')),
  bcc_token        text unique default encode(extensions.gen_random_bytes(12), 'hex'),
  to_address       text check (char_length(to_address) <= 200),
  subject_snapshot text check (char_length(subject_snapshot) <= 200),
  message_snapshot text check (char_length(message_snapshot) <= 5000),
  call_outcome     text check (call_outcome in ('joint', 'messagerie', 'pas_de_reponse', 'faux_numero', 'a_rappeler')),
  verified_from    text check (char_length(verified_from) <= 300),
  provider_email_id text unique,
  failure_reason   text check (char_length(failure_reason) <= 500),
  cancel_reason    text check (char_length(cancel_reason) <= 500),
  opened_at        timestamptz not null default now(),
  declared_at      timestamptz,
  verified_at      timestamptz,
  closed_at        timestamptz,
  created_by       uuid references auth.users (id),
  -- une preuve technique ne peut exister que pour l'e-mail
  constraint attempt_proof_coherent check (
    (state = 'ouverte'  and proof = 'aucune') or
    (state = 'declaree' and proof = 'declaration') or
    (state = 'verifiee' and proof in ('cci_recue', 'gmail_api') and channel = 'email') or
    (state in ('echec', 'annulee'))
  ),
  -- un appel déclaré a obligatoirement un résultat
  constraint attempt_call_outcome check (channel <> 'telephone' or state not in ('declaree') or call_outcome is not null)
);

-- Une seule tentative ouverte à la fois par prospect
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

-- La table prospects passe aussi en lecture seule pour l'application :
-- toute écriture doit passer par les fonctions ci-dessous.
drop policy if exists "prospects_admin_all" on public.prospects;
drop policy if exists "prospects_admin_read" on public.prospects;
create policy "prospects_admin_read" on public.prospects
  for select to authenticated using ((select public.is_platform_admin()));
revoke insert, update, delete on public.prospects from authenticated;

-- Le journal ne se modifie ni ne se supprime, même par erreur
create or replace function public.prospect_events_immutable()
returns trigger language plpgsql as $$
begin
  -- Seule exception : l'effacement d'un prospect à sa demande (droit à l'effacement, RGPD),
  -- via prospect_erase(), qui active ce réglage pour sa seule transaction.
  if current_setting('prospect.erase', true) = 'on' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  raise exception 'Le journal de prospection ne peut pas être modifié.' using errcode = 'P0001';
end;
$$;
drop trigger if exists prospect_events_no_update on public.prospect_events;
create trigger prospect_events_no_update before update or delete on public.prospect_events
  for each row execute function public.prospect_events_immutable();

-- L'ancien déclencheur remplissait sent_at sans jamais le vider (M3) : supprimé.
drop trigger if exists prospects_touch on public.prospects;

-- ---------------------------------------------------------------------
-- 5. Outils internes
-- ---------------------------------------------------------------------
create or replace function public._prospect_require_admin()
returns uuid language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Accès réservé à l''administrateur.' using errcode = '42501';
  end if;
  return auth.uid();
end;
$$;

create or replace function public._prospect_log(p_prospect uuid, p_attempt uuid, p_actor text, p_type text, p_detail jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.prospect_events (prospect_id, attempt_id, actor, actor_id, type, detail)
  values (p_prospect, p_attempt, p_actor, auth.uid(), p_type, coalesce(p_detail, '{}'::jsonb));
$$;

-- Verrouille le prospect et vérifie la version (anti-écrasement entre onglets, Mo2)
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

-- ---------------------------------------------------------------------
-- 6. Actions (une fonction = une action métier = une ligne de journal)
-- ---------------------------------------------------------------------

-- Valider le message (qui, quand, quelle version du texte)
create or replace function public.prospect_approve(p_id uuid, p_version integer)
returns integer language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); p public.prospects;
begin
  p := public._prospect_lock(p_id, p_version);
  if p.do_not_contact_at is not null then raise exception 'Ce prospect ne veut plus être contacté.' using errcode = 'P0001'; end if;
  if p.archived_at is not null then raise exception 'Prospect archivé.' using errcode = 'P0001'; end if;
  if p.stage <> 'a_preparer' then raise exception 'Seul un message « à préparer » peut être validé.' using errcode = 'P0001'; end if;
  update public.prospects
     set stage = 'pret', approved_at = now(), approved_by = me,
         approved_message_md5 = md5(coalesce(subject, '') || '|' || message),
         version = version + 1, updated_at = now()
   where id = p_id;
  perform public._prospect_log(p_id, null, 'utilisateur', 'message_valide', jsonb_build_object('md5', md5(coalesce(p.subject, '') || '|' || p.message)));
  return p.version + 1;
end;
$$;

-- Ouvrir une tentative : fige le texte envoyé et fournit le jeton de copie cachée
create or replace function public.prospect_start_attempt(p_id uuid, p_channel text, p_version integer)
returns table (attempt_id uuid, bcc_token text, new_version integer)
language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); p public.prospects; a public.prospect_attempts;
begin
  p := public._prospect_lock(p_id, p_version);
  if p.do_not_contact_at is not null then raise exception 'Ce prospect ne veut plus être contacté (STOP).' using errcode = 'P0001'; end if;
  if p.stage not in ('pret', 'contacte', 'en_discussion') then
    raise exception 'Validez d''abord le message.' using errcode = 'P0001';
  end if;
  if p.approved_message_md5 is distinct from md5(coalesce(p.subject, '') || '|' || p.message) then
    raise exception 'Le message a changé depuis sa validation : validez-le à nouveau.' using errcode = 'P0001';
  end if;
  if p_channel = 'email' and p.email is null then raise exception 'Aucune adresse e-mail pour ce prospect.' using errcode = 'P0001'; end if;
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

-- Déclarer la tentative faite. Contrôles anti-erreur :
--   * la tentative doit être ouverte depuis au moins 20 s (C1 : pas de déclaration « en rafale »)
--   * l'utilisateur coche les confirmations (passées en paramètre, vérifiées ici)
--   * un appel exige un résultat
create or replace function public.prospect_declare_attempt(
  p_attempt_id uuid, p_confirmations text[], p_call_outcome text default null
) returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); a public.prospect_attempts; required text[];
begin
  select * into a from public.prospect_attempts where id = p_attempt_id for update;
  if not found then raise exception 'Tentative introuvable.' using errcode = 'P0002'; end if;
  if a.state <> 'ouverte' then raise exception 'Cette tentative n''est plus en cours.' using errcode = 'P0001'; end if;
  if now() - a.opened_at < interval '20 seconds' then
    raise exception 'Trop rapide : vérifiez d''abord que l''action est réellement faite.' using errcode = 'P0001';
  end if;
  required := case a.channel
    when 'email' then array['bon_compte', 'clique_envoyer', 'vu_dans_envoyes']
    when 'formulaire' then array['formulaire_soumis', 'confirmation_du_site']
    else array['appel_passe'] end;
  if not (p_confirmations @> required) then
    raise exception 'Toutes les confirmations sont obligatoires.' using errcode = 'P0001';
  end if;
  if a.channel = 'telephone' and p_call_outcome is null then
    raise exception 'Indiquez le résultat de l''appel.' using errcode = 'P0001';
  end if;
  update public.prospect_attempts
     set state = 'declaree', proof = 'declaration', declared_at = now(),
         call_outcome = case when a.channel = 'telephone' then p_call_outcome end
   where id = p_attempt_id;
  -- Étape « contacté » seulement si le contact a pu avoir lieu
  update public.prospects
     set stage = case when stage = 'pret' and coalesce(p_call_outcome, 'joint') not in ('faux_numero') then 'contacte' else stage end,
         next_action_at = coalesce(next_action_at, (now() + interval '7 days')::date),
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
  -- Si plus aucune tentative déclarée ou prouvée : le prospect revient à « prêt »
  update public.prospects p
     set stage = 'pret', version = version + 1, updated_at = now()
   where p.id = a.prospect_id and p.stage = 'contacte'
     and not exists (select 1 from public.prospect_attempts x
                      where x.prospect_id = p.id and x.state in ('declaree', 'verifiee'));
  perform public._prospect_log(a.prospect_id, a.id, 'utilisateur',
    case when a.state = 'ouverte' then 'tentative_annulee' else 'declaration_retiree' end,
    jsonb_build_object('raison', p_reason, 'etat_precedent', a.state));
end;
$$;

-- Signaler un échec (adresse refusée, formulaire en panne…)
create or replace function public.prospect_fail_attempt(p_attempt_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); a public.prospect_attempts;
begin
  select * into a from public.prospect_attempts where id = p_attempt_id for update;
  if not found or a.state not in ('ouverte', 'declaree') then raise exception 'Tentative non modifiable.' using errcode = 'P0001'; end if;
  update public.prospect_attempts set state = 'echec', failure_reason = left(coalesce(p_reason, ''), 500), closed_at = now() where id = p_attempt_id;
  perform public._prospect_log(a.prospect_id, a.id, 'utilisateur', 'tentative_echouee', jsonb_build_object('raison', p_reason));
end;
$$;

-- Enregistrer une réponse du prospect (sens obligatoire ; « stop » bloque tout contact)
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
         notes = case when coalesce(p_note, '') = '' then notes else left(notes || E'\n' || to_char(now() at time zone 'Europe/Paris', 'DD/MM/YYYY HH24:MI') || ' — ' || p_note, 2000) end,
         version = version + 1, updated_at = now()
   where id = p_id;
  perform public._prospect_log(p_id, null, 'utilisateur', 'reponse_enregistree', jsonb_build_object('type', p_kind, 'note', p_note));
end;
$$;

-- Opposition (sans attendre une réponse : demande par téléphone, courrier…)
create or replace function public.prospect_do_not_contact(p_id uuid, p_reason text, p_version integer)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); p public.prospects;
begin
  p := public._prospect_lock(p_id, p_version);
  update public.prospects set stage = 'ne_plus_contacter', do_not_contact_at = now(),
         do_not_contact_reason = left(coalesce(p_reason, 'Opposition'), 500), version = version + 1, updated_at = now()
   where id = p_id;
  update public.prospect_attempts set state = 'annulee', cancel_reason = 'Opposition du prospect', closed_at = now()
   where prospect_id = p_id and state = 'ouverte';
  perform public._prospect_log(p_id, null, 'utilisateur', 'ne_plus_contacter', jsonb_build_object('raison', p_reason));
end;
$$;

-- Notes (avec contrôle de version)
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

-- Archiver / désarchiver (jamais de suppression depuis l'interface)
create or replace function public.prospect_archive(p_id uuid, p_archive boolean, p_version integer)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); p public.prospects;
begin
  p := public._prospect_lock(p_id, p_version);
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
  if not found then return; end if;
  if p.company <> p_confirm_company then raise exception 'Le nom saisi ne correspond pas.' using errcode = 'P0001'; end if;
  perform set_config('prospect.erase', 'on', true);
  delete from public.prospects where id = p_id; -- tentatives et journal supprimés en cascade
end;
$$;

-- ---------------------------------------------------------------------
-- 7. PREUVE : copie cachée reçue (appelée par la fonction de réception)
--    L'e-mail de prospection contient en Cci « prospect-<jeton>@reponses… ».
--    Quand Gmail l'envoie réellement, la plateforme en reçoit une copie.
-- ---------------------------------------------------------------------
create or replace function public.prospect_verify_by_bcc(
  p_token text, p_provider_email_id text, p_from text, p_expected_from text
) returns table (attempt_id uuid, prospect_id uuid, wrong_sender boolean)
language plpgsql security definer set search_path = public as $$
declare a public.prospect_attempts; wrong boolean;
begin
  select * into a from public.prospect_attempts where bcc_token = lower(p_token) for update;
  if not found then return; end if;
  wrong := lower(coalesce(p_from, '')) not like '%' || lower(p_expected_from) || '%';
  -- La preuve l'emporte toujours sur la déclaration : même une tentative annulée
  -- ou déclarée en échec devient « vérifiée » si le message est réellement parti.
  if a.state <> 'verifiee' then
    update public.prospect_attempts
       set state = 'verifiee', proof = 'cci_recue', verified_at = now(), declared_at = coalesce(declared_at, now()),
           verified_from = left(p_from, 300), provider_email_id = p_provider_email_id, closed_at = null
     where id = a.id;
    update public.prospects set stage = case when stage = 'pret' then 'contacte' else stage end,
           next_action_at = coalesce(next_action_at, (now() + interval '7 days')::date),
           version = version + 1, updated_at = now()
     where id = a.prospect_id;
  end if;
  insert into public.prospect_events (prospect_id, attempt_id, actor, type, detail)
  values (a.prospect_id, a.id, 'reception', case when wrong then 'envoi_prouve_mauvais_expediteur' else 'envoi_prouve' end,
          jsonb_build_object('expediteur', p_from, 'email_id', p_provider_email_id, 'etat_precedent', a.state));
  return query select a.id, a.prospect_id, wrong;
end;
$$;

-- ---------------------------------------------------------------------
-- 8. Droits d'exécution
-- ---------------------------------------------------------------------
revoke execute on function public._prospect_require_admin(), public._prospect_log(uuid, uuid, text, text, jsonb),
  public._prospect_lock(uuid, integer) from public, anon, authenticated;
revoke execute on function public.prospect_verify_by_bcc(text, text, text, text) from public, anon, authenticated;
grant execute on function public.prospect_verify_by_bcc(text, text, text, text) to service_role;
revoke execute on function
  public.prospect_approve(uuid, integer), public.prospect_start_attempt(uuid, text, integer),
  public.prospect_declare_attempt(uuid, text[], text), public.prospect_cancel_attempt(uuid, text),
  public.prospect_fail_attempt(uuid, text), public.prospect_record_reply(uuid, text, text, integer),
  public.prospect_do_not_contact(uuid, text, integer), public.prospect_update_notes(uuid, text, integer),
  public.prospect_archive(uuid, boolean, integer), public.prospect_erase(uuid, text)
  from public, anon;
grant execute on function
  public.prospect_approve(uuid, integer), public.prospect_start_attempt(uuid, text, integer),
  public.prospect_declare_attempt(uuid, text[], text), public.prospect_cancel_attempt(uuid, text),
  public.prospect_fail_attempt(uuid, text), public.prospect_record_reply(uuid, text, text, integer),
  public.prospect_do_not_contact(uuid, text, integer), public.prospect_update_notes(uuid, text, integer),
  public.prospect_archive(uuid, boolean, integer), public.prospect_erase(uuid, text)
  to authenticated;

-- ---------------------------------------------------------------------
-- 9. Reprise des données existantes : AUCUN « envoyé » sans preuve
--    Les anciens statuts « envoye » / « repondu » sont des déclarations
--    sans preuve : ils redeviennent « pret », et le journal le dit.
-- ---------------------------------------------------------------------
update public.prospects
   set stage = case status when 'a_valider' then 'a_preparer' when 'pas_interesse' then 'pas_interesse' else 'pret' end,
       approved_at = case when status <> 'a_valider' then coalesce(approved_at, updated_at) end,
       approved_message_md5 = case when status <> 'a_valider' then md5(coalesce(subject, '') || '|' || message) end,
       is_test = company like 'TEST%'
 where stage = 'a_preparer';

insert into public.prospect_events (prospect_id, actor, type, detail)
select id, 'systeme', 'reprise_v2',
       jsonb_build_object('ancien_statut', status, 'ancienne_date_envoi', sent_at,
                          'remarque', case when status in ('envoye', 'repondu')
                                           then 'Statut déclaré sans preuve : non repris comme envoi.' end)
  from public.prospects;
