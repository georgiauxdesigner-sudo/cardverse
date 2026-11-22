-- CARDVERSE: run once in Supabase > SQL Editor > New query > Run.
-- Creates the two tables behind the rankings. Room codes and live games use Realtime
-- broadcast, which needs no tables. Points are virtual and never involve money.

create table if not exists public.cv_players (
  player_id  text primary key check (char_length(player_id) between 8 and 64),
  name       text not null check (name ~ '^[A-Za-z0-9_]{3,16}$'),
  avatar     smallint not null default 0 check (avatar between 0 and 7),
  photo      text check (photo is null or (char_length(photo) < 24000 and photo like 'data:image/%')),
  city       text check (city is null or char_length(city) <= 40),
  country    text check (country is null or char_length(country) <= 40),
  updated_at timestamptz not null default now()
);

create table if not exists public.cv_results (
  id         bigint generated always as identity primary key,
  player_id  text not null check (char_length(player_id) between 8 and 64),
  name       text not null check (name ~ '^[A-Za-z0-9_]{3,16}$'),
  avatar     smallint not null default 0,
  game       text not null check (game in ('inbetween','tongits','pusoydos','bingo','solitaire')),
  won        boolean not null,
  online     boolean not null default false,
  played_at  timestamptz not null default now()
);
create index if not exists cv_results_played_at on public.cv_results (played_at desc);
create index if not exists cv_results_player on public.cv_results (player_id);

alter table public.cv_players enable row level security;
alter table public.cv_results enable row level security;

drop policy if exists "read players" on public.cv_players;
drop policy if exists "add players" on public.cv_players;
drop policy if exists "update players" on public.cv_players;
drop policy if exists "read results" on public.cv_results;
drop policy if exists "add results" on public.cv_results;

create policy "read players"   on public.cv_players for select using (true);
create policy "add players"    on public.cv_players for insert with check (true);
create policy "update players" on public.cv_players for update using (true) with check (true);
create policy "read results"   on public.cv_results for select using (true);
-- results can only be added "now" (no back-dating) and never edited or deleted from the app
create policy "add results"    on public.cv_results for insert
  with check (played_at between now() - interval '2 minutes' and now() + interval '2 minutes');

-- the website uses the public (anon) key: allow exactly what the app needs
grant select, insert, update on public.cv_players to anon, authenticated;
grant select, insert on public.cv_results to anon, authenticated;
