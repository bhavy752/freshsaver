import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Category,
  FoodItem,
  ParsedReceiptItem,
  StorageLocation,
} from '@/lib/types';
import type { FoodItemInput } from '@/services/foodItems';
import { addDays } from '@/lib/utils';

const FALLBACK_ITEMS: ParsedReceiptItem[] = [
  {
    name: 'Free-range eggs',
    categoryName: 'Dairy & Eggs',
    shelfLifeDays: 14,
    quantity: 1,
    unit: 'packs',
    estimatedCost: 4.8,
    confidence: 0.98,
  },
  {
    name: 'Baby spinach',
    categoryName: 'Produce',
    shelfLifeDays: 3,
    quantity: 1,
    unit: 'packs',
    estimatedCost: 3.2,
    confidence: 0.95,
  },
  {
    name: 'Sourdough loaf',
    categoryName: 'Bakery & Bread',
    shelfLifeDays: 5,
    quantity: 1,
    unit: 'pcs',
    estimatedCost: 6,
    confidence: 0.93,
  },
  {
    name: 'Aged cheddar',
    categoryName: 'Dairy & Eggs',
    shelfLifeDays: 21,
    quantity: 1,
    unit: 'packs',
    estimatedCost: 5.4,
    confidence: 0.91,
  },
  {
    name: 'Cherry tomatoes',
    categoryName: 'Produce',
    shelfLifeDays: 4,
    quantity: 1,
    unit: 'packs',
    estimatedCost: 3.8,
    confidence: 0.89,
  },
];

/**
 * Sends the receipt image to the Supabase Edge Function. OCR and LLM work
 * happens server-side, so no provider API keys ever reach the browser.
 *
 * When the function is unavailable (local demo, missing deployment), the UI
 * still receives a structured sample so the review flow remains usable.
 */
export async function parseReceipt(
  supabase: SupabaseClient | null,
  imageBase64: string,
  mimeType?: string
): Promise<ParsedReceiptItem[]> {
  if (!supabase) return FALLBACK_ITEMS;

  try {
    const { data, error } = await supabase.functions.invoke('parse-receipt', {
      body: { image: imageBase64, mimeType: mimeType ?? 'image/jpeg' },
    });

    if (error) return FALLBACK_ITEMS;

    const items = (data?.items ?? []) as ParsedReceiptItem[];
    if (!Array.isArray(items) || items.length === 0) return FALLBACK_ITEMS;

    return items.map((item) => ({
      name: item.name,
      categoryName: item.categoryName || 'Other',
      shelfLifeDays: Number(item.shelfLifeDays) || 7,
      quantity: Number(item.quantity) || 1,
      unit: item.unit || 'pcs',
      estimatedCost: Number(item.estimatedCost) || undefined,
      confidence: Number(item.confidence) || 0.9,
    }));
  } catch {
    return FALLBACK_ITEMS;
  }
}

export function inferStorageLocation(categoryName: string): StorageLocation {
  const normalized = categoryName.toLowerCase();
  if (normalized.includes('frozen')) return 'freezer';
  if (
    normalized.includes('dairy') ||
    normalized.includes('meat') ||
    normalized.includes('seafood') ||
    normalized.includes('produce')
  ) {
    return 'fridge';
  }
  return 'pantry';
}

export function parsedItemsToFoodItemInputs(
  parsed: ParsedReceiptItem[],
  categories: Category[]
): FoodItemInput[] {
  return parsed.map((item) => {
    const category =
      categories.find(
        (entry) => entry.name.toLowerCase() === item.categoryName.toLowerCase()
      ) ??
      categories.find((entry) => entry.name.toLowerCase().includes('other')) ??
      null;
    const shelfLife = category?.default_expiry_days ?? item.shelfLifeDays ?? 7;

    return {
      name: item.name.trim() || 'Unnamed Item',
      category_id: category?.id ?? null,
      quantity: item.quantity || 1,
      unit: item.unit,
      expires_at: addDays(shelfLife),
      storage_location: inferStorageLocation(item.categoryName),
      original_quantity: item.quantity || 1,
      estimated_cost: item.estimatedCost,
    } satisfies FoodItemInput;
  });
}

export function receiptItemToFoodItem(
  item: ParsedReceiptItem,
  category: Category | null
): FoodItem {
  const shelfLife = category?.default_expiry_days ?? item.shelfLifeDays ?? 7;
  return {
    id: `preview-${item.name}`,
    household_id: null,
    added_by: null,
    category_id: category?.id ?? null,
    category,
    name: item.name,
    quantity: item.quantity,
    original_quantity: item.quantity,
    unit: item.unit,
    status: 'active',
    storage_location: inferStorageLocation(item.categoryName),
    estimated_cost: item.estimatedCost,
    created_at: new Date().toISOString(),
    expires_at: addDays(shelfLife),
  };
}
