/*
# FreshSaver Full Schema Rebuild

## Overview
Complete rebuild of the FreshSaver database schema to support households/families,
user profiles, food categories, inventory with quantity tracking, recipes, and
an automated grocery shopping list. The old single-user food_items table is replaced.

## Important Notes
1. The old food_items table (single-user, demo data only) is DROPPED. It contained
   only 4 demo rows seeded during development — no real user data existed.
2. All new tables use household-based access control via the profiles table.
3. RLS policies check household membership through profiles.

## New Tables

### 1. households
- id (uuid, PK, gen_random_uuid)
- name (text, NOT NULL) — household/family name
- family_members_count (int, NOT NULL, DEFAULT 1)
- join_code (text, UNIQUE, NOT NULL) — quick join code for family members
- created_at (timestamptz, NOT NULL, DEFAULT now())

### 2. profiles
- id (uuid, PK, REFERENCES auth.users(id) ON DELETE CASCADE)
- username (text, UNIQUE, NOT NULL)
- full_name (text)
- household_id (uuid, REFERENCES households(id) ON DELETE SET NULL)
- pin_code_hash (text) — quick PIN for rapid sign-in
- created_at (timestamptz, NOT NULL, DEFAULT now())

### 3. categories
- id (uuid, PK, gen_random_uuid)
- name (text, UNIQUE, NOT NULL)
- default_expiry_days (int, NOT NULL)
- icon (text, DEFAULT '🥗')

### 4. food_items
- id (uuid, PK, gen_random_uuid)
- household_id (uuid, NOT NULL, REFERENCES households(id) ON DELETE CASCADE)
- added_by (uuid, REFERENCES profiles(id) ON DELETE SET NULL)
- category_id (uuid, REFERENCES categories(id))
- name (text, NOT NULL)
- quantity (numeric, NOT NULL, DEFAULT 1)
- unit (text, NOT NULL, DEFAULT 'pcs')
- status (text, NOT NULL, DEFAULT 'active', CHECK active/consumed/wasted)
- created_at (timestamptz, NOT NULL, DEFAULT now())
- expires_at (timestamptz, NOT NULL)

### 5. recipes
- id (uuid, PK, gen_random_uuid)
- household_id (uuid, REFERENCES households(id) ON DELETE CASCADE) — NULL for global
- created_by (uuid, REFERENCES profiles(id) ON DELETE SET NULL)
- title (text, NOT NULL)
- description (text)
- ingredients (jsonb, NOT NULL) — array of {item_name, quantity} objects
- instructions (text[], NOT NULL)
- prep_time_mins (int)
- is_custom (boolean, DEFAULT false)
- created_at (timestamptz, NOT NULL, DEFAULT now())

### 6. grocery_list
- id (uuid, PK, gen_random_uuid)
- household_id (uuid, NOT NULL, REFERENCES households(id) ON DELETE CASCADE)
- item_name (text, NOT NULL)
- suggested_quantity (numeric, NOT NULL)
- unit (text, NOT NULL, DEFAULT 'pcs')
- is_purchased (boolean, DEFAULT false)
- auto_generated (boolean, DEFAULT true)
- created_at (timestamptz, NOT NULL, DEFAULT now())

## Security
- RLS enabled on ALL tables.
- households: members can read/update their own household; any authenticated user can insert (creates new household).
- profiles: users can read/update their own profile; household members can read each other's profiles.
- categories: public read for all authenticated users (shared reference data).
- food_items: household members have full CRUD scoped to their household.
- recipes: household members CRUD their household recipes + all users can read global (NULL household_id) recipes.
- grocery_list: household members have full CRUD scoped to their household.

## Seed Data
9 default food categories with expiry defaults and emoji icons.
3 global sample recipes.
*/

-- Step 1: Drop old food_items table and policies
DROP POLICY IF EXISTS "select_own_food_items" ON food_items;
DROP POLICY IF EXISTS "insert_own_food_items" ON food_items;
DROP POLICY IF EXISTS "update_own_food_items" ON food_items;
DROP POLICY IF EXISTS "delete_own_food_items" ON food_items;
DROP TABLE IF EXISTS food_items CASCADE;

-- Step 2: Create households table
CREATE TABLE IF NOT EXISTS households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  family_members_count integer NOT NULL DEFAULT 1,
  join_code text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE households ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_households_join_code ON households(join_code);

-- Step 3: Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  household_id uuid REFERENCES households(id) ON DELETE SET NULL,
  pin_code_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_profiles_household_id ON profiles(household_id);

-- Step 4: Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  default_expiry_days integer NOT NULL,
  icon text DEFAULT '🥗'
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Step 5: Create food_items table
CREATE TABLE IF NOT EXISTS food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  added_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id),
  name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'pcs',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'wasted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_food_items_household_id ON food_items(household_id);
CREATE INDEX IF NOT EXISTS idx_food_items_status ON food_items(status);
CREATE INDEX IF NOT EXISTS idx_food_items_expires_at ON food_items(expires_at);

-- Step 6: Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  ingredients jsonb NOT NULL,
  instructions text[] NOT NULL,
  prep_time_mins integer,
  is_custom boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_recipes_household_id ON recipes(household_id);

-- Step 7: Create grocery_list table
CREATE TABLE IF NOT EXISTS grocery_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  suggested_quantity numeric NOT NULL,
  unit text NOT NULL DEFAULT 'pcs',
  is_purchased boolean DEFAULT false,
  auto_generated boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE grocery_list ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_grocery_list_household_id ON grocery_list(household_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- households: any authenticated user can insert; members can read/update their household
DROP POLICY IF EXISTS "select_own_household" ON households;
CREATE POLICY "select_own_household"
ON households FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.household_id = households.id)
);

DROP POLICY IF EXISTS "insert_household" ON households;
CREATE POLICY "insert_household"
ON households FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "update_own_household" ON households;
CREATE POLICY "update_own_household"
ON households FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.household_id = households.id)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.household_id = households.id)
);

-- profiles: users manage their own; household members can read each other
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
ON profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "select_household_profiles" ON profiles;
CREATE POLICY "select_household_profiles"
ON profiles FOR SELECT TO authenticated
USING (
  household_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.household_id = profiles.household_id
  )
);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
ON profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- categories: all authenticated users can read (shared reference data)
DROP POLICY IF EXISTS "select_categories" ON categories;
CREATE POLICY "select_categories"
ON categories FOR SELECT TO authenticated
USING (true);

-- food_items: household members have full CRUD
DROP POLICY IF EXISTS "select_household_food_items" ON food_items;
CREATE POLICY "select_household_food_items"
ON food_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.household_id = food_items.household_id
  )
);

DROP POLICY IF EXISTS "insert_household_food_items" ON food_items;
CREATE POLICY "insert_household_food_items"
ON food_items FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.household_id = food_items.household_id
  )
);

DROP POLICY IF EXISTS "update_household_food_items" ON food_items;
CREATE POLICY "update_household_food_items"
ON food_items FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.household_id = food_items.household_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.household_id = food_items.household_id
  )
);

DROP POLICY IF EXISTS "delete_household_food_items" ON food_items;
CREATE POLICY "delete_household_food_items"
ON food_items FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.household_id = food_items.household_id
  )
);

-- recipes: household members CRUD + global recipes readable by all
DROP POLICY IF EXISTS "select_recipes" ON recipes;
CREATE POLICY "select_recipes"
ON recipes FOR SELECT TO authenticated
USING (
  household_id IS NULL
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.household_id = recipes.household_id
  )
);

DROP POLICY IF EXISTS "insert_household_recipes" ON recipes;
CREATE POLICY "insert_household_recipes"
ON recipes FOR INSERT TO authenticated
WITH CHECK (
  household_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.household_id = recipes.household_id
  )
);

DROP POLICY IF EXISTS "update_household_recipes" ON recipes;
CREATE POLICY "update_household_recipes"
ON recipes FOR UPDATE TO authenticated
USING (
  household_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.household_id = recipes.household_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.household_id = recipes.household_id
  )
);

DROP POLICY IF EXISTS "delete_household_recipes" ON recipes;
CREATE POLICY "delete_household_recipes"
ON recipes FOR DELETE TO authenticated
USING (
  household_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.household_id = recipes.household_id
  )
);

-- grocery_list: household members have full CRUD
DROP POLICY IF EXISTS "select_household_grocery_list" ON grocery_list;
CREATE POLICY "select_household_grocery_list"
ON grocery_list FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.household_id = grocery_list.household_id
  )
);

DROP POLICY IF EXISTS "insert_household_grocery_list" ON grocery_list;
CREATE POLICY "insert_household_grocery_list"
ON grocery_list FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.household_id = grocery_list.household_id
  )
);

DROP POLICY IF EXISTS "update_household_grocery_list" ON grocery_list;
CREATE POLICY "update_household_grocery_list"
ON grocery_list FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.household_id = grocery_list.household_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.household_id = grocery_list.household_id
  )
);

DROP POLICY IF EXISTS "delete_household_grocery_list" ON grocery_list;
CREATE POLICY "delete_household_grocery_list"
ON grocery_list FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.household_id = grocery_list.household_id
  )
);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO categories (name, default_expiry_days, icon) VALUES
  ('Leafy Greens & Salad', 4, '🥬'),
  ('Fresh Fruits', 7, '🍎'),
  ('Berries', 3, '🍓'),
  ('Dairy & Eggs', 10, '🥛'),
  ('Raw Meat & Seafood', 3, '🥩'),
  ('Root Vegetables', 21, '🥔'),
  ('Bakery & Bread', 5, '🍞'),
  ('Beverages', 14, '🧃'),
  ('Pantry & Canned', 60, '🥫')
ON CONFLICT (name) DO NOTHING;

-- Seed global recipes (household_id = NULL)
INSERT INTO recipes (household_id, title, description, ingredients, instructions, prep_time_mins, is_custom)
SELECT NULL, 'Spinach & Strawberry Salad', 'A fresh, light salad using expiring spinach and strawberries. Toss with olive oil, balsamic, and a sprinkle of feta.',
  '[{"item_name":"Spinach","quantity":"2 cups"},{"item_name":"Strawberries","quantity":"1 cup"},{"item_name":"Feta cheese","quantity":"0.25 cup"}]',
  ARRAY['Wash and dry spinach leaves', 'Slice strawberries', 'Toss spinach, strawberries, and feta in a bowl', 'Drizzle with olive oil and balsamic vinegar', 'Season with salt and pepper to taste'],
  10, false
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE title = 'Spinach & Strawberry Salad');

INSERT INTO recipes (household_id, title, description, ingredients, instructions, prep_time_mins, is_custom)
SELECT NULL, 'Greek Yogurt Parfait', 'Layer your Greek yogurt with granola and honey for a quick, delicious breakfast or snack.',
  '[{"item_name":"Greek Yogurt","quantity":"1 cup"},{"item_name":"Granola","quantity":"0.5 cup"},{"item_name":"Honey","quantity":"1 tbsp"}]',
  ARRAY['Spoon a layer of Greek yogurt into a glass', 'Add a layer of granola', 'Drizzle with honey', 'Repeat layers', 'Serve immediately'],
  5, false
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE title = 'Greek Yogurt Parfait');

INSERT INTO recipes (household_id, title, description, ingredients, instructions, prep_time_mins, is_custom)
SELECT NULL, 'Quick Veggie Stir-Fry', 'Use up expiring vegetables in a fast, flavorful stir-fry served over rice.',
  '[{"item_name":"Mixed Vegetables","quantity":"3 cups"},{"item_name":"Soy Sauce","quantity":"2 tbsp"},{"item_name":"Garlic","quantity":"2 cloves"},{"item_name":"Rice","quantity":"2 cups"}]',
  ARRAY['Cook rice according to package instructions', 'Heat oil in a large pan or wok', 'Mince garlic and saute until fragrant', 'Add chopped vegetables and stir-fry for 5-7 minutes', 'Add soy sauce and toss to coat', 'Serve over cooked rice'],
  20, false
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE title = 'Quick Veggie Stir-Fry');
