-- Simulation minimale de l'environnement Supabase
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create schema extensions;
create extension pgcrypto with schema extensions;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth, extensions, public to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
insert into auth.users values ('11111111-1111-1111-1111-111111111111', 'jercat.bilman@gmail.com'), ('22222222-2222-2222-2222-222222222222', 'artisan@exemple.fr');
create table public.platform_admins (user_id uuid primary key references auth.users(id));
insert into public.platform_admins values ('11111111-1111-1111-1111-111111111111');
create or replace function public.is_platform_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = (select auth.uid())); $$;
grant execute on function public.is_platform_admin() to authenticated, service_role;
