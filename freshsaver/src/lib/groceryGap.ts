import type { FoodItem, Recipe, FoodUnit } from '@/types';

export interface GroceryGapItem {
  item_name: string;
  suggested_quantity: number;
  unit: FoodUnit;
}

const UNIT_ALIASES: Record<string, FoodUnit> = {
  pcs: 'pcs', pieces: 'pcs', piece: 'pcs', count: 'pcs', ea: 'pcs', each: 'pcs',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg', g: 'kg', gram: 'kg', grams: 'kg',
  liters: 'liters', liter: 'liters', l: 'liters', ml: 'liters', milliliters: 'liters',
  packs: 'packs', pack: 'packs', package: 'packs',
  bunches: 'bunches', bunch: 'bunches',
};

function parseQuantity(qty: string): { value: number; unit: FoodUnit } {
  const trimmed = qty.trim();
  const match = trimmed.match(/^([\d./]+)\s*([a-zA-Z]*)$/);
  if (!match) {
    return { value: 1, unit: 'pcs' };
  }
  const raw = match[1];
  const unitStr = (match[2] || '').toLowerCase();
  let value: number;
  if (raw.includes('/')) {
    const [num, den] = raw.split('/');
    value = parseFloat(num) / parseFloat(den);
  } else {
    value = parseFloat(raw);
  }
  if (isNaN(value) || value <= 0) value = 1;
  const unit = UNIT_ALIASES[unitStr] ?? 'pcs';
  return { value, unit };
}

function namesMatch(a: string, b: string): boolean {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na);
}

/**
 * Find ingredients in a recipe that are missing or insufficient in the
 * active household inventory. Returns a list ready for grocery-list insertion.
 */
export function findMissingIngredients(
  recipe: Recipe,
  items: FoodItem[]
): GroceryGapItem[] {
  const active = items.filter((i) => i.status === 'active');
  const gaps: GroceryGapItem[] = [];

  for (const ing of recipe.ingredients) {
    const needed = parseQuantity(ing.quantity);
    const matched = active.find((i) => namesMatch(i.name, ing.item_name));

    if (!matched) {
      gaps.push({
        item_name: ing.item_name,
        suggested_quantity: Math.round(needed.value * 10) / 10,
        unit: needed.unit,
      });
      continue;
    }

    // Same-unit direct comparison; otherwise treat whole quantity as needed.
    if (matched.unit === needed.unit) {
      const deficit = needed.value - matched.quantity;
      if (deficit > 0) {
        gaps.push({
          item_name: ing.item_name,
          suggested_quantity: Math.round(deficit * 10) / 10,
          unit: needed.unit,
        });
      }
    } else {
      // Different units — assume the existing item doesn't cover the recipe
      // quantity reliably, so add the recipe quantity.
      gaps.push({
        item_name: ing.item_name,
        suggested_quantity: Math.round(needed.value * 10) / 10,
        unit: needed.unit,
      });
    }
  }

  return gaps;
}
