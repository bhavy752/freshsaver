/*
# Create food_items table (single-tenant, no auth)

## Overview
Creates the food_items table to store food inventory tracked by the FreshSaver app.
Each row represents a food item with its name, category, emoji, dates, and urgency info.

## New Tables
- `food_items`
  - `id` (uuid, primary key, auto-generated)
  - `name` (text, not null) — the food item name, e.g. "Organic Milk"
  - `emoji` (text, not null, default '📦') — emoji icon for the item
  - `category` (text, not null, default 'other') — food category: dairy, produce, meat, bakery, pantry, frozen, beverages, snacks, other
  - `added_date` (timestamptz, not null, default now()) — when the item was added to the tracker
  - `expires_date` (timestamptz) — when the item expires
  - `days_left` (integer, not null, default 0) — computed days until expiration
  - `created_at` (timestamptz, default now()) — row creation timestamp

## Security
- Row Level Security is ENABLED on food_items.
- This is a single-tenant app with no sign-in screen, so all CRUD operations
  are allowed for both anon and authenticated roles (the data is intentionally shared/public).
- Four separate policies created: SELECT, INSERT, UPDATE, DELETE.

## Important Notes
1. The app uses the anon key (no sign-in), so policies MUST include the anon role.
2. USING (true) is acceptable here because the data is intentionally public/shared in this single-tenant app.
3. An index is added on days_left for efficient urgency-based querying.
*/

CREATE TABLE IF NOT EXISTS food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '📦',
  category text NOT NULL DEFAULT 'other',
  added_date timestamptz NOT NULL DEFAULT now(),
  expires_date timestamptz,
  days_left integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_food_items_days_left ON food_items(days_left);

ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_food_items" ON food_items;
CREATE POLICY "anon_select_food_items"
ON food_items FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "anon_insert_food_items" ON food_items;
CREATE POLICY "anon_insert_food_items"
ON food_items FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_food_items" ON food_items;
CREATE POLICY "anon_update_food_items"
ON food_items FOR UPDATE
TO anon, authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_food_items" ON food_items;
CREATE POLICY "anon_delete_food_items"
ON food_items FOR DELETE
TO anon, authenticated
USING (true);
