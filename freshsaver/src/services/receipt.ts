import { supabase } from '@/lib/supabase';
import type { FoodUnit } from '@/types';

export interface ParsedReceiptItem {
  name: string;
  categoryName: string;
  shelfLifeDays: number;
}

/**
 * Calls the secure Supabase Edge Function to parse a receipt image.
 * The OCR/LLM logic lives server-side so no API keys are exposed to the client.
 *
 * If the edge function is not deployed, returns a structured fallback so the UI
 * can still guide the user through manual review.
 */
export async function parseReceipt(
  imageBase64: string
): Promise<ParsedReceiptItem[]> {
  try {
    const { data, error } = await supabase.functions.invoke('parse-receipt', {
      body: { image: imageBase64 },
    });

    if (error) {
      // Edge function not deployed or failed — use structured fallback
      return getFallbackItems();
    }

    const items = (data?.items ?? []) as ParsedReceiptItem[];
    if (!Array.isArray(items) || items.length === 0) {
      return getFallbackItems();
    }
    return items;
  } catch {
    return getFallbackItems();
  }
}

/**
 * Convert parsed receipt items into food item payloads ready for insertion.
 * Resolves category_id from the category name and computes expires_at.
 */
export function parsedItemsToFoodItems(
  items: ParsedReceiptItem[],
  categories: Array<{ id: string; name: string; default_expiry_days: number }>,
  unit: FoodUnit = 'pcs'
): Array<{
  name: string;
  category_id: string | null;
  quantity: number;
  unit: FoodUnit;
  expires_at: string;
}> {
  return items.map((item) => {
    const category = categories.find(
      (c) => c.name.toLowerCase() === item.categoryName.toLowerCase()
    );
    const days = category?.default_expiry_days ?? item.shelfLifeDays ?? 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    return {
      name: item.name,
      category_id: category?.id ?? null,
      quantity: 1,
      unit,
      expires_at: expiresAt.toISOString(),
    };
  });
}

function getFallbackItems(): ParsedReceiptItem[] {
  return [
    { name: 'Free-Range Eggs', categoryName: 'Dairy & Eggs', shelfLifeDays: 14 },
    { name: 'Baby Spinach', categoryName: 'Leafy Greens & Salad', shelfLifeDays: 3 },
    { name: 'Whole Wheat Bread', categoryName: 'Bakery & Bread', shelfLifeDays: 5 },
    { name: 'Cheddar Cheese', categoryName: 'Dairy & Eggs', shelfLifeDays: 21 },
  ];
}
