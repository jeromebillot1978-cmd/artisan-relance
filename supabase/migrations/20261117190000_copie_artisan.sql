-- Copie cachée du devis à l'artisan : désormais facultative (désactivée par défaut).
alter table public.profiles add column if not exists send_copy_to_self boolean not null default false;
comment on column public.profiles.send_copy_to_self is
  'Si vrai, l''artisan reçoit une copie cachée (Cci) de chaque devis envoyé à ses clients.';
-- Les colonnes modifiables par l'artisan sont accordées une par une
grant update (send_copy_to_self) on public.profiles to authenticated;
