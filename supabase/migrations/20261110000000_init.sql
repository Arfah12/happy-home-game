-- Happy Home – initial schema
-- Run with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
-- Every player table has Row Level Security: a signed-in user can only
-- read and write their own rows. The furniture catalog is read-only.

-- ─────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique check (username is null or char_length(username) between 2 and 32),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Create a profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- player_progress
-- (game_state holds the full client snapshot: placements, settings, day, …)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.player_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  level integer not null default 1 check (level between 1 and 10),
  xp integer not null default 0 check (xp >= 0),
  coins integer not null default 250 check (coins >= 0),
  unlocked_rooms text[] not null default array['kitchen', 'living', 'bathroom'],
  game_state jsonb,
  updated_at timestamptz not null default now()
);

alter table public.player_progress enable row level security;

create policy "progress: read own" on public.player_progress
  for select using (auth.uid() = user_id);
create policy "progress: insert own" on public.player_progress
  for insert with check (auth.uid() = user_id);
create policy "progress: update own" on public.player_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "progress: delete own" on public.player_progress
  for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- task_completions
-- cycle_day + the unique constraint stop the same reward being claimed twice
-- in one in-game day, even if a client misbehaves.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.task_completions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id text not null,
  cycle_day integer not null default 1 check (cycle_day >= 1),
  completed_at timestamptz not null default now(),
  reward_claimed boolean not null default true,
  constraint task_completions_once_per_day unique (user_id, task_id, cycle_day)
);

create index if not exists task_completions_user_idx on public.task_completions (user_id, completed_at desc);

alter table public.task_completions enable row level security;

create policy "tasks: read own" on public.task_completions
  for select using (auth.uid() = user_id);
create policy "tasks: insert own" on public.task_completions
  for insert with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- furniture_catalog (public, read-only for clients)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.furniture_catalog (
  id text primary key,
  name text not null,
  price integer not null check (price >= 0),
  required_level integer not null default 1 check (required_level between 1 and 10),
  category text not null
);

alter table public.furniture_catalog enable row level security;

create policy "catalog: anyone can read" on public.furniture_catalog
  for select using (true);
-- No insert/update/delete policies: only the service role (server side) can change prices.

insert into public.furniture_catalog (id, name, price, required_level, category) values
  ('cozy_rug', 'Cozy Round Rug', 60, 1, 'decor'),
  ('potted_fern', 'Potted Fern', 40, 1, 'plants'),
  ('reading_lamp', 'Reading Lamp', 80, 1, 'lighting'),
  ('side_table', 'Peach Side Table', 90, 1, 'tables'),
  ('bean_bag', 'Mint Bean Bag', 110, 1, 'seating'),
  ('pastel_armchair', 'Pastel Armchair', 150, 1, 'seating'),
  ('bookshelf', 'Story Bookshelf', 180, 2, 'decor'),
  ('wall_art', 'Sunset Painting', 120, 2, 'decor'),
  ('nightstand', 'Cloud Nightstand', 100, 3, 'bedroom'),
  ('dresser', 'Lilac Dresser', 200, 3, 'bedroom'),
  ('pastel_sofa', 'Marshmallow Sofa', 300, 4, 'seating'),
  ('coffee_table', 'Oak Coffee Table', 160, 4, 'tables'),
  ('tv_stand', 'Retro TV Stand', 260, 4, 'decor'),
  ('monstera', 'Tall Monstera', 140, 4, 'plants'),
  ('garden_bench', 'Garden Bench', 220, 5, 'garden'),
  ('flower_bed', 'Tulip Bed', 130, 5, 'garden'),
  ('bird_fountain', 'Bird Fountain', 350, 5, 'garden'),
  ('grand_piano', 'Grand Piano', 900, 6, 'premium'),
  ('aquarium', 'Coral Aquarium', 650, 6, 'premium'),
  ('velvet_sofa', 'Velvet Sofa', 700, 6, 'premium'),
  ('dining_set', 'Breakfast Nook', 400, 7, 'tables'),
  ('toy_chest', 'Rainbow Toy Chest', 180, 8, 'kids'),
  ('rocking_horse', 'Rocking Horse', 240, 8, 'kids'),
  ('lounge_chair', 'Sun Lounger', 280, 9, 'seating'),
  ('golden_fountain', 'Golden Fountain', 1500, 10, 'premium'),
  ('crystal_lamp', 'Crystal Lamp', 1000, 10, 'premium')
on conflict (id) do update
  set name = excluded.name,
      price = excluded.price,
      required_level = excluded.required_level,
      category = excluded.category;

-- ─────────────────────────────────────────────────────────────
-- player_inventory
-- ─────────────────────────────────────────────────────────────
create table if not exists public.player_inventory (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null references public.furniture_catalog (id),
  quantity integer not null default 1 check (quantity > 0),
  constraint player_inventory_unique_item unique (user_id, item_id)
);

alter table public.player_inventory enable row level security;

create policy "inventory: read own" on public.player_inventory
  for select using (auth.uid() = user_id);
create policy "inventory: insert own" on public.player_inventory
  for insert with check (auth.uid() = user_id);
create policy "inventory: update own" on public.player_inventory
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "inventory: delete own" on public.player_inventory
  for delete using (auth.uid() = user_id);
