-- TradeSense schema for Supabase
-- Run in SQL editor or migration pipeline.

create extension if not exists pgcrypto;

create table if not exists event_groups (
  id uuid primary key default gen_random_uuid(),
  stock_symbol text not null,
  stock_name text not null,
  category text not null default '其他',
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  event_group_id uuid not null references event_groups(id) on delete cascade,
  description text not null,
  event_date date not null,
  stock_symbol text not null,
  stock_name text not null,
  actual_performance numeric not null,
  days_after_event int not null default 1,
  source_url text,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  ai_provider text default 'gemini',
  created_at timestamptz not null default now()
);

create table if not exists user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_attempts int not null default 0,
  correct_predictions int not null default 0,
  current_streak int not null default 0,
  max_streak int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists user_wrong_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_group_id uuid references event_groups(id) on delete set null,
  user_prediction text not null,
  correct_answer text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_event_groups_symbol on event_groups(stock_symbol);
create index if not exists idx_events_group_id on events(event_group_id);
create index if not exists idx_events_date on events(event_date desc);
create index if not exists idx_user_wrong_answers_user on user_wrong_answers(user_id, created_at desc);

alter table event_groups enable row level security;
alter table events enable row level security;
alter table profiles enable row level security;
alter table user_stats enable row level security;
alter table user_achievements enable row level security;
alter table user_wrong_answers enable row level security;

-- Public read access for question bank.
drop policy if exists "public_read_event_groups" on event_groups;
create policy "public_read_event_groups"
  on event_groups for select
  using (true);

drop policy if exists "public_read_events" on events;
create policy "public_read_events"
  on events for select
  using (true);

-- profiles: only owner can read/write.
drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own"
  on profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- user_stats: only owner can read/write.
drop policy if exists "user_stats_select_own" on user_stats;
create policy "user_stats_select_own"
  on user_stats for select
  using (auth.uid() = user_id);

drop policy if exists "user_stats_insert_own" on user_stats;
create policy "user_stats_insert_own"
  on user_stats for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_stats_update_own" on user_stats;
create policy "user_stats_update_own"
  on user_stats for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_achievements: only owner can read/write.
drop policy if exists "user_achievements_select_own" on user_achievements;
create policy "user_achievements_select_own"
  on user_achievements for select
  using (auth.uid() = user_id);

drop policy if exists "user_achievements_insert_own" on user_achievements;
create policy "user_achievements_insert_own"
  on user_achievements for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_achievements_delete_own" on user_achievements;
create policy "user_achievements_delete_own"
  on user_achievements for delete
  using (auth.uid() = user_id);

-- user_wrong_answers: only owner can read/write.
drop policy if exists "user_wrong_answers_select_own" on user_wrong_answers;
create policy "user_wrong_answers_select_own"
  on user_wrong_answers for select
  using (auth.uid() = user_id);

drop policy if exists "user_wrong_answers_insert_own" on user_wrong_answers;
create policy "user_wrong_answers_insert_own"
  on user_wrong_answers for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_wrong_answers_update_own" on user_wrong_answers;
create policy "user_wrong_answers_update_own"
  on user_wrong_answers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_wrong_answers_delete_own" on user_wrong_answers;
create policy "user_wrong_answers_delete_own"
  on user_wrong_answers for delete
  using (auth.uid() = user_id);
