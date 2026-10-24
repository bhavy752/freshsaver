import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Category,
  FoodItem,
  FoodItemStatus,
  FoodUnit,
  StorageLocation,
} from '@/lib/types';
import { ensureHouseholdForUser } from '@/services/profiles';

interface FoodItemRow {
  id: string;
  household_id: string | null;
  added_by: string | null;
  category_id: string | null;
  name: string;
  quantity: number;
  original_quantity?: number | null;
  unit: string;
  status: string;
  storage_location: string;
  barcode?: string | null;
  estimated_cost?: number | null;
  created_at: string;
  expires_at: string;
  category?: Category | Category[] | null;
}

export interface FoodItemInput {
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

interface FoodItemInsertRow {
  household_id: string | null;
  added_by: string | null;
  name: string;
  category_id: string | null;
  quantity: number;
  unit: FoodUnit;
  status: 'active';
  expires_at: string;
  storage_location: StorageLocation;
  original_quantity?: number;
  estimated_cost?: number;
  barcode: string | null;
}

const FOOD_ITEM_SELECT = `
  id, household_id, added_by, category_id, name, quantity, original_quantity, unit, status, storage_location, barcode, estimated_cost, created_at, expires_at,
  category:categories(id, name, default_expiry_days, icon)
`;

const VALID_UNITS: FoodUnit[] = ['pcs', 'pieces', 'kg', 'liters', 'packs', 'bunches'];
const VALID_STORAGE: StorageLocation[] = ['fridge', 'pantry', 'freezer'];
const DEFAULT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function sanitizeUuid(
  value: string | null | undefined,
  fieldName = 'identifier'
): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!UUID_PATTERN.test(trimmed)) {
    console.warn(`[freshsaver] Ignoring malformed ${fieldName}: "${trimmed}"`);
    return null;
  }
  return trimmed;
}

function categoryFromRow(row: FoodItemRow): Category | null {
  if (Array.isArray(row.category)) return row.category[0] ?? null;
  return row.category ?? null;
}

function rowToItem(row: FoodItemRow): FoodItem {
  return {
    id: row.id,
    household_id: row.household_id,
    added_by: row.added_by,
    category_id: row.category_id,
    category: categoryFromRow(row),
    name: row.name,
    quantity: Number(row.quantity),
    original_quantity: row.original_quantity ?? undefined,
    unit: row.unit as FoodUnit,
    status: row.status as FoodItemStatus,
    storage_location: row.storage_location as StorageLocation,
    barcode: row.barcode ?? undefined,
    estimated_cost: row.estimated_cost ?? undefined,
    created_at: row.created_at,
    expires_at: row.expires_at,
  };
}

function buildInsertRow(
  householdId: string | null,
  addedBy: string | null,
  item: FoodItemInput
): FoodItemInsertRow {
  const parsedQuantity = Number(item.quantity);
  const safeQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;
  const safeUnit = VALID_UNITS.includes(item.unit) ? item.unit : 'pieces';
  const safeStorage = VALID_STORAGE.includes(item.storage_location)
    ? item.storage_location
    : 'pantry';
  const safeExpiry =
    typeof item.expires_at === 'string' && !Number.isNaN(Date.parse(item.expires_at))
      ? item.expires_at
      : new Date(Date.now() + DEFAULT_EXPIRY_MS).toISOString();

  return {
    household_id: householdId || null,
    added_by: addedBy || null,
    name: item.name?.trim() || 'Unnamed Item',
    category_id: sanitizeUuid(item.category_id, 'category_id'),
    quantity: safeQuantity,
    unit: safeUnit,
    status: 'active',
    expires_at: safeExpiry,
    storage_location: safeStorage,
    original_quantity: item.original_quantity ?? safeQuantity,
    estimated_cost: item.estimated_cost,
    barcode: item.barcode?.trim() || null,
  };
}

async function resolveHouseholdId(
  supabase: SupabaseClient,
  householdId: string | null | undefined,
  addedBy: string | null | undefined
): Promise<string | null> {
  const direct = sanitizeUuid(householdId, 'household_id');
  if (direct) return direct;

  const safeAddedBy = sanitizeUuid(addedBy, 'added_by');
  if (!safeAddedBy) return null;

  try {
    const household = await ensureHouseholdForUser(supabase, safeAddedBy);
    return sanitizeUuid(household.id, 'household_id');
  } catch (error) {
    console.warn('[freshsaver] Could not resolve a household; saving under the user.', error);
    return null;
  }
}

function toFoodItemError(action: string, error: { message: string; code?: string }): Error {
  if (error.code === '22P02') {
    return new Error(`${action}: an identifier was invalid. Refresh and try again.`);
  }
  if (error.code === '23502') {
    return new Error(`${action}: a required value was missing.`);
  }
  if (error.code === '23503') {
    return new Error(`${action}: the selected category or household no longer exists.`);
  }
  if (error.code === '42501') {
    return new Error(`${action}: you do not have permission to change this inventory.`);
  }
  return new Error(`${action}: ${error.message}`);
}

export async function fetchCategories(supabase: SupabaseClient): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, default_expiry_days, icon')
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return (data ?? []) as Category[];
}

export async function fetchFoodItems(
  supabase: SupabaseClient,
  householdId: string | null | undefined,
  userId?: string | null
): Promise<FoodItem[]> {
  const safeHouseholdId = sanitizeUuid(householdId, 'household_id');
  const safeUserId = sanitizeUuid(userId, 'added_by');
  const rows: FoodItemRow[] = [];

  if (safeHouseholdId) {
    const { data, error } = await supabase
      .from('food_items')
      .select(FOOD_ITEM_SELECT)
      .eq('household_id', safeHouseholdId)
      .order('expires_at', { ascending: true });

    if (error) throw new Error(`Failed to load inventory: ${error.message}`);
    rows.push(...((data ?? []) as FoodItemRow[]));
  }

  if (safeUserId) {
    const { data, error } = await supabase
      .from('food_items')
      .select(FOOD_ITEM_SELECT)
      .is('household_id', null)
      .eq('added_by', safeUserId)
      .order('expires_at', { ascending: true });

    if (error) throw new Error(`Failed to load inventory: ${error.message}`);
    rows.push(...((data ?? []) as FoodItemRow[]));
  }

  const unique = Array.from(new Map(rows.map((row) => [row.id, row])).values());
  unique.sort(
    (first, second) =>
      new Date(first.expires_at).getTime() - new Date(second.expires_at).getTime()
  );

  return unique.map(rowToItem);
}

export async function insertFoodItem(
  supabase: SupabaseClient,
  householdId: string | null | undefined,
  addedBy: string | null | undefined,
  item: FoodItemInput
): Promise<FoodItem> {
  const safeAddedBy = sanitizeUuid(addedBy, 'added_by');
  const safeHouseholdId = await resolveHouseholdId(supabase, householdId, safeAddedBy);
  const payload = buildInsertRow(safeHouseholdId, safeAddedBy, item);

  console.log('Submitting food item:', payload);

  const { data, error } = await supabase
    .from('food_items')
    .insert(payload)
    .select(FOOD_ITEM_SELECT)
    .maybeSingle();

  if (error) throw toFoodItemError('Failed to add food item', error);
  if (!data) throw new Error('Failed to add food item: no data returned');
  return rowToItem(data as FoodItemRow);
}

export async function insertFoodItemsBulk(
  supabase: SupabaseClient,
  householdId: string | null | undefined,
  addedBy: string | null | undefined,
  items: FoodItemInput[]
): Promise<FoodItem[]> {
  if (items.length === 0) return [];
  const safeAddedBy = sanitizeUuid(addedBy, 'added_by');
  const safeHouseholdId = await resolveHouseholdId(supabase, householdId, safeAddedBy);
  const rows = items.map((item) => buildInsertRow(safeHouseholdId, safeAddedBy, item));

  console.log('Submitting food items:', rows);

  const { data, error } = await supabase
    .from('food_items')
    .insert(rows)
    .select(FOOD_ITEM_SELECT);

  if (error) throw toFoodItemError('Failed to add food items', error);
  return ((data ?? []) as FoodItemRow[]).map(rowToItem);
}

export async function updateFoodItemStatus(
  supabase: SupabaseClient,
  id: string,
  status: FoodItemStatus
): Promise<void> {
  const { error } = await supabase.from('food_items').update({ status }).eq('id', id);
  if (error) throw new Error(`Failed to update food item: ${error.message}`);
}

export async function deductFoodItemQuantity(
  supabase: SupabaseClient,
  id: string,
  amount = 1
): Promise<void> {
  const { data: current, error: fetchError } = await supabase
    .from('food_items')
    .select('id, quantity')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw new Error(`Failed to load food item: ${fetchError.message}`);
  if (!current) return;

  const nextQuantity = Number(current.quantity) - amount;
  const { error } = await supabase
    .from('food_items')
    .update(
      nextQuantity <= 0
        ? { quantity: 0, status: 'consumed' }
        : { quantity: nextQuantity }
    )
    .eq('id', id);

  if (error) throw new Error(`Failed to update food item: ${error.message}`);
}

export async function deleteFoodItem(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('food_items').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete food item: ${error.message}`);
}
