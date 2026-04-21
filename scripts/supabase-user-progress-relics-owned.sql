-- Kleine Relikte (Expedition → Klicker-Boni), JSON pro user
alter table public.user_progress
  add column if not exists relics_owned jsonb not null default '{}'::jsonb;
