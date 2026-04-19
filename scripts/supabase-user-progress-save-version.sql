-- Spielstand-Version (Migration / Balancing, z. B. Welten-Essenz-Reset v5)
-- In Supabase SQL Editor ausführen, falls die Spalte noch fehlt.

alter table public.user_progress
  add column if not exists save_version int not null default 1;
