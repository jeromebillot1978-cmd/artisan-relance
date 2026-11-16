-- =====================================================================
-- Audit de production du 16 novembre 2026
--  1. Relance de secours (Vercel Cron) : passe par la base, qui détient le
--     secret de l'Edge Function dans le coffre (fin des erreurs 401).
--  2. Défense en profondeur : le rôle anonyme n'a plus aucun droit sur les
--     tables (les règles RLS le bloquaient déjà ; ceci retire aussi le droit
--     d'accès lui-même). Les liens publics des e-mails passent par des
--     fonctions dédiées, inchangées.
-- Ré-exécutable.
-- =====================================================================

create or replace function public.mailer_kick(p_mode text default 'due')
returns bigint
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url    text;
  v_secret text;
begin
  if p_mode not in ('due', 'reviews', 'maintenance') then
    raise exception 'Mode inconnu.' using errcode = 'P0001';
  end if;
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'mailer_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'mailer_secret';
  if v_url is null or v_secret is null then
    return null;
  end if;
  return net.http_post(
    url     := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret),
    body    := jsonb_build_object('mode', p_mode),
    timeout_milliseconds := 120000
  );
end;
$$;

revoke execute on function public.mailer_kick(text) from public, anon, authenticated;
grant execute on function public.mailer_kick(text) to service_role;

-- Rôle anonyme : aucun droit sur les tables du schéma public
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
