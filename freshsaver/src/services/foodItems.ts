import { supabase } from '@/lib/supabase';
import type { FoodItem, FoodUnit, FoodItemStatus, StorageLocation, Category } from '@/types';

interface FoodItemRow {
  id: string;
  household_id: string;
  added_by: string | null;
  category_id: string | null;
  name: string;
  quantity: number;
  original_quantity?: number;
  unit: string;
  status: string;
  storage_location: string;
  barcode?: string;
  estimated_cost?: number;
  created_at: string;
  expires_at: string;
  category?: Category[] | null;
}

function rowToItem(row: FoodItemRow): FoodItem {
  return {
    id: row.id,
    household_id: row.household_id,
    added_by: row.added_by,
    category_id: row.category_id,
    category: row.category?.[0] ?? null,
    name: row.name,
    quantity: Number(row.quantity),
    original_quantity: row.original_quantity,
    unit: row.unit as FoodUnit,
    status: row.status as FoodItemStatus,
    storage_location: row.storage_location as StorageLocation,
    barcode: row.barcode,
    estimated_cost: row.estimated_cost,
    created_at: row.created_at,
    expires_at: row.expires_at,
  };
}

const FOOD_ITEM_SELECT = `
  id, household_id, added_by, category_id, name, quantity, original_quantity, unit, status, storage_location, barcode, estimated_cost, created_at, expires_at,
  category:categories(id, name, default_expiry_days, icon)
`;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Normalise a value that Postgres expects to be a UUID.
 *
 * Empty strings, whitespace-only strings, malformed values and `undefined`
 * are all collapsed to `null` so they can never trigger Postgres
 * `invalid input syntax for type uuid` (22P02) errors.
 */
export function sanitizeUuid(value: string | null | undefined, fieldName = 'identifier'): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (!UUID_PATTERN.test(trimmed)) {
    console.warn(`[foodItems] Ignoring malformed ${fieldName}: "${trimmed}"`);
    return null;
  }

  return trimmed;
}

interface SupabaseInsertError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

/** Convert raw Postgres/Supabase errors into actionable, user-facing messages. */
function toInsertError(action: string, error: SupabaseInsertError): Error {
  console.error(`[foodItems] ${action} failed`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });

  if (error.code === '22P02') {
    return new Error(`${action}: one of the selected identifiers was invalid. Please refresh and try again.`);
  }
  if (error.code === '23502') {
    return new Error(`${action}: your household context is missing. Please sign in again.`);
  }
  if (error.code === '23503') {
    return new Error(`${action}: the selected category or household no longer exists.`);
  }
  if (error.code === '42501') {
    return new Error(`${action}: you do not have permission to add items to this household.`);
  }

  return new Error(`${action}: ${error.message}`);
}

export async function fetchFoodItems(householdId: string): Promise<FoodItem[]> {
  const { data, error } = await supabase
    .from('food_items')
    .select(FOOD_ITEM_SELECT)
    .eq('household_id', householdId)
    .order('expires_at', { ascending: true });

  if (error) throw new Error(`Failed to load food items: ${error.message}`);
  return (data ?? []).map(rowToItem);
}

export async function insertFoodItem(
  householdId: string | null | undefined,
  addedBy: string | null | undefined,
  item: {
    name: string;
    category_id: string | null;
    quantity: number;
    unit: FoodUnit;
    expires_at: string;
    storage_location: StorageLocation;
    original_quantity?: number;
    estimated_cost?: number;
    barcode?: string;
  }
): Promise<FoodItem> {
  const { data, error } = await supabase
    .from('food_items')
    .insert({
      household_id: sanitizeUuid(householdId, 'household_id'),
      added_by: sanitizeUuid(addedBy, 'added_by'),
      name: item.name.trim(),
      category_id: sanitizeUuid(item.category_id, 'category_id'),
      quantity: item.quantity,
      unit: item.unit,
      expires_at: item.expires_at,
      storage_location: item.storage_location,
      original_quantity: item.original_quantity,
      estimated_cost: item.estimated_cost,
      barcode: item.barcode?.trim() || null,
    })
    .select(FOOD_ITEM_SELECT)
    .maybeSingle();

  if (error) throw toInsertError('Failed to add food item', error);
  if (!data) throw new Error('Failed to add food item: no data returned');
  return rowToItem(data as FoodItemRow);
}

export async function updateFoodItemStatus(
  id: string,
  status: FoodItemStatus
): Promise<void> {
  const { error } = await supabase
    .from('food_items')
    .update({ status })
    .eq('id', id);

  if (error) throw new Error(`Failed to update food item: ${error.message}`);
}

export async function deductFoodItemQuantity(
  id: string,
  deductAmount: number
): Promise<FoodItem | null> {
  const { data: current, error: fetchError } = await supabase
    .from('food_items')
    .select('id, quantity, status')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw new Error(`Failed to fetch item: ${fetchError.message}`);
  if (!current) return null;

  const newQty = Number(current.quantity) - deductAmount;
  if (newQty <= 0) {
    const { data, error } = await supabase
      .from('food_items')
      .update({ quantity: 0, status: 'consumed' })
      .eq('id', id)
      .select(FOOD_ITEM_SELECT)
      .maybeSingle();

    if (error) throw new Error(`Failed to update item: ${error.message}`);
    return data ? rowToItem(data as FoodItemRow) : null;
  }

  const { data, error } = await supabase
    .from('food_items')
    .update({ quantity: newQty })
    .eq('id', id)
    .select(FOOD_ITEM_SELECT)
    .maybeSingle();

  if (error) throw new Error(`Failed to update item: ${error.message}`);
  return data ? rowToItem(data as FoodItemRow) : null;
}

export async function deleteFoodItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('food_items')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete food item: ${error.message}`);
}

export async function insertFoodItemsBulk(
  householdId: string | null | undefined,
  addedBy: string | null | undefined,
  items: Array<{
    name: string;
    category_id: string | null;
    quantity: number;
    unit: FoodUnit;
    expires_at: string;
    storage_location: StorageLocation;
    original_quantity?: number;
    estimated_cost?: number;
    barcode?: string;
  }>
): Promise<FoodItem[]> {
  const safeHouseholdId = sanitizeUuid(householdId, 'household_id');
  const safeAddedBy = sanitizeUuid(addedBy, 'added_by');

  const rows = items.map((item) => ({
    household_id: safeHouseholdId,
    added_by: safeAddedBy,
    name: item.name.trim(),
    category_id: sanitizeUuid(item.category_id, 'category_id'),
    quantity: item.quantity,
    unit: item.unit,
    expires_at: item.expires_at,
    storage_location: item.storage_location,
    original_quantity: item.original_quantity,
    estimated_cost: item.estimated_cost,
    barcode: item.barcode?.trim() || null,
  }));

  const { data, error } = await supabase
    .from('food_items')
    .insert(rows)
    .select(FOOD_ITEM_SELECT);

  if (error) throw toInsertError('Failed to add food items', error);
  return (data ?? []).map(rowToItem);
}
