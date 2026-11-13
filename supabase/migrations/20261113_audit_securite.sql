-- =====================================================================
-- ARTISAN RELANCE — Correctifs de l'audit du 13/11/2026
-- À exécuter UNE fois dans Supabase > SQL Editor (ré-exécutable sans risque)
-- =====================================================================

-- 1. search_path figé (alerte Supabase « Function Search Path Mutable »)
alter function public.today_paris() set search_path = public;
alter function public.set_updated_at() set search_path = public;

-- 2. Les fonctions de déclencheur ne doivent pas être appelables via l'API
--    (alertes « SECURITY DEFINER function executable by anon / authenticated »)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_quote_change() from public, anon, authenticated;

-- 3. Anti-abus : 50 devis maximum par compte et par 24 h
--    Empêche un compte malveillant d'utiliser votre domaine d'envoi pour du spam.
create or replace function public.enforce_quote_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent integer;
begin
  select count(*) into recent
    from public.quotes
   where user_id = new.user_id
     and created_at > now() - interval '24 hours';

  if recent >= 50 then
    raise exception 'Limite de 50 nouveaux devis par 24 h atteinte. Réessayez demain.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_quote_quota() from public, anon, authenticated;

drop trigger if exists quotes_quota on public.quotes;
create trigger quotes_quota
  before insert on public.quotes
  for each row execute function public.enforce_quote_quota();

create index if not exists quotes_user_created_idx on public.quotes (user_id, created_at desc);

-- 4. Index sur la clé étrangère email_type (conseil de performance Supabase)
create index if not exists scheduled_emails_email_type_idx on public.scheduled_emails (email_type);
