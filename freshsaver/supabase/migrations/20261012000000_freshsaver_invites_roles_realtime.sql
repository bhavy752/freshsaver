/*
# FreshSaver: Household invites, roles, realtime conflict fields

## What this migration does
1. **Household roles** — adds a `role` column to `profiles`
   ('owner' | 'member', default 'member') with a CHECK constraint.
2. **household_invites table** — signed, expiring, one-time-use invite tokens
   for joining a household with a specific role.
3. **updated_at timestamps** — adds `updated_at` to `food_items` and
   `grocery_list` with an `on update now()` trigger for last-write-wins
   conflict resolution in Realtime sync.
4. **Indexes** on hot invite/realtime columns.
5. **RLS** on `household_invites` so only the household owner can
   create/revoke invites and only the invitee (by email) can read pending ones.

All statements are idempotent where Postgres allows.
*/

-- ============================================================
-- 1. Household roles on profiles
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('owner', 'member'));
  END IF;
END $$;

-- The first member of each household becomes its owner.
UPDATE profiles p
SET role = 'owner'
WHERE p.household_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles o
    WHERE o.household_id = p.household_id AND o.role = 'owner'
  );

CREATE INDEX IF NOT EXISTS idx_profiles_household_role
  ON profiles(household_id, role);

-- ============================================================
-- 2. household_invites table
-- ============================================================

CREATE TABLE IF NOT EXISTS household_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  email text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE household_invites ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_household_invites_household_id
  ON household_invites(household_id);
CREATE INDEX IF NOT EXISTS idx_household_invites_token
  ON household_invites(token);
CREATE INDEX IF NOT EXISTS idx_household_invites_expires_at
  ON household_invites(expires_at);

-- Only household owners can create invites.
DROP POLICY IF EXISTS "owner_insert_invites" ON household_invites;
CREATE POLICY "owner_insert_invites"
  ON household_invites FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.household_id = household_invites.household_id
        AND p.role = 'owner'
    )
  );

-- Owners can read/revoke invites for their household; invitees can read
-- their own pending invite by matching email (via auth.users.email).
DROP POLICY IF EXISTS "select_invites" ON household_invites;
CREATE POLICY "select_invites"
  ON household_invites FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.household_id = household_invites.household_id
        AND p.role = 'owner'
    )
    OR (
      consumed_at IS NULL AND revoked_at IS NULL
      AND EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = auth.uid() AND lower(u.email) = lower(household_invites.email)
      )
    )
  );

-- Only owners can update (revoke) invites.
DROP POLICY IF EXISTS "owner_update_invites" ON household_invites;
CREATE POLICY "owner_update_invites"
  ON household_invites FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.household_id = household_invites.household_id
        AND p.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.household_id = household_invites.household_id
        AND p.role = 'owner'
    )
  );

-- ============================================================
-- 3. updated_at for last-write-wins conflict resolution
-- ============================================================

ALTER TABLE food_items
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE grocery_list
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_food_items_updated_at ON food_items;
CREATE TRIGGER trg_food_items_updated_at
  BEFORE UPDATE ON food_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_grocery_list_updated_at ON grocery_list;
CREATE TRIGGER trg_grocery_list_updated_at
  BEFORE UPDATE ON grocery_list
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable realtime publication for the synced tables.
ALTER PUBLICATION supabase_realtime ADD TABLE food_items;
ALTER PUBLICATION supabase_realtime ADD TABLE grocery_list;
