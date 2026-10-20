/*
# Add user_id to food_items and convert to owner-scoped RLS

## Overview
Converts the food_items table from single-tenant (anon-accessible) to multi-user
(owner-scoped). Each registered user now sees and manages only their own food items.

## Changes to food_items
- Added `user_id` column (uuid, nullable, defaults to auth.uid()) with a foreign key
  to auth.users(id) with ON DELETE CASCADE.
  - The column is nullable because existing demo rows have no owner. Those rows
    will be invisible under the new owner-scoped RLS policies (null != auth.uid()).
  - All new rows inserted by authenticated users get user_id from DEFAULT auth.uid().
  - If a user account is deleted, all their food items are automatically removed.

## Security Changes
- Old anon-accessible policies are DROPPED and replaced with owner-scoped policies:
  - SELECT/INSERT/UPDATE/DELETE: authenticated users can only access rows they own.
- The anon role no longer has any access to food_items.

## Important Notes
1. DEFAULT auth.uid() means frontend inserts omitting user_id still succeed.
2. An index on user_id for efficient per-user queries.
3. Idempotent: safe to re-run.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_items' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE food_items ADD COLUMN user_id uuid DEFAULT auth.uid()
      REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_food_items_user_id ON food_items(user_id);

-- Drop old anon-accessible policies
DROP POLICY IF EXISTS "anon_select_food_items" ON food_items;
DROP POLICY IF EXISTS "anon_insert_food_items" ON food_items;
DROP POLICY IF EXISTS "anon_update_food_items" ON food_items;
DROP POLICY IF EXISTS "anon_delete_food_items" ON food_items;

-- New owner-scoped policies (authenticated only)
DROP POLICY IF EXISTS "select_own_food_items" ON food_items;
CREATE POLICY "select_own_food_items"
ON food_items FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_food_items" ON food_items;
CREATE POLICY "insert_own_food_items"
ON food_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_food_items" ON food_items;
CREATE POLICY "update_own_food_items"
ON food_items FOR UPDATE
TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_food_items" ON food_items;
CREATE POLICY "delete_own_food_items"
ON food_items FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
