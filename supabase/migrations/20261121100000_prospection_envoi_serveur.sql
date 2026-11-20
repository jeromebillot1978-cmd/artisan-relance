-- =====================================================================
-- Prospection v3 : ENVOI DIRECT PAR LE SERVEUR (un clic « Valider et envoyer »)
--
-- Le serveur du site envoie l'e-mail lui-même, depuis la boîte Gmail de prospection
-- (SMTP smtp.gmail.com, mot de passe d'application), sans brouillon ni fenêtre Gmail.
--
-- Cycle d'une tentative « serveur » :
--   ouverte (envoi demandé) ──► envoyee (Gmail a accepté le message : « Envoyé »)
--                          └──► echec   (refus SMTP, délai dépassé… : raison enregistrée)
--   envoyee ──► verifiee (la copie cachée est arrivée sur reponses.jercat.fr : « Prouvé »)
--
-- Diagnostic des liens : on enregistre les href du HTML ENVOYÉ (côté serveur) et ceux du
-- HTML REÇU (copie cachée), et on signale toute réécriture (google.com/url…).
-- Migration additive : aucune donnée existante n'est modifiée.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tentatives : nouvel état « envoyee », nouvelle preuve « smtp », colonnes d'envoi
-- ---------------------------------------------------------------------
alter table public.prospect_attempts
  add column if not exists sent_at               timestamptz,
  add column if not exists smtp_message_id       text check (char_length(smtp_message_id) <= 300),
  add column if not exists smtp_response         text check (char_length(smtp_response) <= 500),
  add column if not exists send_duration_ms      integer,
  add column if not exists sent_hrefs            jsonb,
  add column if not exists received_hrefs        jsonb,
  add column if not exists link_rewrite_detected boolean;

alter table public.prospect_attempts drop constraint if exists prospect_attempts_state_check;
alter table public.prospect_attempts add constraint prospect_attempts_state_check
  check (state in ('ouverte', 'envoyee', 'declaree', 'verifiee', 'echec', 'annulee'));

alter table public.prospect_attempts drop constraint if exists prospect_attempts_proof_check;
alter table public.prospect_attempts add constraint prospect_attempts_proof_check
  check (proof in ('aucune', 'declaration', 'smtp', 'cci_recue', 'gmail_api'));

alter table public.prospect_attempts drop constraint if exists prospect_attempts_draft_method_check;
alter table public.prospect_attempts add constraint prospect_attempts_draft_method_check
  check (draft_method in ('gmail_web', 'gmail_app_android', 'gmail_app_ios', 'mailto', 'copie', 'site_ouvert', 'numero_compose', 'manuel', 'serveur'));

alter table public.prospect_attempts drop constraint if exists attempt_proof_coherent;
alter table public.prospect_attempts add constraint attempt_proof_coherent check (
  (state = 'ouverte'  and proof = 'aucune') or
  (state = 'envoyee'  and proof = 'smtp' and channel = 'email' and sent_at is not null) or
  (state = 'declaree' and proof = 'declaration') or
  (state = 'verifiee' and proof in ('cci_recue', 'gmail_api') and channel = 'email') or
  (state in ('echec', 'annulee'))
);

create index if not exists prospect_attempts_sent_idx on public.prospect_attempts (sent_at) where sent_at is not null;

-- Plafond quotidien d'envois automatiques (protège la réputation de la boîte Gmail)
create or replace function public._prospect_daily_cap() returns integer language sql immutable as $$ select 30 $$;

-- ---------------------------------------------------------------------
-- 2. Liens d'un HTML : liste des href + détection d'une réécriture
-- ---------------------------------------------------------------------
create or replace function public._prospect_hrefs(p_html text)
returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(distinct replace(m[1], '&amp;', '&')), '[]'::jsonb)
    from regexp_matches(coalesce(p_html, ''), 'href\s*=\s*["'']([^"'']+)["'']', 'gi') as m
$$;

create or replace function public._prospect_has_rewrite(p_hrefs jsonb, p_text text default null)
returns boolean language sql immutable as $$
  select exists (select 1 from jsonb_array_elements_text(coalesce(p_hrefs, '[]'::jsonb)) h
                  where h ~* '^https?://([a-z0-9-]+\.)*google\.[a-z.]+/url\?'
                     or h ~* '^https?://([a-z0-9-]+\.)*(safelinks\.protection\.outlook\.com|urldefense\.(com|proofpoint\.com))/')
      or coalesce(p_text, '') ~* 'https?://([a-z0-9-]+\.)*google\.[a-z.]+/url\?'
$$;

-- ---------------------------------------------------------------------
-- 3. « Valider et envoyer » — étape A : réserver l'envoi (avant d'appeler Gmail)
--    Valide le texte s'il ne l'est pas, fige le message, fournit le jeton de copie cachée.
-- ---------------------------------------------------------------------
create or replace function public.prospect_server_send_begin(p_id uuid, p_version integer)
returns table (attempt_id uuid, bcc_token text, to_address text, subject text, message text, new_version integer)
language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); p public.prospects; a public.prospect_attempts; h text; sent_today integer; v integer;
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
  h := public._prospect_md5(p.subject, p.message);
  -- Anti-doublon : ce même texte est déjà parti à ce prospect dans les 24 dernières heures
  if exists (select 1 from public.prospect_attempts x
              where x.prospect_id = p_id and x.state in ('envoyee', 'verifiee') and x.channel = 'email'
                and public._prospect_md5(x.subject_snapshot, x.message_snapshot) = h
                and coalesce(x.sent_at, x.verified_at) > now() - interval '24 hours') then
    raise exception 'Ce message a déjà été envoyé à ce prospect dans les dernières 24 h.' using errcode = 'P0001';
  end if;
  if not p.is_test then
    select count(*) into sent_today from public.prospect_attempts x join public.prospects y on y.id = x.prospect_id
     where x.draft_method = 'serveur' and x.state in ('envoyee', 'verifiee') and not y.is_test
       and x.sent_at > now() - interval '24 hours';
    if sent_today >= public._prospect_daily_cap() then
      raise exception 'Limite de % envois automatiques par 24 h atteinte (protection de votre boîte Gmail).', public._prospect_daily_cap()
        using errcode = 'P0001';
    end if;
  end if;

  -- Un seul clic : « Valider » vaut validation du texte actuel
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
  values (p_id, 'email', p.email, p.subject, p.message, me, now(), 'serveur')
  returning * into a;
  update public.prospects set version = version + 1, updated_at = now() where id = p_id;
  v := v + 1;
  perform public._prospect_log(p_id, a.id, 'utilisateur', 'envoi_serveur_demande',
    jsonb_build_object('destinataire', p.email, 'objet', p.subject, 'md5', h));
  return query select a.id, a.bcc_token, p.email, p.subject, p.message, v;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. « Valider et envoyer » — étape B : résultat réel de l'envoi SMTP
-- ---------------------------------------------------------------------
create or replace function public.prospect_server_send_result(
  p_attempt_id uuid, p_ok boolean, p_message_id text, p_response text, p_error text,
  p_sent_hrefs jsonb, p_duration_ms integer
) returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); a public.prospect_attempts;
begin
  select * into a from public.prospect_attempts where id = p_attempt_id for update;
  if not found then raise exception 'Tentative introuvable.' using errcode = 'P0002'; end if;
  if a.draft_method is distinct from 'serveur' then raise exception 'Cette tentative n''est pas un envoi automatique.' using errcode = 'P0001'; end if;
  if a.state <> 'ouverte' then
    -- La copie cachée peut arriver AVANT ce compte rendu : l'envoi est alors déjà prouvé
    if a.state = 'verifiee' and p_ok then
      update public.prospect_attempts
         set sent_at = coalesce(sent_at, now()), smtp_message_id = left(p_message_id, 300), smtp_response = left(p_response, 500),
             send_duration_ms = p_duration_ms, sent_hrefs = p_sent_hrefs
       where id = p_attempt_id;
      perform public._prospect_log(a.prospect_id, a.id, 'systeme', 'envoi_serveur_accepte',
        jsonb_build_object('message_id', p_message_id, 'reponse_smtp', p_response, 'liens_envoyes', p_sent_hrefs,
                           'reecriture_detectee', public._prospect_has_rewrite(p_sent_hrefs), 'duree_ms', p_duration_ms,
                           'remarque', 'copie de contrôle arrivée avant le compte rendu'));
      return;
    end if;
    raise exception 'Cette tentative n''est plus en cours.' using errcode = 'P0001';
  end if;

  if p_ok then
    update public.prospect_attempts
       set state = 'envoyee', proof = 'smtp', sent_at = now(), declared_at = now(),
           smtp_message_id = left(p_message_id, 300), smtp_response = left(p_response, 500),
           send_duration_ms = p_duration_ms, sent_hrefs = p_sent_hrefs
     where id = p_attempt_id;
    update public.prospects p
       set stage = case when p.stage in ('a_preparer', 'pret') then 'contacte' else p.stage end,
           next_action_at = coalesce(p.next_action_at, (now() + interval '7 days')::date),
           version = p.version + 1, updated_at = now()
     where p.id = a.prospect_id;
    perform public._prospect_log(a.prospect_id, a.id, 'systeme', 'envoi_serveur_accepte',
      jsonb_build_object('message_id', p_message_id, 'reponse_smtp', p_response, 'liens_envoyes', p_sent_hrefs,
                         'reecriture_detectee', public._prospect_has_rewrite(p_sent_hrefs), 'duree_ms', p_duration_ms));
  else
    update public.prospect_attempts
       set state = 'echec', failure_reason = left(coalesce(nullif(trim(p_error), ''), 'Erreur inconnue'), 500),
           smtp_response = left(p_response, 500), send_duration_ms = p_duration_ms, sent_hrefs = p_sent_hrefs, closed_at = now()
     where id = p_attempt_id;
    update public.prospects set version = version + 1, updated_at = now() where id = a.prospect_id;
    perform public._prospect_log(a.prospect_id, a.id, 'systeme', 'envoi_serveur_echec',
      jsonb_build_object('erreur', p_error, 'reponse_smtp', p_response, 'duree_ms', p_duration_ms));
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Preuve par copie cachée : passe aussi « envoyee » → « verifiee »,
--    et enregistre les liens RÉELLEMENT reçus (diagnostic de réécriture).
-- ---------------------------------------------------------------------
drop function if exists public.prospect_verify_by_bcc(text, text, text, text, text);
create or replace function public.prospect_verify_by_bcc(
  p_token text, p_provider_email_id text, p_from text, p_expected_from text,
  p_received_text text default null, p_received_html text default null
) returns table (attempt_id uuid, prospect_id uuid, wrong_sender boolean, content_check text)
language plpgsql security definer set search_path = public as $$
declare a public.prospect_attempts; wrong boolean; last_line text; check_result text; hrefs jsonb; rewrite boolean;
        norm text := lower(regexp_replace(coalesce(p_received_text, ''), '\s+', ' ', 'g'));
begin
  perform set_config('prospect.via_function', 'on', true);
  select * into a from public.prospect_attempts x where x.bcc_token = lower(p_token) for update;
  if not found then return; end if;
  if a.provider_email_id is not null and a.provider_email_id = p_provider_email_id then
    return query select a.id, a.prospect_id, a.wrong_sender, a.content_check; return;
  end if;
  wrong := position(lower(p_expected_from) in lower(coalesce(p_from, ''))) = 0;
  select lower(trim(regexp_replace(t.l, '\s+', ' ', 'g'))) into last_line
    from regexp_split_to_table(coalesce(a.message_snapshot, ''), E'\n') with ordinality as t(l, n)
   where trim(t.l) <> '' order by t.n desc limit 1;
  check_result := case when norm = '' or last_line is null then 'inconnu'
                       when position(last_line in norm) > 0 then 'complet' else 'tronque' end;
  hrefs := case when p_received_html is null then null else public._prospect_hrefs(p_received_html) end;
  rewrite := case when p_received_html is null and p_received_text is null then null
                  else public._prospect_has_rewrite(hrefs, p_received_text) end;
  if a.state <> 'verifiee' then
    update public.prospect_attempts
       set state = 'verifiee', proof = 'cci_recue', verified_at = now(), declared_at = coalesce(declared_at, now()),
           draft_opened_at = coalesce(draft_opened_at, now()),
           verified_from = left(p_from, 300), wrong_sender = wrong, content_check = check_result,
           provider_email_id = p_provider_email_id, closed_at = null,
           received_hrefs = hrefs, link_rewrite_detected = rewrite
     where id = a.id;
    update public.prospects p set stage = case when p.stage in ('a_preparer', 'pret') then 'contacte' else p.stage end,
           next_action_at = coalesce(p.next_action_at, (now() + interval '7 days')::date),
           version = p.version + 1, updated_at = now()
     where p.id = a.prospect_id;
  end if;
  insert into public.prospect_events (prospect_id, attempt_id, actor, type, detail)
  values (a.prospect_id, a.id, 'reception',
          case when wrong then 'envoi_prouve_mauvais_expediteur' else 'envoi_prouve' end,
          jsonb_build_object('expediteur', p_from, 'email_id', p_provider_email_id, 'etat_precedent', a.state, 'contenu', check_result,
                             'liens_recus', hrefs, 'reecriture_detectee', rewrite));
  if rewrite then
    insert into public.prospect_events (prospect_id, attempt_id, actor, type, detail)
    values (a.prospect_id, a.id, 'reception', 'liens_reecrits',
            jsonb_build_object('liens_recus', hrefs, 'liens_envoyes', a.sent_hrefs));
  end if;
  return query select a.id, a.prospect_id, wrong, check_result;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Annulation : un e-mail réellement envoyé par le serveur ne s'annule pas
-- ---------------------------------------------------------------------
create or replace function public.prospect_cancel_attempt(p_attempt_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public._prospect_require_admin(); a public.prospect_attempts;
begin
  if coalesce(trim(p_reason), '') = '' then raise exception 'Indiquez la raison.' using errcode = 'P0001'; end if;
  select * into a from public.prospect_attempts where id = p_attempt_id for update;
  if not found then raise exception 'Tentative introuvable.' using errcode = 'P0002'; end if;
  if a.state = 'verifiee' then raise exception 'Un envoi prouvé ne peut pas être annulé.' using errcode = 'P0001'; end if;
  if a.state = 'envoyee' then raise exception 'Cet e-mail a été envoyé par le serveur : il ne peut pas être annulé.' using errcode = 'P0001'; end if;
  if a.state in ('annulee', 'echec') then raise exception 'Tentative déjà close.' using errcode = 'P0001'; end if;
  update public.prospect_attempts set state = 'annulee', cancel_reason = left(p_reason, 500), closed_at = now() where id = p_attempt_id;
  -- Plus aucun contact déclaré ou prouvé : le prospect revient à « relu, pas encore contacté »
  update public.prospects p
     set stage = case when p.stage = 'contacte' and not exists (select 1 from public.prospect_attempts x
                        where x.prospect_id = p.id and x.state in ('envoyee', 'declaree', 'verifiee')) then 'pret' else p.stage end,
         version = version + 1, updated_at = now()
   where p.id = a.prospect_id;
  perform public._prospect_log(a.prospect_id, a.id, 'utilisateur',
    case when a.state = 'ouverte' then 'tentative_annulee' else 'declaration_retiree' end,
    jsonb_build_object('raison', p_reason, 'etat_precedent', a.state));
end;
$$;

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
                        where x.prospect_id = p.id and x.state in ('envoyee', 'declaree', 'verifiee')) then 'pret' else p.stage end,
         version = version + 1, updated_at = now()
   where p.id = a.prospect_id;
  perform public._prospect_log(a.prospect_id, a.id, 'utilisateur', 'tentative_echouee', jsonb_build_object('raison', p_reason));
end;
$$;

-- ---------------------------------------------------------------------
-- 7. Droits d'exécution
-- ---------------------------------------------------------------------
revoke execute on function public.prospect_verify_by_bcc(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.prospect_verify_by_bcc(text, text, text, text, text, text) to service_role;
revoke execute on function public._prospect_daily_cap(), public._prospect_hrefs(text), public._prospect_has_rewrite(jsonb, text)
  from public, anon, authenticated;
revoke execute on function public.prospect_server_send_begin(uuid, integer),
  public.prospect_server_send_result(uuid, boolean, text, text, text, jsonb, integer) from public, anon;
grant execute on function public.prospect_server_send_begin(uuid, integer),
  public.prospect_server_send_result(uuid, boolean, text, text, text, jsonb, integer) to authenticated;
