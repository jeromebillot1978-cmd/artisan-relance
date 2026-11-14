-- =====================================================================
-- RETOUR ARRIÈRE v2 -> v1 (base de données). Durée : < 1 minute.
-- À exécuter dans Supabase > SQL Editor, APRÈS le retour arrière Vercel.
-- Ne supprime aucune donnée : les tables v2 restent en place (inactives).
-- Ré-exécutable sans risque.
-- =====================================================================
begin;

-- 1. Arrêt des tâches planifiées v2
select cron.unschedule(jobid) from cron.job
 where jobname in ('artisan-relance-mailer', 'artisan-relance-maintenance');

-- 2. Statuts décidés pendant la v2 (gagné/perdu) reportés sur les anciens devis
update public.quotes q
   set status = case c.status when 'won' then 'signed' else 'lost' end,
       signed_at = case when c.status = 'won' then coalesce(c.won_at, now()) else q.signed_at end
  from public.campaigns c
 where c.legacy_quote_id = q.id and c.status in ('won', 'lost')
   and q.status <> case c.status when 'won' then 'signed' else 'lost' end;

-- 3. Devis créés pendant la v2 : recréés dans l'ancien système (même id = pas de doublon)
alter table public.quotes disable trigger quotes_quota;
insert into public.quotes (id, user_id, reference, client_name, client_email, client_phone,
                           amount, quote_date, status, notes, signed_at, created_at)
select c.id, c.user_id, c.reference, c.prospect_name, c.recipients[1], c.client_phone,
       c.amount, (c.initial_sent_at at time zone 'Europe/Paris')::date,
       case c.status when 'won' then 'signed' when 'lost' then 'lost' else 'pending' end,
       c.notes, c.won_at, c.created_at
  from public.campaigns c
 where c.legacy_quote_id is null and c.initial_sent_at is not null
on conflict (id) do nothing;
alter table public.quotes enable trigger quotes_quota;

-- 3 bis. Pas de relance v1 pour les dossiers répondus, arrêtés, terminés ou suspendus en v2
update public.scheduled_emails se
   set status = 'cancelled', last_error = 'v2_rollback_closed'
  from public.campaigns c
 where c.id = se.quote_id and se.status = 'pending'
   and c.status in ('replied', 'completed', 'stopped', 'paused');

-- 4. Relances J+4 / J+10 annulées par la migration : restaurées si encore à venir
update public.scheduled_emails se
   set status = 'pending', last_error = null
  from public.quotes q
 where se.quote_id = q.id and q.status = 'pending'
   and se.last_error = 'v2_migration' and se.status = 'cancelled'
   and se.send_date >= public.today_paris()
   -- uniquement si le dossier était encore en cours de relance en v2
   and exists (select 1 from public.campaigns c where c.legacy_quote_id = q.id and c.status = 'active');

-- 5. Contrôle
select
  (select count(*) from public.quotes) as devis_v1,
  (select count(*) from public.campaigns where initial_sent_at is not null) as campagnes_v2_envoyees,
  (select count(*) from public.scheduled_emails where status = 'pending') as relances_v1_en_attente,
  (select count(*) from cron.job where jobname like 'artisan-relance-%') as taches_v2_restantes;

commit;
