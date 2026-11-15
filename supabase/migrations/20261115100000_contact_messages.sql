-- Messages de la page contact (et demandes de démonstration).
-- Écriture uniquement par le serveur (clé service) : aucune politique RLS publique.
create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null default 'question' check (kind in ('question', 'demo')),
  name        text not null check (char_length(name) between 2 and 120),
  email       text not null check (char_length(email) between 5 and 200),
  phone       text check (char_length(phone) <= 30),
  trade       text check (char_length(trade) <= 80),
  message     text not null check (char_length(message) between 5 and 4000),
  notified    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists contact_messages_email_idx on public.contact_messages (email, created_at desc);
alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;
