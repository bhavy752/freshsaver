import { supabase } from '@/lib/supabase';
import type { GroceryListItem, FoodUnit } from '@/types';

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

function rowToItem(row: GroceryRow): GroceryListItem {
  return {
    id: row.id,
    household_id: row.household_id,
    item_name: row.item_name,
    suggested_quantity: Number(row.suggested_quantity),
    unit: row.unit as FoodUnit,
    is_purchased: row.is_purchased,
    auto_generated: row.auto_generated,
    created_at: row.created_at,
  };
}

export async function fetchGroceryList(householdId: string): Promise<GroceryListItem[]> {
  const { data, error } = await supabase
    .from('grocery_list')
    .select('id, household_id, item_name, suggested_quantity, unit, is_purchased, auto_generated, created_at')
    .eq('household_id', householdId)
    .order('is_purchased', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to load grocery list: ${error.message}`);
  return (data ?? []).map(rowToItem);
}

export async function insertGroceryItem(
  householdId: string,
  item: {
    item_name: string;
    suggested_quantity: number;
    unit: FoodUnit;
  }
): Promise<GroceryListItem> {
  const { data, error } = await supabase
    .from('grocery_list')
    .insert({
      household_id: householdId,
      item_name: item.item_name,
      suggested_quantity: item.suggested_quantity,
      unit: item.unit,
      auto_generated: false,
    })
    .select('id, household_id, item_name, suggested_quantity, unit, is_purchased, auto_generated, created_at')
    .maybeSingle();

  if (error) throw new Error(`Failed to add grocery item: ${error.message}`);
  if (!data) throw new Error('Failed to add grocery item: no data returned');
  return rowToItem(data as GroceryRow);
}

export async function toggleGroceryItemPurchased(
  id: string,
  isPurchased: boolean
): Promise<void> {
  const { error } = await supabase
    .from('grocery_list')
    .update({ is_purchased: isPurchased })
    .eq('id', id);

  if (error) throw new Error(`Failed to update grocery item: ${error.message}`);
}

export async function deleteGroceryItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('grocery_list')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete grocery item: ${error.message}`);
}

export async function autoGenerateGroceryItems(
  householdId: string,
  items: Array<{
    item_name: string;
    suggested_quantity: number;
    unit: FoodUnit;
  }>
): Promise<void> {
  const rows = items.map((item) => ({
    household_id: householdId,
    item_name: item.item_name,
    suggested_quantity: item.suggested_quantity,
    unit: item.unit,
    auto_generated: true,
  }));

  const { error } = await supabase
    .from('grocery_list')
    .insert(rows);

  if (error) throw new Error(`Failed to generate grocery items: ${error.message}`);
}
