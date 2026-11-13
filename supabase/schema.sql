-- =====================================================================
-- ARTISAN RELANCE — Schéma Supabase complet
-- À exécuter en une fois dans : Supabase > SQL Editor > New query > Run
-- Le script est ré-exécutable (idempotent).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Utilitaire : date du jour à Paris (toutes les échéances sont en heure FR)
-- ---------------------------------------------------------------------
create or replace function public.today_paris()
returns date
language sql
stable
as $$
  select (now() at time zone 'Europe/Paris')::date;
$$;

-- ---------------------------------------------------------------------
-- PROFILES — 1 ligne par compte (créée automatiquement à l'inscription)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  email          text not null,
  company_name   text not null default '',
  contact_name   text,                    -- signature des e-mails (ex : "Jean, gérant")
  phone          text,                    -- affiché dans la signature
  reply_to_email text,                    -- les réponses des clients arrivent ici (défaut : email)
  plan           text not null default 'free',  -- prévu pour les futurs abonnements
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- QUOTES — les devis
-- ---------------------------------------------------------------------
create table if not exists public.quotes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  reference    text,                      -- n° de devis (optionnel)
  client_name  text not null,
  client_email text not null,
  client_phone text,
  amount       numeric(12, 2) not null default 0 check (amount >= 0),
  quote_date   date not null default public.today_paris(),
  status       text not null default 'pending'
               check (status in ('pending', 'signed', 'lost')),
  notes        text,
  signed_at    timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists quotes_user_id_idx on public.quotes (user_id);
create index if not exists quotes_user_status_idx on public.quotes (user_id, status);

-- ---------------------------------------------------------------------
-- REMINDER_STEPS — règles de relance (J+4, J+10…)
-- Modifier/ajouter une ligne ici suffit pour changer le séquencement.
-- La colonne "channel" prépare l'arrivée des SMS.
-- ---------------------------------------------------------------------
create table if not exists public.reminder_steps (
  email_type  text primary key,
  delay_days  integer not null check (delay_days >= 0),
  channel     text not null default 'email' check (channel in ('email', 'sms')),
  automation  text not null default 'quote_follow_up',
  position    integer not null default 0,
  active      boolean not null default true
);

insert into public.reminder_steps (email_type, delay_days, channel, automation, position)
values
  ('quote_reminder_1', 4,  'email', 'quote_follow_up', 1),
  ('quote_reminder_2', 10, 'email', 'quote_follow_up', 2)
on conflict (email_type) do update
  set delay_days = excluded.delay_days,
      position   = excluded.position;

-- ---------------------------------------------------------------------
-- SCHEDULED_EMAILS — file d'attente des relances
-- ---------------------------------------------------------------------
create table if not exists public.scheduled_emails (
  id          uuid primary key default gen_random_uuid(),
  quote_id    uuid not null references public.quotes (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  send_date   date not null,
  email_type  text not null references public.reminder_steps (email_type),
  status      text not null default 'pending'
              check (status in ('pending', 'processing', 'sent', 'cancelled', 'failed')),
  attempts    integer not null default 0,
  last_error  text,
  provider_id text,                       -- id Resend du message envoyé
  claimed_at  timestamptz,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists scheduled_emails_due_idx
  on public.scheduled_emails (status, send_date);
create index if not exists scheduled_emails_quote_idx
  on public.scheduled_emails (quote_id);
create index if not exists scheduled_emails_user_idx
  on public.scheduled_emails (user_id);

-- ---------------------------------------------------------------------
-- updated_at automatique
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists quotes_updated_at on public.quotes;
create trigger quotes_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Création automatique du profil à l'inscription
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, company_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'company_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Programmation des relances d'un devis
-- Règle : une relance n'est programmée que si sa date n'est pas déjà passée.
--  - devis du jour        -> J+4 et J+10
--  - devis daté d'il y a 6 jours -> seulement J+10
-- Une relance déjà envoyée n'est jamais renvoyée.
-- ---------------------------------------------------------------------
create or replace function public.schedule_quote_reminders(p_quote_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  q    public.quotes%rowtype;
  step public.reminder_steps%rowtype;
  target date;
begin
  select * into q from public.quotes where id = p_quote_id;
  if not found or q.status <> 'pending' then
    return;
  end if;

  -- on repart de zéro pour les relances non encore envoyées
  update public.scheduled_emails
     set status = 'cancelled'
   where quote_id = p_quote_id
     and status in ('pending', 'failed');

  for step in
    select * from public.reminder_steps
     where active and automation = 'quote_follow_up' and channel = 'email'
     order by position
  loop
    target := q.quote_date + step.delay_days;

    if target >= public.today_paris()
       and not exists (
         select 1 from public.scheduled_emails
          where quote_id = p_quote_id
            and email_type = step.email_type
            and status in ('sent', 'processing')
       )
    then
      insert into public.scheduled_emails (quote_id, user_id, send_date, email_type)
      values (q.id, q.user_id, target, step.email_type);
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Déclencheurs sur les devis
--  - création           -> programme J+4 / J+10
--  - signé ou perdu     -> annule les relances restantes
--  - remis "en attente" ou date modifiée -> reprogramme
-- ---------------------------------------------------------------------
create or replace function public.handle_quote_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.schedule_quote_reminders(new.id);
    return new;
  end if;

  if new.status <> 'pending' and old.status = 'pending' then
    update public.scheduled_emails
       set status = 'cancelled'
     where quote_id = new.id
       and status in ('pending', 'failed');
  elsif new.status = 'pending'
        and (old.status <> 'pending' or new.quote_date <> old.quote_date) then
    perform public.schedule_quote_reminders(new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists quotes_after_insert on public.quotes;
create trigger quotes_after_insert
  after insert on public.quotes
  for each row execute function public.handle_quote_change();

drop trigger if exists quotes_after_update on public.quotes;
create trigger quotes_after_update
  after update of status, quote_date on public.quotes
  for each row execute function public.handle_quote_change();

-- ---------------------------------------------------------------------
-- Réservation atomique des e-mails à envoyer (utilisée par le cron)
-- FOR UPDATE SKIP LOCKED : aucun double envoi même si le cron tourne 2 fois.
-- Les lignes bloquées en "processing" depuis > 30 min sont reprises.
-- ---------------------------------------------------------------------
create or replace function public.claim_due_emails(p_limit integer default 50)
returns table (
  id               uuid,
  email_type       text,
  attempts         integer,
  quote_id         uuid,
  reference        text,
  client_name      text,
  client_email     text,
  amount           numeric,
  quote_date       date,
  company_name     text,
  contact_name     text,
  phone            text,
  user_email       text,
  reply_to_email   text
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  return query
  with due as (
    select se.id
      from public.scheduled_emails se
      join public.quotes q on q.id = se.quote_id
     where se.send_date <= public.today_paris()
       and q.status = 'pending'
       and (
             se.status = 'pending'
          or (se.status = 'failed' and se.attempts < 3)
          or (se.status = 'processing' and se.claimed_at < now() - interval '30 minutes')
       )
     order by se.send_date, se.created_at
     limit p_limit
     for update of se skip locked
  ),
  claimed as (
    update public.scheduled_emails se
       set status = 'processing',
           claimed_at = now(),
           attempts = se.attempts + 1
      from due
     where se.id = due.id
    returning se.*
  )
  select c.id, c.email_type, c.attempts, q.id, q.reference, q.client_name,
         q.client_email, q.amount, q.quote_date, p.company_name,
         p.contact_name, p.phone, p.email, p.reply_to_email
    from claimed c
    join public.quotes q   on q.id = c.quote_id
    join public.profiles p on p.id = c.user_id;
end;
$$;

-- Les e-mails de devis déjà signés/perdus restés "pending" sont nettoyés
create or replace function public.cancel_orphan_emails()
returns integer
language sql
security definer
set search_path = public
as $$
  with upd as (
    update public.scheduled_emails se
       set status = 'cancelled'
      from public.quotes q
     where q.id = se.quote_id
       and q.status <> 'pending'
       and se.status in ('pending', 'failed')
    returning 1
  )
  select count(*)::integer from upd;
$$;

-- Ces fonctions ne doivent être appelées que par le serveur (service_role)
revoke all on function public.claim_due_emails(integer) from public, anon, authenticated;
revoke all on function public.cancel_orphan_emails() from public, anon, authenticated;
revoke all on function public.schedule_quote_reminders(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY — chaque artisan ne voit que ses données
-- ---------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.quotes           enable row level security;
alter table public.scheduled_emails enable row level security;
alter table public.reminder_steps   enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "quotes_select_own" on public.quotes;
create policy "quotes_select_own" on public.quotes
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "quotes_insert_own" on public.quotes;
create policy "quotes_insert_own" on public.quotes
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "quotes_update_own" on public.quotes;
create policy "quotes_update_own" on public.quotes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "quotes_delete_own" on public.quotes;
create policy "quotes_delete_own" on public.quotes
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Les relances sont en lecture seule côté utilisateur : seuls les
-- déclencheurs SQL et le cron (service_role) les modifient.
drop policy if exists "scheduled_emails_select_own" on public.scheduled_emails;
create policy "scheduled_emails_select_own" on public.scheduled_emails
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "reminder_steps_read" on public.reminder_steps;
create policy "reminder_steps_read" on public.reminder_steps
  for select to authenticated using (true);

-- Un utilisateur ne peut modifier que ces colonnes de son profil
-- (impossible de changer lui-même son "plan" ou son id)
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (company_name, contact_name, phone, reply_to_email)
  on public.profiles to authenticated;

-- Les relances et les règles ne sont jamais modifiées par le client
revoke insert, update, delete on public.scheduled_emails from anon, authenticated;
revoke insert, update, delete on public.reminder_steps from anon, authenticated;
