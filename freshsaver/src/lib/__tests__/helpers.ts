import type { FoodItem, Recipe, FoodUnit, FoodItemStatus } from '@/types';

let idCounter = 0;
export function uid(): string {
  idCounter += 1;
  return `id-${idCounter}`;
}

export function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function makeFoodItem(
  partial: Partial<FoodItem> & { name: string }
): FoodItem {
  return {
    id: uid(),
    household_id: 'household-1',
    added_by: null,
    category_id: null,
    category: null,
    quantity: 1,
    unit: 'pcs' as FoodUnit,
    status: 'active' as FoodItemStatus,
    storage_location: 'pantry',
    created_at: isoDaysFromNow(-7),
    expires_at: isoDaysFromNow(7),
    ...partial,
  };
}

export function makeRecipe(
  partial: Partial<Recipe> & { title: string; ingredients: { item_name: string; quantity: string }[] }
): Recipe {
  return {
    id: uid(),
    household_id: 'household-1',
    created_by: null,
    description: null,
    instructions: ['Step 1'],
    prep_time_mins: 15,
    is_custom: true,
    created_at: isoDaysFromNow(-1),
    ...partial,
  };
}
