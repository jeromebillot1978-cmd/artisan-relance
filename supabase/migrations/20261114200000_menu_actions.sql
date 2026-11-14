-- =====================================================================
-- Menu « ⋮ » du tableau des devis : actions de statut et modification
--  * complete         : Terminé, plus aucune relance
--  * stop_followups   : relances désactivées, statut conservé
--  * resume_followups : relances réactivées, prochaine date recalculée
--  * replied / won / lost : possibles depuis n'importe quel statut envoyé
--  * campaign_update_details : modification du devis (client, montant…)
-- Ré-exécutable.
-- =====================================================================
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

  if p_action in ('won', 'lost', 'replied', 'complete', 'stop_followups', 'resume_followups', 'resume', 'reopen')
     and c.initial_sent_at is null then
    raise exception 'Le devis n''a pas encore été envoyé.' using errcode = 'P0001';
  end if;

  case p_action
    when 'pause' then
      if c.status <> 'active' then raise exception 'Seule une campagne en cours peut être suspendue.' using errcode = 'P0001'; end if;
      update public.campaigns set status = 'paused', pause_reason = 'manual', next_followup_at = null where id = p_id;
    when 'resume' then
      if c.status <> 'paused' then raise exception 'Cette campagne n''est pas suspendue.' using errcode = 'P0001'; end if;
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
      if c.status = 'won' then raise exception 'Ce devis est déjà gagné.' using errcode = 'P0001'; end if;
      update public.campaigns set status = 'won', won_at = now(), lost_at = null, next_followup_at = null where id = p_id;
    when 'lost' then
      if c.status = 'lost' then raise exception 'Ce devis est déjà perdu.' using errcode = 'P0001'; end if;
      update public.campaigns set status = 'lost', lost_at = now(), won_at = null, next_followup_at = null where id = p_id;
    when 'replied' then
      if c.status = 'replied' then raise exception 'Ce devis est déjà marqué répondu.' using errcode = 'P0001'; end if;
      update public.campaigns
         set status = 'replied', replied_at = coalesce(replied_at, now()), won_at = null, lost_at = null,
             completed_at = null, stopped_at = null, next_followup_at = null
       where id = p_id;
    when 'complete' then
      if c.status = 'completed' then raise exception 'Ce devis est déjà terminé.' using errcode = 'P0001'; end if;
      update public.campaigns
         set status = 'completed', completed_at = now(), won_at = null, lost_at = null, next_followup_at = null
       where id = p_id;
    when 'stop_followups' then
      if not c.followup_enabled then raise exception 'Les relances sont déjà arrêtées.' using errcode = 'P0001'; end if;
      -- le statut est conservé, seules les relances sont désactivées
      update public.campaigns set followup_enabled = false, next_followup_at = null where id = p_id;
    when 'resume_followups' then
      if c.status = 'active' and c.followup_enabled and c.next_followup_at is not null then
        raise exception 'Les relances sont déjà actives.' using errcode = 'P0001';
      end if;
      delete from public.campaign_sends where campaign_id = p_id and status = 'failed';
      update public.campaigns
         set status = 'active', followup_enabled = true, pause_reason = null,
             won_at = null, lost_at = null, stopped_at = null, completed_at = null,
             -- toutes les relances déjà envoyées : on en autorise une de plus
             max_followups = case when followups_sent >= max_followups then least(followups_sent + 1, 20) else max_followups end,
             -- date ou durée de fin dépassée : on la retire
             end_date = case when end_date is not null and end_date < public.today_paris() then null else end_date end,
             max_days = case when max_days is not null and initial_sent_at + make_interval(days => max_days) < now() then null else max_days end
       where id = p_id;
      perform public.campaign_reschedule(p_id);
    when 'reopen' then
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

-- Modification du devis depuis le menu « Modifier »
create or replace function public.campaign_update_details(
  p_id uuid, p_prospect_name text, p_recipients text[], p_reference text,
  p_amount numeric, p_client_phone text, p_notes text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.campaigns%rowtype;
  v_recipients text[];
begin
  select * into c from public.campaigns where id = p_id and user_id = auth.uid() for update;
  if not found then raise exception 'Devis introuvable.' using errcode = 'P0001'; end if;

  v_recipients := array(
    select e from (
      select lower(trim(x)) as e, min(ord) as first_pos
        from unnest(p_recipients) with ordinality as t(x, ord)
       where trim(x) <> ''
       group by lower(trim(x))
    ) d order by first_pos);
  if cardinality(v_recipients) not between 1 and 5 or exists (
    select 1 from unnest(v_recipients) r where r !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ) then
    raise exception 'Adresse e-mail invalide.' using errcode = 'P0001';
  end if;
  if char_length(trim(coalesce(p_prospect_name, ''))) < 1 then
    raise exception 'Nom du client requis.' using errcode = 'P0001';
  end if;

  update public.campaigns
     set prospect_name = trim(p_prospect_name),
         recipients = v_recipients,
         reference = nullif(trim(coalesce(p_reference, '')), ''),
         amount = coalesce(p_amount, 0),
         client_phone = nullif(trim(coalesce(p_client_phone, '')), ''),
         notes = nullif(trim(coalesce(p_notes, '')), '')
   where id = p_id;

  insert into public.campaign_events (campaign_id, user_id, type, detail)
  values (p_id, c.user_id, 'details_updated', '{}'::jsonb);
end;
$$;

revoke execute on function public.campaign_action(uuid, text) from public, anon;
grant execute on function public.campaign_action(uuid, text) to authenticated;
revoke execute on function public.campaign_update_details(uuid, text, text[], text, numeric, text, text) from public, anon;
grant execute on function public.campaign_update_details(uuid, text, text[], text, numeric, text, text) to authenticated;
