import type {
  Category,
  CategoryFilter,
  DashboardMetrics,
  ExpiryFilter,
  FoodItem,
  GroceryItem,
} from '@/lib/types';
import { daysUntil } from '@/lib/utils';

export type ExpiryKey = 'expired' | 'critical' | 'soon' | 'fresh';

export interface ExpiryState {
  key: ExpiryKey;
  days: number;
  label: string;
  countdown: string;
  badgeClass: string;
  dotClass: string;
  barClass: string;
  surfaceClass: string;
}

const EXPIRY_META: Record<
  ExpiryKey,
  Omit<ExpiryState, 'key' | 'days' | 'countdown'>
> = {
  expired: {
    label: 'Expired',
    badgeClass: 'border-coral-200 bg-coral-50 text-coral-600',
    dotClass: 'bg-coral-500',
    barClass: 'bg-coral-500',
    surfaceClass: 'border-coral-100 bg-coral-50/40',
  },
  critical: {
    label: 'Use today',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    dotClass: 'bg-amber-500',
    barClass: 'bg-amber-500',
    surfaceClass: 'border-amber-100 bg-amber-50/40',
  },
  soon: {
    label: 'Expiring soon',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    dotClass: 'bg-amber-400',
    barClass: 'bg-amber-400',
    surfaceClass: 'border-amber-100/80 bg-amber-50/20',
  },
  fresh: {
    label: 'Fresh',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dotClass: 'bg-emerald-500',
    barClass: 'bg-emerald-500',
    surfaceClass: 'border-emerald-100 bg-emerald-50/30',
  },
};

export function getExpiryState(item: FoodItem, now = new Date()): ExpiryState {
  const days = daysUntil(item.expires_at, now);
  let key: ExpiryKey = 'fresh';

  if (item.status === 'expired' || days < 0) key = 'expired';
  else if (days <= 1) key = 'critical';
  else if (days <= 3) key = 'soon';

  const meta = EXPIRY_META[key];
  const countdown =
    key === 'expired'
      ? days === 0
        ? 'Expired today'
        : `Expired ${Math.abs(days)}d ago`
      : days === 0
        ? 'Expires today'
        : days === 1
          ? '1 day left'
          : `${days} days left`;

  return { key, days, countdown, ...meta };
}

export function computeMetrics(items: FoodItem[], moneySaved: number): DashboardMetrics {
  const activeItems = items.filter((item) => item.status !== 'consumed' && item.status !== 'wasted');
  const now = new Date();
  let expiringSoon = 0;
  let expired = 0;

  for (const item of activeItems) {
    const state = getExpiryState(item, now);
    if (state.key === 'expired') expired += 1;
    else if (state.key === 'critical' || state.key === 'soon') expiringSoon += 1;
  }

  return {
    totalItems: activeItems.length,
    expiringSoon,
    expired,
    moneySaved,
  };
}

export const CATEGORY_FILTERS: Array<{ key: CategoryFilter; label: string; emoji: string }> = [
  { key: 'all', label: 'All', emoji: '🧺' },
  { key: 'produce', label: 'Produce', emoji: '🥬' },
  { key: 'dairy', label: 'Dairy', emoji: '🥛' },
  { key: 'pantry', label: 'Pantry', emoji: '🫙' },
  { key: 'meat', label: 'Meat', emoji: '🍗' },
  { key: 'bakery', label: 'Bakery', emoji: '🥖' },
  { key: 'frozen', label: 'Frozen', emoji: '🧊' },
];

const CATEGORY_ALIASES: Record<CategoryFilter, string[]> = {
  all: [],
  produce: ['produce', 'fruit', 'vegetable', 'leafy', 'salad', 'herb'],
  dairy: ['dairy', 'egg', 'milk', 'cheese', 'yogurt'],
  pantry: ['pantry', 'grain', 'rice', 'pasta', 'spice', 'condiment', 'canned', 'beverage'],
  meat: ['meat', 'seafood', 'fish', 'poultry', 'chicken', 'beef', 'pork'],
  bakery: ['bakery', 'bread', 'baked'],
  frozen: ['frozen'],
};

export function categoryKeyFromName(name: string | null | undefined): CategoryFilter {
  const normalized = (name ?? '').toLowerCase();
  for (const [key, aliases] of Object.entries(CATEGORY_ALIASES) as Array<
    [CategoryFilter, string[]]
  >) {
    if (key === 'all') continue;
    if (aliases.some((alias) => normalized.includes(alias))) return key;
  }
  return 'pantry';
}

export function categoryEmoji(category: Category | null | undefined, name?: string): string {
  const key = categoryKeyFromName(category?.name ?? name);
  return CATEGORY_FILTERS.find((filter) => filter.key === key)?.emoji ?? '🍽️';
}

export function filterInventory(
  items: FoodItem[],
  category: CategoryFilter,
  expiry: ExpiryFilter
): FoodItem[] {
  const now = new Date();
  return items.filter((item) => {
    if (item.status === 'consumed' || item.status === 'wasted') return false;

    if (category !== 'all') {
      const itemCategory = categoryKeyFromName(item.category?.name ?? item.name);
      if (itemCategory !== category) return false;
    }

    if (expiry === 'all') return true;
    const state = getExpiryState(item, now);
    if (expiry === 'expired') return state.key === 'expired';
    if (expiry === 'soon') return state.key === 'critical' || state.key === 'soon';
    return state.key === 'fresh';
  });
}

export interface LowStockSuggestion {
  item_name: string;
  suggested_quantity: number;
  unit: FoodItem['unit'];
  category_name: string | null;
}

export function deriveLowStock(items: FoodItem[]): LowStockSuggestion[] {
  const suggestions = new Map<string, LowStockSuggestion>();

  for (const item of items) {
    if (item.status === 'consumed' || item.status === 'wasted') continue;
    const state = getExpiryState(item);
    const isLow = item.quantity <= 1;
    const isExpired = state.key === 'expired';

    if (!isLow && !isExpired) continue;

    const key = item.name.trim().toLowerCase();
    if (!key || suggestions.has(key)) continue;

    suggestions.set(key, {
      item_name: item.name,
      suggested_quantity: 1,
      unit: item.unit,
      category_name: item.category?.name ?? null,
    });
  }

  return Array.from(suggestions.values());
}

export const AISLE_ORDER = ['produce', 'dairy', 'meat', 'bakery', 'pantry', 'frozen'] as const;
export type AisleKey = (typeof AISLE_ORDER)[number];

export function aisleForItem(name: string, categoryName?: string | null): AisleKey {
  const key = categoryKeyFromName(categoryName ?? name);
  if (key === 'all') return 'pantry';
  return key;
}

export function groupGroceryItems(items: GroceryItem[]): Array<{
  key: AisleKey;
  label: string;
  emoji: string;
  items: GroceryItem[];
}> {
  const groups = new Map<AisleKey, GroceryItem[]>();

  for (const item of items) {
    const key = aisleForItem(item.item_name, item.category_name);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  return AISLE_ORDER.filter((key) => (groups.get(key)?.length ?? 0) > 0).map((key) => {
    const filter = CATEGORY_FILTERS.find((entry) => entry.key === key);
    return {
      key,
      label: filter?.label ?? 'Other',
      emoji: filter?.emoji ?? '🛒',
      items: groups.get(key) ?? [],
    };
  });
}

export function recipeIdeaForItem(item: FoodItem): {
  title: string;
  description: string;
  prepMinutes: number;
  ingredients: string[];
  steps: string[];
  usesItemId: string;
} {
  const name = item.name.toLowerCase();

  if (name.includes('avocado')) {
    return {
      title: 'Creamy avocado & chilli toast',
      description: 'A five-ingredient rescue recipe for avocados that are exactly ripe.',
      prepMinutes: 8,
      ingredients: ['Ripe avocado', 'Sourdough or bread', 'Lemon', 'Chilli flakes', 'Olive oil'],
      steps: [
        'Toast the bread until deeply golden.',
        'Mash the avocado with lemon, salt, and a glug of olive oil.',
        'Pile onto toast and finish with chilli flakes.',
      ],
      usesItemId: item.id,
    };
  }

  if (name.includes('spinach') || name.includes('greens') || name.includes('kale')) {
    return {
      title: 'Green shakshuka',
      description: 'Wilts a whole bag of greens into a high-protein one-pan dinner.',
      prepMinutes: 18,
      ingredients: ['Greens', 'Eggs', 'Garlic', 'Cumin', 'Feta or yogurt'],
      steps: [
        'Soften garlic in olive oil, then add the greens and cumin.',
        'Make wells and crack in the eggs.',
        'Cover and cook until the whites set. Finish with feta.',
      ],
      usesItemId: item.id,
    };
  }

  if (name.includes('milk') || name.includes('yogurt')) {
    return {
      title: 'Brown-butter yogurt pancakes',
      description: 'A weekend breakfast that uses up milk or yogurt before it turns.',
      prepMinutes: 20,
      ingredients: ['Milk or yogurt', 'Flour', 'Egg', 'Butter', 'Baking powder'],
      steps: [
        'Whisk the wet ingredients together.',
        'Fold in the dry ingredients until just combined.',
        'Cook in foaming brown butter and serve warm.',
      ],
      usesItemId: item.id,
    };
  }

  if (name.includes('chicken') || name.includes('meat') || name.includes('fish')) {
    return {
      title: 'One-pan citrus herb roast',
      description: 'A flexible roast that works with almost any protein and wilting veg.',
      prepMinutes: 30,
      ingredients: [item.name, 'Lemon', 'Garlic', 'Rosemary', 'Olive oil'],
      steps: [
        'Heat the oven to 220°C / 425°F.',
        'Toss everything with lemon, garlic, herbs, and oil.',
        'Roast until cooked through and caramelised at the edges.',
      ],
      usesItemId: item.id,
    };
  }

  return {
    title: `Use-it-up ${item.name.toLowerCase()} bowl`,
    description: 'A forgiving fridge-clearout bowl built around what needs eating first.',
    prepMinutes: 15,
    ingredients: [item.name, 'Any grain', 'Something crunchy', 'Lemon dressing', 'Fresh herbs'],
    steps: [
      'Cook or warm your grain base.',
      'Prepare the item and any other odds and ends in the fridge.',
      'Layer into bowls and dress generously with lemon and olive oil.',
    ],
    usesItemId: item.id,
  };
}
