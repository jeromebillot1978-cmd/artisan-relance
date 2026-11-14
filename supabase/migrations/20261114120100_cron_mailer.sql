-- =====================================================================
-- Cron Supabase : appelle l'Edge Function campaign-mailer toutes les 15 min.
-- Prérequis (une seule fois, via SQL Editor, PAS dans une migration
-- versionnée car ce sont des secrets) :
--   select vault.create_secret('https://<ref>.supabase.co/functions/v1/campaign-mailer', 'mailer_url');
--   select vault.create_secret('<valeur de CRON_SECRET>', 'mailer_secret');
-- =====================================================================
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid) from cron.job where jobname = 'artisan-relance-mailer';

select cron.schedule(
  'artisan-relance-mailer',
  '*/15 * * * *',
  $job$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'mailer_url'),
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'mailer_secret')
               ),
    body    := '{"mode":"due"}'::jsonb,
    timeout_milliseconds := 120000
  );
  $job$
);

-- Maintenance quotidienne (3 h 30, heure de Paris en hiver) : purge des pièces
-- jointes au-delà de la durée de conservation et des fichiers orphelins.
select cron.unschedule(jobid) from cron.job where jobname = 'artisan-relance-maintenance';

select cron.schedule(
  'artisan-relance-maintenance',
  '30 2 * * *',
  $job$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'mailer_url'),
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'mailer_secret')
               ),
    body    := '{"mode":"maintenance"}'::jsonb,
    timeout_milliseconds := 120000
  );
  $job$
);
