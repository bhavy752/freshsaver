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
  householdId: string,
  addedBy: string,
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
      household_id: householdId,
      added_by: addedBy,
      name: item.name,
      category_id: item.category_id,
      quantity: item.quantity,
      unit: item.unit,
      expires_at: item.expires_at,
      storage_location: item.storage_location,
      original_quantity: item.original_quantity,
      estimated_cost: item.estimated_cost,
      barcode: item.barcode,
    })
    .select(FOOD_ITEM_SELECT)
    .maybeSingle();

  if (error) throw new Error(`Failed to add food item: ${error.message}`);
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
  householdId: string,
  addedBy: string,
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
  const rows = items.map((item) => ({
    household_id: householdId,
    added_by: addedBy,
    name: item.name,
    category_id: item.category_id,
    quantity: item.quantity,
    unit: item.unit,
    expires_at: item.expires_at,
    storage_location: item.storage_location,
    original_quantity: item.original_quantity,
    estimated_cost: item.estimated_cost,
    barcode: item.barcode,
  }));

  const { data, error } = await supabase
    .from('food_items')
    .insert(rows)
    .select(FOOD_ITEM_SELECT);

  if (error) throw new Error(`Failed to add food items: ${error.message}`);
  return (data ?? []).map(rowToItem);
}
