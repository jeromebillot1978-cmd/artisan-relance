-- =====================================================================
-- Envoi immédiat du devis déclenché par la base (pg_net + Vault)
-- L'application n'a plus besoin de connaître CRON_SECRET : l'artisan
-- connecté demande l'envoi de SON devis, la base appelle l'Edge Function
-- avec le secret du coffre. Appel asynchrone, idempotent (réservation SQL).
-- =====================================================================
create or replace function public.request_initial_send(p_campaign_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url    text;
  v_secret text;
begin
  if not exists (
    select 1 from public.campaigns
     where id = p_campaign_id and user_id = auth.uid()
       and status = 'draft' and send_initial
       and initial_send_status in ('pending', 'failed')
  ) then
    return null;
  end if;

  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'mailer_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'mailer_secret';
  if v_url is null or v_secret is null then
    return null; -- le cron prendra le relais
  end if;

  return net.http_post(
    url     := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret),
    body    := jsonb_build_object('mode', 'initial', 'campaign_id', p_campaign_id),
    timeout_milliseconds := 60000
  );
end;
$$;

revoke execute on function public.request_initial_send(uuid) from public, anon;
grant execute on function public.request_initial_send(uuid) to authenticated;
