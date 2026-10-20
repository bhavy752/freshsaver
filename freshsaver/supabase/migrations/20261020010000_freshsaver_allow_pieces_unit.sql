/*
# FreshSaver: allow the "pieces" unit fallback

The app falls back to `unit = 'pieces'` when a form value is missing, so the
food_items unit constraint must accept it in addition to the existing `pcs`
alias. Existing data is unchanged.
*/

ALTER TABLE food_items
  DROP CONSTRAINT IF EXISTS food_items_unit_check;

ALTER TABLE food_items
  ADD CONSTRAINT food_items_unit_check
  CHECK (unit IN ('pcs', 'pieces', 'kg', 'liters', 'packs', 'bunches'));
