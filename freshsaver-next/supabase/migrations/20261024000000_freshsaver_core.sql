-- FreshSaver core schema for the Next.js app.
-- Safe to run on a fresh Supabase project. The Vite app in ../freshsaver/freshsaver
-- has its own historical migrations; this file is the clean, consolidated schema
-- for the Next.js application.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  family_members_count integer not null default 1 check (family_members_count between 1 and 50),
  join_code text not null unique default upper(substr(md5(random()::text), 1, 6)),
  dietary_preferences text[] not null default '{}',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  full_name text,
  household_id uuid references public.households(id) on delete set null,
  money_saved numeric(12, 2) not null default 0 check (money_saved >= 0),
  waste_streak integer not null default 0 check (waste_streak >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  default_expiry_days integer not null default 7 check (default_expiry_days between 1 and 3650),
  icon text not null default '🍽️',
  created_at timestamptz not null default now()
);

create table if not exists public.food_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete set null,
  added_by uuid references auth.users(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null check (char_length(trim(name)) between 1 and 120),
  quantity numeric(10, 2) not null default 1 check (quantity >= 0),
  original_quantity numeric(10, 2),
  unit text not null default 'pcs'
    check (unit in ('pcs', 'pieces', 'kg', 'liters', 'packs', 'bunches')),
  status text not null default 'active'
    check (status in ('active', 'fresh', 'expiring', 'expired', 'consumed', 'wasted')),
  storage_location text not null default 'pantry'
    check (storage_location in ('fridge', 'pantry', 'freezer')),
  barcode text,
  estimated_cost numeric(12, 2) check (estimated_cost is null or estimated_cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create table if not exists public.grocery_list (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  item_name text not null check (char_length(trim(item_name)) between 1 and 120),
  suggested_quantity numeric(10, 2) not null default 1 check (suggested_quantity > 0),
  unit text not null default 'pcs'
    check (unit in ('pcs', 'pieces', 'kg', 'liters', 'packs', 'bunches')),
  is_purchased boolean not null default false,
  auto_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_profiles_household_id on public.profiles(household_id);
create index if not exists idx_food_items_household_id on public.food_items(household_id);
create index if not exists idx_food_items_expires_at on public.food_items(expires_at);
create index if not exists idx_food_items_added_by on public.food_items(added_by);
create index if not exists idx_grocery_list_household_id on public.grocery_list(household_id);
create index if not exists idx_grocery_list_purchased on public.grocery_list(household_id, is_purchased);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from public.profiles where id = auth.uid()
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_households_updated_at on public.households;
create trigger set_households_updated_at
  before update on public.households
  for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_food_items_updated_at on public.food_items;
create trigger set_food_items_updated_at
  before update on public.food_items
  for each row execute function public.set_updated_at();

drop trigger if exists set_grocery_list_updated_at on public.grocery_list;
create trigger set_grocery_list_updated_at
  before update on public.grocery_list
  for each row execute function public.set_updated_at();

-- Create a profile whenever a Supabase Auth user signs up. The onboarding
-- wizard creates the household and links it to this profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
begin
  base_username := lower(
    regexp_replace(
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'user'), '@', 1)),
      '[^a-z0-9_]+',
      '_',
      'g'
    )
  );

  if base_username is null or char_length(base_username) < 3 then
    base_username := 'user';
  end if;

  final_username := left(base_username, 20) || '_' || substr(replace(new.id::text, '-', ''), 1, 6);

  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    final_username,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.food_items enable row level security;
alter table public.grocery_list enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Households are viewable by members" on public.households;
create policy "Households are viewable by members"
  on public.households for select
  to authenticated
  using (id = public.current_household_id());

drop policy if exists "Authenticated users can create households" on public.households;
create policy "Authenticated users can create households"
  on public.households for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "Households are updatable by members" on public.households;
create policy "Households are updatable by members"
  on public.households for update
  to authenticated
  using (id = public.current_household_id())
  with check (id = public.current_household_id());

drop policy if exists "Categories are readable by authenticated users" on public.categories;
create policy "Categories are readable by authenticated users"
  on public.categories for select
  to authenticated
  using (true);

drop policy if exists "Food items are viewable by household" on public.food_items;
create policy "Food items are viewable by household"
  on public.food_items for select
  to authenticated
  using (
    household_id = public.current_household_id()
    or (household_id is null and added_by = auth.uid())
  );

drop policy if exists "Food items are insertable by household" on public.food_items;
create policy "Food items are insertable by household"
  on public.food_items for insert
  to authenticated
  with check (
    household_id = public.current_household_id()
    or (household_id is null and added_by = auth.uid())
  );

drop policy if exists "Food items are updatable by household" on public.food_items;
create policy "Food items are updatable by household"
  on public.food_items for update
  to authenticated
  using (
    household_id = public.current_household_id()
    or (household_id is null and added_by = auth.uid())
  )
  with check (
    household_id = public.current_household_id()
    or (household_id is null and added_by = auth.uid())
  );

drop policy if exists "Food items are deletable by household" on public.food_items;
create policy "Food items are deletable by household"
  on public.food_items for delete
  to authenticated
  using (
    household_id = public.current_household_id()
    or (household_id is null and added_by = auth.uid())
  );

drop policy if exists "Grocery items are viewable by household" on public.grocery_list;
create policy "Grocery items are viewable by household"
  on public.grocery_list for select
  to authenticated
  using (household_id = public.current_household_id());

drop policy if exists "Grocery items are insertable by household" on public.grocery_list;
create policy "Grocery items are insertable by household"
  on public.grocery_list for insert
  to authenticated
  with check (household_id = public.current_household_id());

drop policy if exists "Grocery items are updatable by household" on public.grocery_list;
create policy "Grocery items are updatable by household"
  on public.grocery_list for update
  to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

drop policy if exists "Grocery items are deletable by household" on public.grocery_list;
create policy "Grocery items are deletable by household"
  on public.grocery_list for delete
  to authenticated
  using (household_id = public.current_household_id());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select on public.categories to authenticated;
grant select, insert, update, delete on public.food_items to authenticated;
grant select, insert, update, delete on public.grocery_list to authenticated;
grant select, insert, update on public.households to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant execute on function public.current_household_id() to authenticated;

-- ---------------------------------------------------------------------------
-- Seed categories (IDs match the demo data in lib/demo-data.ts)
-- ---------------------------------------------------------------------------

insert into public.categories (id, name, default_expiry_days, icon)
values
  ('11111111-1111-4111-8111-111111111101', 'Produce', 7, '🥬'),
  ('11111111-1111-4111-8111-111111111102', 'Dairy & Eggs', 14, '🥛'),
  ('11111111-1111-4111-8111-111111111103', 'Bakery & Bread', 5, '🥖'),
  ('11111111-1111-4111-8111-111111111104', 'Pantry & Grains', 180, '🫙'),
  ('11111111-1111-4111-8111-111111111105', 'Meat & Seafood', 3, '🍗'),
  ('11111111-1111-4111-8111-111111111106', 'Frozen', 180, '🧊'),
  ('11111111-1111-4111-8111-111111111107', 'Herbs & Spices', 365, '🌿'),
  ('11111111-1111-4111-8111-111111111108', 'Beverages', 14, '🥤'),
  ('11111111-1111-4111-8111-111111111109', 'Other', 7, '🍽️')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'food_items'
  ) then
    alter publication supabase_realtime add table public.food_items;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'grocery_list'
  ) then
    alter publication supabase_realtime add table public.grocery_list;
  end if;
end;
$$;
