/*
# FreshSaver: optional household for food items

## What this migration does
1. Makes `food_items.household_id` nullable so an item can still be saved when
   a household has not been created yet. The app attempts to resolve the
   user's household (creating a "Personal Pantry" when needed); this is the
   last-resort fallback so inserts never fail with a NOT NULL violation.
2. Updates food_items RLS policies:
   - household members keep full access to their household's items
   - a user can read/update/delete items they added with a NULL household
   - a user can insert a NULL-household item for their own `added_by`

All statements are idempotent where Postgres allows.
*/

ALTER TABLE food_items
  ALTER COLUMN household_id DROP NOT NULL;

-- Keep the owner fallback constrained to the authenticated user.
DROP POLICY IF EXISTS "select_household_food_items" ON food_items;
CREATE POLICY "select_household_food_items"
ON food_items FOR SELECT TO authenticated
USING (
  (
    household_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.household_id = food_items.household_id
    )
  )
  OR (household_id IS NULL AND added_by = auth.uid())
);

DROP POLICY IF EXISTS "insert_household_food_items" ON food_items;
CREATE POLICY "insert_household_food_items"
ON food_items FOR INSERT TO authenticated
WITH CHECK (
  (
    household_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.household_id = food_items.household_id
    )
  )
  OR (household_id IS NULL AND added_by = auth.uid())
);

DROP POLICY IF EXISTS "update_household_food_items" ON food_items;
CREATE POLICY "update_household_food_items"
ON food_items FOR UPDATE TO authenticated
USING (
  (
    household_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.household_id = food_items.household_id
    )
  )
  OR (household_id IS NULL AND added_by = auth.uid())
)
WITH CHECK (
  (
    household_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.household_id = food_items.household_id
    )
  )
  OR (household_id IS NULL AND added_by = auth.uid())
);

DROP POLICY IF EXISTS "delete_household_food_items" ON food_items;
CREATE POLICY "delete_household_food_items"
ON food_items FOR DELETE TO authenticated
USING (
  (
    household_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.household_id = food_items.household_id
    )
  )
  OR (household_id IS NULL AND added_by = auth.uid())
);
