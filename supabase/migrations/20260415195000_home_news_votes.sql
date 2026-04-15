-- Poll votes for homepage news/polls

create table if not exists public.site_home_news_votes (
  news_id bigint not null references public.site_home_news(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  option_index integer not null check (option_index >= 0 and option_index <= 50),
  updated_at timestamptz not null default now(),
  primary key (news_id, user_id)
);

alter table public.site_home_news_votes enable row level security;

drop policy if exists site_home_news_votes_select_all on public.site_home_news_votes;
create policy site_home_news_votes_select_all
on public.site_home_news_votes
for select
to anon, authenticated
using (true);

drop policy if exists site_home_news_votes_insert_own on public.site_home_news_votes;
create policy site_home_news_votes_insert_own
on public.site_home_news_votes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists site_home_news_votes_update_own on public.site_home_news_votes;
create policy site_home_news_votes_update_own
on public.site_home_news_votes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists site_home_news_votes_delete_admin on public.site_home_news_votes;
create policy site_home_news_votes_delete_admin
on public.site_home_news_votes
for delete
to authenticated
using (auth.uid() = '1dcb3181-9132-4cd0-b3ef-550742a5309d'::uuid);
