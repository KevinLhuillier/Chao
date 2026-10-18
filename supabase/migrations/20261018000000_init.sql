-- =============================================================================
-- Chao — initial schema
--
-- Content (units, lessons, words, activities):
--   public read, written only by the admin (service_role bypasses RLS).
--   Learner-facing texts are jsonb maps per language: {"en": "Hello", "fr": "Bonjour"}.
-- User data (profile, progress, stats, xp events):
--   private, each user only sees and writes their own rows.
-- =============================================================================

-- Keeps `updated_at` current on every UPDATE.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- CONTENT
-- =============================================================================

-- A theme of the course = a stretch of the river.
create table public.units (
  id          uuid primary key default gen_random_uuid(),
  -- Stable identifier (seed / admin), never shown.
  key         text not null unique,
  position    integer not null default 0,
  title       jsonb not null default '{}' check (jsonb_typeof(title) = 'object'),
  description jsonb not null default '{}' check (jsonb_typeof(description) = 'object'),
  color       text not null default 'jade'
    check (color in ('jade', 'lantern', 'lotus', 'gold', 'bamboo', 'sky')),
  icon        text not null default 'hello',
  -- Hidden from the app until published.
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger units_updated_at
  before update on public.units
  for each row execute function public.set_updated_at();

-- A stop on the river: a sequence of activities.
create table public.lessons (
  id         uuid primary key default gen_random_uuid(),
  unit_id    uuid not null references public.units (id) on delete cascade,
  key        text not null unique,
  position   integer not null default 0,
  title      jsonb not null default '{}' check (jsonb_typeof(title) = 'object'),
  published  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lessons_unit_idx on public.lessons (unit_id, position);

create trigger lessons_updated_at
  before update on public.lessons
  for each row execute function public.set_updated_at();

-- Words and useful expressions, Southern Vietnamese.
create table public.words (
  id                uuid primary key default gen_random_uuid(),
  key               text not null unique,
  -- Theme it is listed under in the learner's vocabulary page.
  unit_id           uuid references public.units (id) on delete set null,
  vi                text not null,
  meaning           jsonb not null default '{}' check (jsonb_typeof(meaning) = 'object'),
  -- {"en": ["hi", "hey"]}: other accepted translations.
  alternatives      jsonb not null default '{}' check (jsonb_typeof(alternatives) = 'object'),
  kind              text not null default 'word' check (kind in ('word', 'expression')),
  -- Northern equivalent when the South says it differently (bố ↔ ba).
  north             text,
  note              jsonb not null default '{}' check (jsonb_typeof(note) = 'object'),
  example_vi        text,
  example_meaning   jsonb not null default '{}' check (jsonb_typeof(example_meaning) = 'object'),
  -- Recordings in the public "audio" Storage bucket.
  audio_url         text,
  example_audio_url text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index words_unit_idx on public.words (unit_id);

create trigger words_updated_at
  before update on public.words
  for each row execute function public.set_updated_at();

-- Words taught by a lesson: they join the learner's vocabulary once it is completed.
create table public.lesson_words (
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  word_id   uuid not null references public.words (id) on delete cascade,
  position  integer not null default 0,
  primary key (lesson_id, word_id)
);

create index lesson_words_word_idx on public.lesson_words (word_id);

create table public.activities (
  id         uuid primary key default gen_random_uuid(),
  lesson_id  uuid not null references public.lessons (id) on delete cascade,
  position   integer not null default 0,
  type       text not null check (type in (
    'learn', 'choice_meaning', 'choice_vi', 'listen_choice', 'type_meaning', 'type_vi',
    'listen_type', 'match', 'build_vi', 'build_meaning'
  )),
  -- Payload of the type, see ActivityDataMap in packages/shared.
  data       jsonb not null default '{}' check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index activities_lesson_idx on public.activities (lesson_id, position);

create trigger activities_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

-- =============================================================================
-- USER DATA
-- =============================================================================

create table public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  username   text not null check (username ~ '^[A-Za-z0-9_.]{3,20}$'),
  -- Interface language of the learner (only 'en' for now).
  ui_lang    text not null default 'en' check (ui_lang ~ '^[a-z]{2}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Usernames are unique regardless of case.
create unique index profiles_username_key on public.profiles (lower(username));

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.user_lesson_progress (
  user_id            uuid not null references auth.users (id) on delete cascade,
  lesson_id          uuid not null references public.lessons (id) on delete cascade,
  completed_count    integer not null default 1 check (completed_count >= 0),
  -- Share of first-try correct answers, 0 → 100.
  best_accuracy      integer not null default 0 check (best_accuracy between 0 and 100),
  first_completed_at timestamptz not null default now(),
  last_completed_at  timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.user_stats (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  total_xp         integer not null default 0 check (total_xp >= 0),
  current_streak   integer not null default 0 check (current_streak >= 0),
  best_streak      integer not null default 0 check (best_streak >= 0),
  -- User's *local* calendar day of last activity (streaks follow the user's day).
  last_active_date date,
  daily_goal_xp    integer not null default 30 check (daily_goal_xp > 0),
  updated_at       timestamptz not null default now()
);

create trigger user_stats_updated_at
  before update on public.user_stats
  for each row execute function public.set_updated_at();

create type public.xp_source as enum ('lesson', 'practice');

-- XP history. `local_date` = user's local day, used for the daily goal.
create table public.xp_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  source     public.xp_source not null,
  amount     integer not null check (amount > 0 and amount <= 1000),
  local_date date not null,
  created_at timestamptz not null default now()
);

create index xp_events_user_date_idx on public.xp_events (user_id, local_date);

-- Profile (username from the sign-up form) and stats row for every new account.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, username)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), 'learner_' || substr(new.id::text, 1, 8))
  );
  insert into public.user_stats (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets the sign-up form check a username before creating the account.
create function public.username_available(name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(name));
$$;

grant execute on function public.username_available(text) to anon, authenticated;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table public.units                enable row level security;
alter table public.lessons              enable row level security;
alter table public.words                enable row level security;
alter table public.lesson_words         enable row level security;
alter table public.activities           enable row level security;
alter table public.profiles             enable row level security;
alter table public.user_lesson_progress enable row level security;
alter table public.user_stats           enable row level security;
alter table public.xp_events            enable row level security;

-- Content: read-only, published units/lessons only. No write policy → only service_role writes.
create policy "Published units" on public.units
  for select to anon, authenticated using (published);
create policy "Published lessons" on public.lessons
  for select to anon, authenticated
  using (published and exists (select 1 from public.units u where u.id = unit_id and u.published));
create policy "Content is public" on public.words        for select to anon, authenticated using (true);
create policy "Content is public" on public.lesson_words for select to anon, authenticated using (true);
create policy "Content is public" on public.activities   for select to anon, authenticated using (true);

-- User data: owner only. `(select auth.uid())` is evaluated once per query (faster than per row).
create policy "Read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Own lesson progress" on public.user_lesson_progress
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Read own stats" on public.user_stats
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own stats" on public.user_stats
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own stats" on public.user_stats
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- XP history is append-only for the user.
create policy "Read own xp events" on public.xp_events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own xp events" on public.xp_events
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Explicit grants (RLS still applies on top of them).
grant select on public.units, public.lessons, public.words, public.lesson_words, public.activities
  to anon, authenticated;
grant select, update (username, ui_lang) on public.profiles to authenticated;
grant select, insert, update, delete on public.user_lesson_progress to authenticated;
grant select, insert, update on public.user_stats to authenticated;
grant select, insert on public.xp_events to authenticated;

-- =============================================================================
-- STORAGE
-- =============================================================================

-- Public bucket for the recordings (words, example sentences), uploaded from the
-- admin (service role). Public: the app streams them by URL, no read policy needed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audio', 'audio', true, 10485760, array['audio/mpeg', 'audio/mp4', 'audio/x-m4a'])
on conflict (id) do nothing;
