/*
# FreshSaver: Hardening — Indexes, CHECK constraints, and auto-profile trigger

## What this migration does

1. **Indexes** — adds missing indexes on foreign keys and frequently
   filtered/sorted columns to speed up household-scoped queries.
2. **CHECK constraints** — enforces valid `unit` values and positive
   quantities at the database level (defence in depth beyond Zod).
3. **Auto-profile trigger** — creates a minimal `profiles` row automatically
   when a new `auth.users` row is inserted, preventing orphaned auth users.
   The client then upserts the chosen username/full_name.

## Notes
- All statements are idempotent (CREATE INDEX IF NOT EXISTS, ALTER TABLE ...
  ADD CONSTRAINT ... IF NOT EXISTS is not supported in Postgres < 12 for
  constraints, so we check information_schema first).
- The trigger function uses `SECURITY DEFINER` so it can write to `public.profiles`
  even though the `auth` user may not have direct grants.
*/

-- ============================================================
-- 1. Missing indexes on foreign keys & hot columns
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_food_items_added_by ON food_items(added_by);
CREATE INDEX IF NOT EXISTS idx_food_items_category_id ON food_items(category_id);
CREATE INDEX IF NOT EXISTS idx_food_items_household_status ON food_items(household_id, status);
CREATE INDEX IF NOT EXISTS idx_recipes_created_by ON recipes(created_by);
CREATE INDEX IF NOT EXISTS idx_grocery_list_is_purchased ON grocery_list(is_purchased);
CREATE INDEX IF NOT EXISTS idx_grocery_list_created_at ON grocery_list(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ============================================================
-- 2. CHECK constraints for valid units and positive quantities
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'food_items_unit_check'
  ) THEN
    ALTER TABLE food_items
      ADD CONSTRAINT food_items_unit_check
      CHECK (unit IN ('pcs', 'kg', 'liters', 'packs', 'bunches'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'food_items_quantity_check'
  ) THEN
    ALTER TABLE food_items
      ADD CONSTRAINT food_items_quantity_check
      CHECK (quantity > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'grocery_list_unit_check'
  ) THEN
    ALTER TABLE grocery_list
      ADD CONSTRAINT grocery_list_unit_check
      CHECK (unit IN ('pcs', 'kg', 'liters', 'packs', 'bunches'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'grocery_list_quantity_check'
  ) THEN
    ALTER TABLE grocery_list
      ADD CONSTRAINT grocery_list_quantity_check
      CHECK (suggested_quantity > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'recipes_prep_time_check'
  ) THEN
    ALTER TABLE recipes
      ADD CONSTRAINT recipes_prep_time_check
      CHECK (prep_time_mins IS NULL OR prep_time_mins > 0);
  END IF;
END $$;

-- ============================================================
-- 3. Auto-create profile on user signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
  final_username text;
  suffix int := 0;
BEGIN
  -- Derive a default username from the email's local part.
  base_username := lower(split_part(COALESCE(NEW.email, 'user'), '@', 1));
  -- Strip non-alphanumeric characters.
  base_username := regexp_replace(base_username, '[^a-z0-9]', '', 'g');
  IF base_username = '' OR length(base_username) < 2 THEN
    base_username := 'user';
  END IF;

  final_username := base_username;

  -- Ensure uniqueness by appending a numeric suffix if needed.
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix;
  END LOOP;

  INSERT INTO public.profiles (id, username, full_name, household_id)
  VALUES (NEW.id, final_username, NULL, NULL)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
