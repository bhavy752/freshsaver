import type { SupabaseClient } from '@supabase/supabase-js';
import type { FoodUnit, GroceryItem } from '@/lib/types';

interface GroceryRow {
  id: string;
  household_id: string;
  item_name: string;
  suggested_quantity: number;
  unit: string;
  is_purchased: boolean;
  auto_generated: boolean;
  created_at: string;
}

const GROCERY_SELECT =
  'id, household_id, item_name, suggested_quantity, unit, is_purchased, auto_generated, created_at';

function rowToItem(row: GroceryRow): GroceryItem {
  return {
    id: row.id,
    household_id: row.household_id,
    item_name: row.item_name,
    suggested_quantity: Number(row.suggested_quantity),
    unit: row.unit as FoodUnit,
    is_purchased: row.is_purchased,
    auto_generated: row.auto_generated,
    category_name: null,
    created_at: row.created_at,
  };
}

export async function fetchGroceryItems(
  supabase: SupabaseClient,
  householdId: string
): Promise<GroceryItem[]> {
  const { data, error } = await supabase
    .from('grocery_list')
    .select(GROCERY_SELECT)
    .eq('household_id', householdId)
    .order('is_purchased', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to load shopping list: ${error.message}`);
  return ((data ?? []) as GroceryRow[]).map(rowToItem);
}

export async function insertGroceryItem(
  supabase: SupabaseClient,
  householdId: string,
  item: {
    item_name: string;
    suggested_quantity: number;
    unit: FoodUnit;
    auto_generated?: boolean;
  }
): Promise<GroceryItem> {
  const { data, error } = await supabase
    .from('grocery_list')
    .insert({
      household_id: householdId,
      item_name: item.item_name.trim(),
      suggested_quantity: item.suggested_quantity,
      unit: item.unit,
      auto_generated: item.auto_generated ?? false,
    })
    .select(GROCERY_SELECT)
    .maybeSingle();

  if (error) throw new Error(`Failed to add shopping item: ${error.message}`);
  if (!data) throw new Error('Failed to add shopping item: no data returned');
  return rowToItem(data as GroceryRow);
}

export async function autoGenerateGroceryItems(
  supabase: SupabaseClient,
  householdId: string,
  items: Array<{
    item_name: string;
    suggested_quantity: number;
    unit: FoodUnit;
  }>
): Promise<GroceryItem[]> {
  if (items.length === 0) return [];

  const rows = items.map((item) => ({
    household_id: householdId,
    item_name: item.item_name,
    suggested_quantity: item.suggested_quantity,
    unit: item.unit,
    auto_generated: true,
  }));

  const { data, error } = await supabase
    .from('grocery_list')
    .insert(rows)
    .select(GROCERY_SELECT);

  if (error) throw new Error(`Failed to generate shopping list: ${error.message}`);
  return ((data ?? []) as GroceryRow[]).map(rowToItem);
}

export async function toggleGroceryItem(
  supabase: SupabaseClient,
  id: string,
  isPurchased: boolean
): Promise<void> {
  const { error } = await supabase
    .from('grocery_list')
    .update({ is_purchased: isPurchased })
    .eq('id', id);

  if (error) throw new Error(`Failed to update shopping item: ${error.message}`);
}

export async function deleteGroceryItem(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('grocery_list').delete().eq('id', id);
  if (error) throw new Error(`Failed to remove shopping item: ${error.message}`);
}
