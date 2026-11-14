-- =====================================================================
-- ARTISAN RELANCE — Cycle de vie complet d'un devis
--  * historique des changements de statut (ancien → nouveau, origine)
--  * décision du client par lien (accepter / refuser + motif)
--  * clôture « Terminé » un intervalle après la dernière relance sans réponse
--  * actions artisan : Terminé, Réactiver les relances, motif de perte
-- Ré-exécutable.
-- =====================================================================

-- 1. Colonnes ----------------------------------------------------------
alter table public.campaigns add column if not exists lost_reason text;
alter table public.campaigns add column if not exists decided_by text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'campaigns_lost_reason_len') then
    alter table public.campaigns add constraint campaigns_lost_reason_len check (char_length(lost_reason) <= 500);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'campaigns_decided_by_chk') then
    alter table public.campaigns add constraint campaigns_decided_by_chk check (decided_by in ('artisan', 'client', 'system'));
  end if;
end $$;

-- 2. Historique des statuts -------------------------------------------
create table if not exists public.campaign_status_history (
  id           bigint generated always as identity primary key,
  campaign_id  uuid not null references public.campaigns (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  old_status   text,
  new_status   text not null,
  source       text not null check (source in ('artisan', 'client', 'email', 'system', 'migration')),
  actor_id     uuid,
  reason       text,
  created_at   timestamptz not null default now()
);
create index if not exists campaign_status_history_campaign_idx on public.campaign_status_history (campaign_id, created_at);
create index if not exists campaign_status_history_user_idx on public.campaign_status_history (user_id, created_at desc);
alter table public.campaign_status_history enable row level security;
drop policy if exists status_history_select_own on public.campaign_status_history;
create policy status_history_select_own on public.campaign_status_history
  for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.campaign_status_history from anon, authenticated;

-- Origine du changement : fixée par la fonction appelante (set_config local),
-- sinon « artisan » si un utilisateur est connecté, « system » sinon.
create or replace function public.set_status_source(p_source text, p_reason text default null)
returns void
language sql
set search_path = public
as $$
  select set_config('artisan_relance.source', p_source, true),
         set_config('artisan_relance.reason', coalesce(p_reason, ''), true);
$$;

create or replace function public.campaign_status_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source text := nullif(current_setting('artisan_relance.source', true), '');
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return null;
  end if;
  if v_source is null then
    v_source := case when auth.uid() is not null then 'artisan' else 'system' end;
  end if;
  insert into public.campaign_status_history (campaign_id, user_id, old_status, new_status, source, actor_id, reason)
  values (new.id, new.user_id, case when tg_op = 'UPDATE' then old.status end, new.status, v_source,
          auth.uid(), nullif(current_setting('artisan_relance.reason', true), ''));
  return null;
end;
$$;

drop trigger if exists campaigns_status_log on public.campaigns;
create trigger campaigns_status_log after insert or update of status on public.campaigns
  for each row execute function public.campaign_status_log();

-- Reprise de l'existant : statut actuel + événement « créé » manquant (devis convertis)
insert into public.campaign_status_history (campaign_id, user_id, old_status, new_status, source, created_at)
select c.id, c.user_id, null, c.status, 'migration', c.created_at
  from public.campaigns c
 where not exists (select 1 from public.campaign_status_history h where h.campaign_id = c.id);

insert into public.campaign_events (campaign_id, user_id, type, detail, created_at)
select c.id, c.user_id, 'created', jsonb_build_object('legacy', true), c.created_at
  from public.campaigns c
 where c.legacy_quote_id is not null
   and not exists (select 1 from public.campaign_events e where e.campaign_id = c.id and e.type = 'created');

-- 3. Planification : la campagne n'est plus close au moment de la dernière
-- relance mais un intervalle plus tard, si le client n'a toujours pas répondu.
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
  v_close  timestamptz;
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
    -- Dernière relance envoyée : le client a encore un intervalle pour répondre
    v_close := coalesce(c.last_followup_at, c.initial_sent_at) + make_interval(days => c.interval_days);
    update public.campaigns
       set next_followup_at = null,
           ends_at = case when v_ends is null then v_close else least(v_ends, v_close) end
     where id = p_id;
    return;
  end if;

  v_next := public.paris_send_window(greatest(
    c.initial_sent_at + make_interval(days => c.interval_days * (c.followups_sent + 1)),
    coalesce(c.last_followup_at, c.initial_sent_at) + make_interval(days => c.interval_days)
  ));

  if v_ends is not null and v_next > v_ends then
    update public.campaigns set next_followup_at = null, ends_at = v_ends where id = p_id;
  else
    update public.campaigns set next_followup_at = v_next, ends_at = v_ends where id = p_id;
  end if;
end;
$$;

-- Passage automatique en « Terminé » (appelé toutes les 15 min par pg_cron)
create or replace function public.close_finished_campaigns()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n integer := 0;
begin
  perform public.set_status_source('system', 'Aucune réponse du client');
  for r in
    select id, user_id, followups_sent, max_followups
      from public.campaigns
     where status = 'active' and next_followup_at is null
       and initial_sent_at is not null and ends_at is not null and ends_at <= now()
     for update skip locked
  loop
    update public.campaigns set status = 'completed', completed_at = now() where id = r.id;
    insert into public.campaign_events (campaign_id, user_id, type, detail)
    values (r.id, r.user_id, 'completed', jsonb_build_object(
      'reason', case when r.followups_sent >= r.max_followups then 'max_followups' else 'max_duration' end,
      'followups_sent', r.followups_sent));
    n := n + 1;
  end loop;
  return n;
end;
$$;

create index if not exists campaigns_closing_idx on public.campaigns (ends_at)
  where status = 'active' and next_followup_at is null;

-- 4. Réponse reçue par e-mail : origine « email » -------------------------
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
    perform public.set_status_source('email', left('Réponse de ' || coalesce(p_from, ''), 300));
    update public.campaigns
       set replied_at = coalesce(replied_at, now()),
           status = case when status in ('draft', 'active', 'paused', 'completed', 'stopped') then 'replied' else status end,
           next_followup_at = null
     where id = c.id;
    insert into public.campaign_events (campaign_id, user_id, type, detail)
    values (c.id, c.user_id, 'reply_received',
            jsonb_build_object('from', left(p_from, 300), 'subject', left(p_subject, 300)));
  end if;

  return query
    select c.id, c.prospect_name, c.subject, p.email, p.reply_to_email, p.company_name, not inserted,
           (select count(*) from public.inbound_replies r
             where r.campaign_id = c.id and r.created_at > now() - interval '24 hours')
             <= public.setting_int('reply_forward_daily_limit', 10)
           and public.emails_used_today(null) < public.setting_int('daily_email_limit', 90)
      from public.profiles p where p.id = c.user_id;
end;
$$;

-- 5. Décision du client (page publique /d/<jeton>) ----------------------
create or replace function public.client_quote(p_token text)
returns table (
  prospect_name text, company_name text, reference text, amount numeric,
  status text, initial_sent_at timestamptz, won_at timestamptz, lost_at timestamptz, contact_email text, phone text
)
language sql
stable
security definer
set search_path = public
as $$
  select c.prospect_name, p.company_name, c.reference, c.amount, c.status, c.initial_sent_at,
         c.won_at, c.lost_at, coalesce(p.reply_to_email, p.email), p.phone
    from public.campaigns c
    join public.profiles p on p.id = c.user_id
   where p_token ~ '^[a-f0-9]{24}$' and c.reply_token = p_token and c.initial_sent_at is not null;
$$;

-- Prévient l'artisan par e-mail (Edge Function, secret du coffre)
create or replace function public.notify_decision(p_campaign_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url text; v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'mailer_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'mailer_secret';
  if v_url is null or v_secret is null then return; end if;
  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret),
    body    := jsonb_build_object('mode', 'notify_decision', 'campaign_id', p_campaign_id),
    timeout_milliseconds := 30000
  );
end;
$$;

create or replace function public.client_decision(p_token text, p_decision text, p_reason text default null)
returns table (status text, changed boolean)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  c public.campaigns%rowtype;
  v_reason text := nullif(trim(left(coalesce(p_reason, ''), 500)), '');
begin
  if p_token !~ '^[a-f0-9]{24}$' or p_decision not in ('accept', 'refuse') then
    raise exception 'Lien invalide.' using errcode = 'P0001';
  end if;
  select * into c from public.campaigns where reply_token = p_token and initial_sent_at is not null for update;
  if not found then
    raise exception 'Lien invalide ou expiré.' using errcode = 'P0001';
  end if;

  -- Une décision déjà prise n'est pas modifiable par le client
  if c.status in ('won', 'lost') then
    return query select c.status, false;
    return;
  end if;

  if p_decision = 'accept' then
    perform public.set_status_source('client', 'Devis accepté en ligne');
    update public.campaigns
       set status = 'won', won_at = now(), lost_at = null, lost_reason = null, decided_by = 'client',
           replied_at = coalesce(replied_at, now()), next_followup_at = null, pause_reason = null
     where id = c.id;
    insert into public.campaign_events (campaign_id, user_id, type, detail)
    values (c.id, c.user_id, 'client_accepted', '{}'::jsonb);
  else
    perform public.set_status_source('client', coalesce(v_reason, 'Devis refusé en ligne'));
    update public.campaigns
       set status = 'lost', lost_at = now(), won_at = null, lost_reason = v_reason, decided_by = 'client',
           replied_at = coalesce(replied_at, now()), next_followup_at = null, pause_reason = null
     where id = c.id;
    insert into public.campaign_events (campaign_id, user_id, type, detail)
    values (c.id, c.user_id, 'client_refused', jsonb_build_object('reason', v_reason));
  end if;

  perform public.notify_decision(c.id);
  return query select case when p_decision = 'accept' then 'won' else 'lost' end, true;
end;
$$;

-- 6. Actions de l'artisan -------------------------------------------------
drop function if exists public.campaign_action(uuid, text);
create or replace function public.campaign_action(p_id uuid, p_action text, p_reason text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.campaigns%rowtype;
  v_status text;
  v_reason text := nullif(trim(left(coalesce(p_reason, ''), 500)), '');
begin
  select * into c from public.campaigns where id = p_id and user_id = auth.uid() for update;
  if not found then
    raise exception 'Devis introuvable.' using errcode = 'P0001';
  end if;

  perform public.set_status_source('artisan', v_reason);

  case p_action
    when 'pause' then
      if c.status <> 'active' then raise exception 'Seule une campagne en cours peut être suspendue.' using errcode = 'P0001'; end if;
      update public.campaigns set status = 'paused', pause_reason = 'manual', next_followup_at = null where id = p_id;
    when 'resume', 'reactivate', 'reopen' then
      if c.initial_sent_at is null then raise exception 'Le devis n''a pas encore été envoyé.' using errcode = 'P0001'; end if;
      if c.status = 'active' and c.next_followup_at is not null then
        raise exception 'Les relances sont déjà actives.' using errcode = 'P0001';
      end if;
      delete from public.campaign_sends where campaign_id = p_id and status = 'failed';
      update public.campaigns
         set status = 'active', pause_reason = null, followup_enabled = true,
             won_at = null, lost_at = null, lost_reason = null, decided_by = null,
             stopped_at = null, completed_at = null,
             -- relances épuisées : on en autorise une de plus
             max_followups = case when followups_sent >= max_followups then least(followups_sent + 1, 20) else max_followups end,
             -- date de fin dépassée : on la retire
             end_date = case when end_date is not null and end_date < public.today_paris() then null else end_date end,
             max_days = case when max_days is not null and initial_sent_at + make_interval(days => max_days) < now() then null else max_days end
       where id = p_id;
      perform public.campaign_reschedule(p_id);
    when 'retry_initial' then
      if c.status <> 'draft' or c.initial_send_status <> 'failed' then
        raise exception 'Aucun envoi en échec à relancer.' using errcode = 'P0001';
      end if;
      delete from public.campaign_sends where campaign_id = p_id and sequence = 0 and status = 'failed';
      update public.campaigns set initial_send_status = 'pending' where id = p_id;
    when 'stop' then
      if c.status in ('won', 'lost', 'stopped', 'completed') then raise exception 'Campagne déjà clôturée.' using errcode = 'P0001'; end if;
      update public.campaigns set status = 'stopped', stopped_at = now(), next_followup_at = null where id = p_id;
    when 'complete' then
      if c.status in ('won', 'lost', 'completed') then raise exception 'Dossier déjà clôturé.' using errcode = 'P0001'; end if;
      update public.campaigns set status = 'completed', completed_at = now(), next_followup_at = null where id = p_id;
    when 'won' then
      update public.campaigns
         set status = 'won', won_at = now(), lost_at = null, lost_reason = null, decided_by = 'artisan', next_followup_at = null
       where id = p_id;
    when 'lost' then
      update public.campaigns
         set status = 'lost', lost_at = now(), won_at = null, lost_reason = v_reason, decided_by = 'artisan', next_followup_at = null
       where id = p_id;
    when 'replied' then
      if c.status in ('won', 'lost') then raise exception 'Dossier déjà clôturé.' using errcode = 'P0001'; end if;
      update public.campaigns
         set status = 'replied', replied_at = coalesce(replied_at, now()), next_followup_at = null
       where id = p_id;
    else
      raise exception 'Action inconnue.' using errcode = 'P0001';
  end case;

  insert into public.campaign_events (campaign_id, user_id, type, detail)
  values (p_id, c.user_id, p_action, jsonb_strip_nulls(jsonb_build_object('from_status', c.status, 'reason', v_reason)));

  select status into v_status from public.campaigns where id = p_id;
  return v_status;
end;
$$;

-- 7. Droits ----------------------------------------------------------------
revoke execute on function public.campaign_status_log()                    from public, anon, authenticated;
revoke execute on function public.close_finished_campaigns()               from public, anon, authenticated;
revoke execute on function public.notify_decision(uuid)                    from public, anon, authenticated;
revoke execute on function public.register_reply(text, text, text, text)   from public, anon, authenticated;
revoke execute on function public.campaign_action(uuid, text, text)        from public, anon;
revoke execute on function public.set_status_source(text, text)            from public, anon, authenticated;
grant execute on function public.register_reply(text, text, text, text) to service_role;
grant execute on function public.close_finished_campaigns() to service_role;
grant execute on function public.campaign_action(uuid, text, text) to authenticated;
grant execute on function public.set_status_source(text, text) to service_role;
grant execute on function public.client_quote(text) to anon, authenticated;
grant execute on function public.client_decision(text, text, text) to anon, authenticated;

-- 8. Recalcul des campagnes en cours (nouvelle règle de clôture) ------------
do $$
declare r record;
begin
  for r in select id from public.campaigns where status = 'active' loop
    perform public.campaign_reschedule(r.id);
  end loop;
end $$;

-- 9. Clôture automatique toutes les 15 min ---------------------------------
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'artisan-relance-close';
    perform cron.schedule('artisan-relance-close', '*/15 * * * *', 'select public.close_finished_campaigns()');
  end if;
end $$;
