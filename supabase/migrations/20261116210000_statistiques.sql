-- =====================================================================
-- Statistiques : visites du site (comptage anonyme, sans cookie) et
-- tableau de bord administrateur extensible (devis, relances, avis…).
-- =====================================================================

-- 1. Administrateurs de la plateforme (pas une colonne de profiles :
--    un artisan ne doit jamais pouvoir se donner ce droit lui-même)
create table if not exists public.platform_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;

insert into public.platform_admins (user_id)
select id from auth.users where lower(email) = 'jercat.bilman@gmail.com'
on conflict do nothing;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.platform_admins where user_id = (select auth.uid()));
$$;
revoke execute on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated, service_role;

-- 2. Visites. « visitor » = empreinte anonyme (hachage tronqué, renouvelé
--    chaque mois, calculé côté serveur) : ni IP, ni cookie, ni donnée personnelle.
create table if not exists public.site_visits (
  id            bigint generated always as identity primary key,
  visited_on    date not null default ((now() at time zone 'Europe/Paris')::date),
  visitor       text not null check (char_length(visitor) between 8 and 64),
  path          text not null check (char_length(path) between 1 and 200),
  referrer_host text check (char_length(referrer_host) <= 120),
  created_at    timestamptz not null default now()
);
create index if not exists site_visits_day_idx on public.site_visits (visited_on, visitor);
create index if not exists site_visits_recent_idx on public.site_visits (visitor, path, created_at);
alter table public.site_visits enable row level security;
revoke all on public.site_visits from anon, authenticated;

-- Enregistre une page vue ; une même personne qui recharge la même page
-- dans les 30 minutes n'est comptée qu'une fois.
create or replace function public.record_site_visit(p_visitor text, p_path text, p_referrer_host text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.site_visits
     where visitor = p_visitor and path = p_path and created_at > now() - interval '30 minutes'
  ) then
    return false;
  end if;
  insert into public.site_visits (visitor, path, referrer_host)
  values (left(p_visitor, 64), left(p_path, 200), nullif(left(p_referrer_host, 120), ''));
  return true;
end;
$$;
revoke execute on function public.record_site_visit(text, text, text) from public, anon, authenticated;
grant execute on function public.record_site_visit(text, text, text) to service_role;

-- 3. Tableau de bord (réservé aux administrateurs). Renvoie un seul objet JSON :
--    ajouter une statistique = ajouter une clé, sans toucher au reste.
create or replace function public.admin_site_stats(p_days integer default 90)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  today  date := (now() at time zone 'Europe/Paris')::date;
  days   integer := least(greatest(coalesce(p_days, 90), 7), 365);
  since  timestamptz := now() - interval '30 days';
  result jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'Accès réservé à l''administrateur' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'generated_at', now(),
    'first_day', (select min(visited_on) from public.site_visits),
    'visitors', jsonb_build_object(
      'today', (select count(distinct visitor) from public.site_visits where visited_on = today),
      'week',  (select count(distinct visitor) from public.site_visits where visited_on > today - 7),
      'month', (select count(distinct visitor) from public.site_visits where visited_on > today - 30),
      'total', (select count(*) from (select distinct visitor, date_trunc('month', visited_on) from public.site_visits) t)
    ),
    'views', jsonb_build_object(
      'today', (select count(*) from public.site_visits where visited_on = today),
      'week',  (select count(*) from public.site_visits where visited_on > today - 7),
      'month', (select count(*) from public.site_visits where visited_on > today - 30),
      'total', (select count(*) from public.site_visits)
    ),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day::date, 'visitors', coalesce(v.visitors, 0), 'views', coalesce(v.views, 0)) order by d.day), '[]'::jsonb)
        from generate_series(today - (days - 1), today, interval '1 day') as d(day)
        left join (
          select visited_on, count(distinct visitor) as visitors, count(*) as views
            from public.site_visits where visited_on > today - days group by visited_on
        ) v on v.visited_on = d.day::date
    ),
    'top_pages', (
      select coalesce(jsonb_agg(jsonb_build_object('path', path, 'visitors', visitors, 'views', views)), '[]'::jsonb)
        from (select path, count(distinct visitor) as visitors, count(*) as views
                from public.site_visits where visited_on > today - 30
               group by path order by 2 desc, 3 desc limit 8) p
    ),
    'top_referrers', (
      select coalesce(jsonb_agg(jsonb_build_object('host', referrer_host, 'visitors', visitors)), '[]'::jsonb)
        from (select referrer_host, count(distinct visitor) as visitors
                from public.site_visits where visited_on > today - 30 and referrer_host is not null
               group by referrer_host order by 2 desc limit 6) r
    ),
    'platform', jsonb_build_object(
      'artisans',          jsonb_build_object('total', (select count(*) from public.profiles),
                                              'month', (select count(*) from public.profiles where created_at > since)),
      'quotes',            jsonb_build_object('total', (select count(*) from public.campaigns),
                                              'month', (select count(*) from public.campaigns where created_at > since)),
      'quotes_sent',       jsonb_build_object('total', (select count(*) from public.campaign_sends where kind = 'initial' and status = 'sent'),
                                              'month', (select count(*) from public.campaign_sends where kind = 'initial' and status = 'sent' and sent_at > since)),
      'followups_sent',    jsonb_build_object('total', (select count(*) from public.campaign_sends where kind = 'followup' and status = 'sent'),
                                              'month', (select count(*) from public.campaign_sends where kind = 'followup' and status = 'sent' and sent_at > since)),
      'replies',           jsonb_build_object('total', (select count(*) from public.inbound_replies where campaign_id is not null),
                                              'month', (select count(*) from public.inbound_replies where campaign_id is not null and created_at > since)),
      'quotes_won',        jsonb_build_object('total', (select count(*) from public.campaigns where status = 'won'),
                                              'month', (select count(*) from public.campaigns where won_at > since)),
      'review_requests',   jsonb_build_object('total', (select count(*) from public.review_requests where status = 'sent'),
                                              'month', (select count(*) from public.review_requests where status = 'sent' and sent_at > since)),
      'review_clicks',     jsonb_build_object('total', (select count(*) from public.review_requests where clicks > 0),
                                              'month', (select count(*) from public.review_requests where first_clicked_at > since))
    )
  ) into result;
  return result;
end;
$$;
revoke execute on function public.admin_site_stats(integer) from public, anon;
grant execute on function public.admin_site_stats(integer) to authenticated, service_role;

-- 4. Conservation limitée (13 mois, recommandation CNIL pour la mesure d'audience)
select cron.unschedule('artisan-relance-visits-purge')
 where exists (select 1 from cron.job where jobname = 'artisan-relance-visits-purge');
select cron.schedule('artisan-relance-visits-purge', '45 2 * * *',
  $$delete from public.site_visits where visited_on < (now() at time zone 'Europe/Paris')::date - interval '13 months'$$);
