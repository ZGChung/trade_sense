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

-- Anonymous visitor identity registry for cross-session analytics.
create table if not exists anonymous_users (
  id bigint generated by default as identity primary key,
  device_id text not null unique,
  created_at timestamptz not null default now()
);

-- Per-question practice telemetry (for difficulty calibration and behavior analysis).
create table if not exists practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_user_id bigint references anonymous_users(id) on delete set null,
  player_id text not null,
  display_name text not null,
  mode text not null check (mode in ('casual', 'challenge', 'daily')),
  event_group_id uuid references event_groups(id) on delete set null,
  user_prediction text not null,
  correct_answer text not null,
  is_correct boolean not null,
  response_time_ms int not null check (response_time_ms >= 0),
  challenge_run_id text,
  daily_date date,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_practice_attempts_mode_time
  on practice_attempts(mode, occurred_at desc);
create index if not exists idx_practice_attempts_event_group
  on practice_attempts(event_group_id, occurred_at desc);

-- Pre-aggregated submissions for leaderboard ranking.
create table if not exists leaderboard_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_user_id bigint references anonymous_users(id) on delete set null,
  player_id text not null,
  display_name text not null,
  mode text not null check (mode in ('challenge', 'daily')),
  score int not null check (score >= 0),
  total_questions int not null default 0 check (total_questions >= 0),
  correct_answers int not null default 0 check (correct_answers >= 0),
  total_time_ms int not null default 0 check (total_time_ms >= 0),
  hearts_left int check (hearts_left between 0 and 3),
  run_status text check (run_status in ('completed', 'failed', 'quit')),
  score_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- Backward compatible upgrades for existing projects.
alter table if exists leaderboard_scores
  add column if not exists total_questions int not null default 0;
alter table if exists leaderboard_scores
  add column if not exists correct_answers int not null default 0;
alter table if exists leaderboard_scores
  add column if not exists total_time_ms int not null default 0;
alter table if exists leaderboard_scores
  add column if not exists hearts_left int;
alter table if exists leaderboard_scores
  add column if not exists run_status text;
alter table if exists leaderboard_scores
  drop constraint if exists leaderboard_scores_hearts_left_check;
alter table if exists leaderboard_scores
  add constraint leaderboard_scores_hearts_left_check
  check (hearts_left is null or hearts_left between 0 and 3);
alter table if exists leaderboard_scores
  drop constraint if exists leaderboard_scores_run_status_check;
alter table if exists leaderboard_scores
  add constraint leaderboard_scores_run_status_check
  check (run_status is null or run_status in ('completed', 'failed', 'quit'));

create index if not exists idx_leaderboard_scores_mode_date_score
  on leaderboard_scores(mode, score_date, score desc, created_at asc);
create index if not exists idx_leaderboard_scores_mode_score
  on leaderboard_scores(mode, score desc, created_at asc);
create index if not exists idx_leaderboard_scores_daily_rank
  on leaderboard_scores(mode, score_date, correct_answers desc, total_questions desc, total_time_ms asc, created_at asc);
create index if not exists idx_leaderboard_scores_challenge_rank
  on leaderboard_scores(mode, score desc, hearts_left desc, total_time_ms asc, created_at asc);

alter table anonymous_users enable row level security;
alter table practice_attempts enable row level security;
alter table leaderboard_scores enable row level security;

-- Anyone can register/update anonymous identity by device id.
drop policy if exists "anonymous_users_public_insert" on anonymous_users;
create policy "anonymous_users_public_insert"
  on anonymous_users for insert
  with check (true);

drop policy if exists "anonymous_users_public_select" on anonymous_users;
create policy "anonymous_users_public_select"
  on anonymous_users for select
  using (true);

-- Telemetry writes are public (auth + anon); reads are server-side only by default.
drop policy if exists "practice_attempts_public_insert" on practice_attempts;
create policy "practice_attempts_public_insert"
  on practice_attempts for insert
  with check (true);

-- Leaderboard is public read/write (write-only score submissions + read ranking).
drop policy if exists "leaderboard_scores_public_insert" on leaderboard_scores;
create policy "leaderboard_scores_public_insert"
  on leaderboard_scores for insert
  with check (true);

drop policy if exists "leaderboard_scores_public_select" on leaderboard_scores;
create policy "leaderboard_scores_public_select"
  on leaderboard_scores for select
  using (true);
