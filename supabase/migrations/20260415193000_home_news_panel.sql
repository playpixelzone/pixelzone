-- Home News Panel (read for all, write only site admin)

create table if not exists public.site_home_news (
  id bigint primary key check (id = 1),
  kind text not null default 'news' check (kind in ('news', 'poll')),
  title text not null default 'Willkommen bei PIXELZONE',
  body text not null default 'Hier erscheinen kuenftige Updates, Aenderungen und Abstimmungen.',
  poll_question text,
  poll_options jsonb not null default '[]'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.site_home_news enable row level security;

drop policy if exists site_home_news_select_all on public.site_home_news;
create policy site_home_news_select_all
on public.site_home_news
for select
to anon, authenticated
using (true);

drop policy if exists site_home_news_admin_write on public.site_home_news;
create policy site_home_news_admin_write
on public.site_home_news
for all
to authenticated
using (auth.uid() = '1dcb3181-9132-4cd0-b3ef-550742a5309d'::uuid)
with check (auth.uid() = '1dcb3181-9132-4cd0-b3ef-550742a5309d'::uuid);

insert into public.site_home_news (id, kind, title, body, poll_question, poll_options, updated_by)
values (
  1,
  'news',
  'News-Zentrale aktiviert',
  'Hier kannst du kuenftige Updates, Aenderungen und Abstimmungen fuer alle Spieler ankundigen.',
  null,
  '[]'::jsonb,
  '1dcb3181-9132-4cd0-b3ef-550742a5309d'::uuid
)
on conflict (id) do nothing;
