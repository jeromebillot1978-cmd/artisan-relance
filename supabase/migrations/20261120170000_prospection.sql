-- =====================================================================
-- Prospection (espace administrateur) : artisans à démarcher et messages
-- préparés. AUCUN envoi automatique : rien ici n'est lu par le mailer ni
-- par les tâches planifiées. L'administrateur copie le message et l'envoie
-- lui-même depuis sa boîte e-mail, puis met à jour le statut.
-- Les données (coordonnées des prospects) ne sont jamais dans le dépôt.
-- =====================================================================

create table if not exists public.prospects (
  id          uuid primary key default gen_random_uuid(),
  company     text not null check (char_length(company) between 1 and 160),
  city        text not null check (char_length(city) <= 120),
  trade       text not null check (char_length(trade) <= 120),
  website     text check (char_length(website) <= 300),
  email       text check (char_length(email) <= 200),
  phone       text check (char_length(phone) <= 60),
  channel     text not null default 'email' check (channel in ('email', 'formulaire', 'telephone')),
  why         text not null default '' check (char_length(why) <= 2000),
  findings    text not null default '' check (char_length(findings) <= 2000),
  subject     text check (char_length(subject) <= 200),
  message     text not null default '' check (char_length(message) <= 5000),
  caution     text check (char_length(caution) <= 1000),
  status      text not null default 'a_valider'
              check (status in ('a_valider', 'valide', 'envoye', 'repondu', 'pas_interesse')),
  notes       text not null default '' check (char_length(notes) <= 2000),
  sent_at     timestamptz,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.prospects enable row level security;
revoke all on public.prospects from anon;

drop policy if exists "prospects_admin_all" on public.prospects;
create policy "prospects_admin_all" on public.prospects
  for all to authenticated
  using ((select public.is_platform_admin()))
  with check ((select public.is_platform_admin()));

create or replace function public.prospects_touch()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  if new.status = 'envoye' and old.status is distinct from 'envoye' and new.sent_at is null then
    new.sent_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists prospects_touch on public.prospects;
create trigger prospects_touch before update on public.prospects
  for each row execute function public.prospects_touch();
