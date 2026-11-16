-- =====================================================================
-- Audit du système e-mail (16/11/2026)
--  1. Réponses classées : vraie réponse, réponse automatique (absence),
--     demande « STOP », copie de l'artisan, message suspect.
--     Seule une vraie réponse passe le devis en « Répondu ».
--  2. Rebonds, plaintes et adresses bloquées (webhooks Resend) :
--     le devis est suspendu et l'artisan prévenu.
--  3. Fil de discussion : Message-ID du devis initial conservé pour que
--     les relances s'affichent dans la même conversation (Outlook, Apple Mail).
--  4. Garde-fou : jamais d'envoi vers nos propres adresses techniques.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Réponses reçues : type de message
-- ---------------------------------------------------------------------
alter table public.inbound_replies
  add column if not exists kind text not null default 'reply';
alter table public.inbound_replies drop constraint if exists inbound_replies_kind_check;
alter table public.inbound_replies add constraint inbound_replies_kind_check
  check (kind in ('reply', 'auto_reply', 'opt_out', 'artisan_copy', 'suspicious'));

-- Adresse seule, en minuscules, à partir de « Nom <adresse> »
create or replace function public.email_address_only(p_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select lower(trim(coalesce(substring(p_value from '<([^<>]+)>'), p_value)));
$$;

drop function if exists public.register_reply(text, text, text, text);
create or replace function public.register_reply(
  p_token text, p_provider_email_id text, p_from text, p_subject text, p_kind text default 'reply'
)
returns table (
  campaign_id uuid, prospect_name text, subject text, user_email text,
  reply_to_email text, company_name text, already_processed boolean, can_forward boolean,
  kind text, sender_is_recipient boolean, recipients text[]
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  c         public.campaigns%rowtype;
  p         public.profiles%rowtype;
  inserted  boolean;
  v_from    text := public.email_address_only(p_from);
  v_kind    text := case when p_kind in ('reply', 'auto_reply', 'opt_out', 'suspicious') then p_kind else 'reply' end;
  v_is_recipient boolean;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{24}$' then return; end if;
  select * into c from public.campaigns where reply_token = p_token for update;
  if c.id is null then
    -- jeton inconnu : on garde une trace (idempotence) sans rattachement
    insert into public.inbound_replies (provider_email_id, from_address, subject, kind)
    values (p_provider_email_id, left(p_from, 300), left(p_subject, 300), v_kind)
    on conflict (provider_email_id) do nothing;
    return;
  end if;
  select * into p from public.profiles where id = c.user_id;

  v_is_recipient := v_from = any (c.recipients);
  -- L'artisan qui répond à sa propre copie (copie cachée du devis) n'est pas une réponse du client
  if not v_is_recipient and v_from in (lower(coalesce(p.email, '')), lower(coalesce(p.reply_to_email, ''))) then
    v_kind := 'artisan_copy';
  end if;

  insert into public.inbound_replies (provider_email_id, campaign_id, user_id, from_address, subject, kind)
  values (p_provider_email_id, c.id, c.user_id, left(p_from, 300), left(p_subject, 300), v_kind)
  on conflict (provider_email_id) do nothing;
  inserted := found;

  if not inserted then
    -- déjà traité (Resend réessaie) : on renvoie le classement d'origine
    select r.kind into v_kind from public.inbound_replies r where r.provider_email_id = p_provider_email_id;
  else
    if v_kind = 'reply' then
      update public.campaigns
         set replied_at = coalesce(replied_at, now()),
             status = case when status in ('draft', 'active', 'paused') then 'replied' else status end,
             next_followup_at = case when status in ('draft', 'active', 'paused') then null else next_followup_at end
       where id = c.id;
    elsif v_kind = 'opt_out' then
      -- « STOP » : plus aucune relance ni demande d'avis pour cette adresse
      update public.campaigns
         set status = case when status in ('draft', 'active', 'paused', 'replied') then 'stopped' else status end,
             stopped_at = case when status in ('draft', 'active', 'paused', 'replied') then now() else stopped_at end,
             pause_reason = case when status in ('draft', 'active', 'paused', 'replied') then 'opt_out' else pause_reason end,
             next_followup_at = null
       where id = c.id;
      if v_is_recipient then
        insert into public.review_optouts (user_id, email) values (c.user_id, v_from) on conflict do nothing;
      end if;
    end if;
    insert into public.campaign_events (campaign_id, user_id, type, detail)
    values (c.id, c.user_id,
            case v_kind when 'reply' then 'reply_received'
                        when 'auto_reply' then 'auto_reply_received'
                        when 'opt_out' then 'opt_out'
                        when 'artisan_copy' then 'artisan_copy_reply'
                        else 'suspicious_reply' end,
            jsonb_build_object('from', left(p_from, 300), 'subject', left(p_subject, 300),
                               'unexpected_sender', not v_is_recipient and v_kind <> 'artisan_copy'));
  end if;

  return query
    select c.id, c.prospect_name, c.subject, p.email, p.reply_to_email, p.company_name, not inserted,
           -- anti-boucle et anti-coût : transferts limités par dossier, budget global respecté
           (select count(*) from public.inbound_replies r
             where r.campaign_id = c.id and r.created_at > now() - interval '24 hours')
             <= public.setting_int('reply_forward_daily_limit', 10)
           and public.emails_used_today(null) < public.setting_int('daily_email_limit', 90),
           v_kind, v_is_recipient, c.recipients;
end;
$$;
revoke execute on function public.register_reply(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.register_reply(text, text, text, text, text) to service_role;
revoke execute on function public.email_address_only(text) from public, anon;

-- ---------------------------------------------------------------------
-- 2. Rebonds, plaintes, adresses bloquées
-- ---------------------------------------------------------------------
create table if not exists public.email_delivery_issues (
  provider_id  text not null,
  type         text not null check (type in ('bounced', 'complained', 'suppressed', 'failed')),
  campaign_id  uuid references public.campaigns (id) on delete cascade,
  review_id    uuid references public.review_requests (id) on delete cascade,
  user_id      uuid references public.profiles (id) on delete cascade,
  recipients   text[],
  detail       jsonb not null default '{}'::jsonb,
  notified     boolean not null default false,
  created_at   timestamptz not null default now(),
  primary key (provider_id, type)
);
create index if not exists email_delivery_issues_user_idx on public.email_delivery_issues (user_id, created_at desc);
alter table public.email_delivery_issues enable row level security;
revoke all on public.email_delivery_issues from anon, authenticated;

create or replace function public.register_delivery_issue(p_provider_id text, p_type text, p_detail jsonb default '{}'::jsonb)
returns table (
  source text, campaign_id uuid, review_id uuid, prospect_name text, recipients text[],
  user_email text, reply_to_email text, company_name text, first_time boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  s   public.campaign_sends%rowtype;
  rr  public.review_requests%rowtype;
  c   public.campaigns%rowtype;
  p   public.profiles%rowtype;
  inserted boolean;
begin
  if p_type not in ('bounced', 'complained', 'suppressed', 'failed') then return; end if;

  select * into s from public.campaign_sends where provider_id = p_provider_id limit 1;
  if s.id is not null then
    select * into c from public.campaigns where id = s.campaign_id for update;
    select * into p from public.profiles where id = c.user_id;
    insert into public.email_delivery_issues (provider_id, type, campaign_id, user_id, recipients, detail)
    values (p_provider_id, p_type, c.id, c.user_id, s.recipients, coalesce(p_detail, '{}'::jsonb))
    on conflict do nothing;
    inserted := found;
    if inserted then
      if p_type = 'complained' then
        -- le client a signalé l'e-mail comme indésirable : arrêt définitif
        update public.campaigns
           set status = case when status in ('draft', 'active', 'paused', 'replied') then 'stopped' else status end,
               stopped_at = case when status in ('draft', 'active', 'paused', 'replied') then now() else stopped_at end,
               pause_reason = case when status in ('draft', 'active', 'paused', 'replied') then 'complaint' else pause_reason end,
               next_followup_at = null
         where id = c.id;
        insert into public.review_optouts (user_id, email)
        select c.user_id, r from unnest(s.recipients) r on conflict do nothing;
      elsif c.status in ('draft', 'active') then
        -- adresse invalide ou bloquée : on suspend pour ne plus envoyer dans le vide
        update public.campaigns set status = 'paused', pause_reason = 'bounce', next_followup_at = null where id = c.id;
      end if;
      insert into public.campaign_events (campaign_id, user_id, type, detail)
      values (c.id, c.user_id, 'delivery_' || p_type,
              jsonb_build_object('recipients', s.recipients, 'sequence', s.sequence) || coalesce(p_detail, '{}'::jsonb));
    end if;
    return query select 'campaign'::text, c.id, null::uuid, c.prospect_name, s.recipients,
                        p.email, p.reply_to_email, p.company_name, inserted;
    return;
  end if;

  select * into rr from public.review_requests where provider_id = p_provider_id limit 1;
  if rr.id is not null then
    select * into p from public.profiles where id = rr.user_id;
    insert into public.email_delivery_issues (provider_id, type, review_id, user_id, recipients, detail)
    values (p_provider_id, p_type, rr.id, rr.user_id, rr.recipients, coalesce(p_detail, '{}'::jsonb))
    on conflict do nothing;
    inserted := found;
    if inserted then
      update public.review_requests set last_error = left('Adresse ' || p_type || ' : ' || array_to_string(rr.recipients, ', '), 500)
       where id = rr.id;
      if p_type = 'complained' then
        insert into public.review_optouts (user_id, email)
        select rr.user_id, r from unnest(rr.recipients) r on conflict do nothing;
      end if;
    end if;
    return query select 'review'::text, rr.campaign_id, rr.id, rr.client_name, rr.recipients,
                        p.email, p.reply_to_email, p.company_name, inserted;
  end if;
end;
$$;
revoke execute on function public.register_delivery_issue(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.register_delivery_issue(text, text, jsonb) to service_role;

create or replace function public.mark_delivery_issue_notified(p_provider_id text, p_type text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.email_delivery_issues set notified = true where provider_id = p_provider_id and type = p_type;
$$;
revoke execute on function public.mark_delivery_issue_notified(text, text) from public, anon, authenticated;
grant execute on function public.mark_delivery_issue_notified(text, text) to service_role;

-- ---------------------------------------------------------------------
-- 3. Fil de discussion : Message-ID réel des envois
-- ---------------------------------------------------------------------
alter table public.campaign_sends add column if not exists message_id text;

-- ---------------------------------------------------------------------
-- 4. Jamais de destinataire technique (boucle d'e-mails)
-- ---------------------------------------------------------------------
create or replace function public.campaign_recipients_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1 from unnest(new.recipients) r
     where lower(r) like '%@reponses.jercat.fr' or lower(r) = 'relances@jercat.fr'
  ) then
    raise exception 'Adresse e-mail invalide (adresse technique d''Artisan Relance).' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists campaigns_recipients_guard on public.campaigns;
create trigger campaigns_recipients_guard
  before insert or update of recipients on public.campaigns
  for each row execute function public.campaign_recipients_guard();
revoke execute on function public.campaign_recipients_guard() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Consentement : un client qui a répondu « STOP » ou signalé un e-mail
--    comme indésirable ne peut plus être relancé, quel que soit le chemin
--    (reprise, réouverture, relances réactivées).
-- ---------------------------------------------------------------------
create or replace function public.campaign_consent_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'active' and old.status is distinct from 'active' and exists (
    select 1 from public.campaign_events e
     where e.campaign_id = new.id and e.type in ('opt_out', 'delivery_complained')
  ) then
    raise exception 'Relances impossibles, ce client a demandé à ne plus être relancé (STOP) ou a signalé vos e-mails comme indésirables.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists campaigns_consent_guard on public.campaigns;
create trigger campaigns_consent_guard
  before update of status on public.campaigns
  for each row execute function public.campaign_consent_guard();
revoke execute on function public.campaign_consent_guard() from public, anon, authenticated;
