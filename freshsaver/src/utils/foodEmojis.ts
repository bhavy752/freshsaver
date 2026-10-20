import type { StorageLocation } from '@/types';

export interface CategoryVisuals {
  emoji: string;
  /** Short human label used in headers and badges. */
  label: string;
  color: {
    bg: string;
    text: string;
    border: string;
    /** Soft gradient used on roomy cards / hero strips. */
    gradient: string;
  };
}

const DEFAULT_VISUALS: CategoryVisuals = {
  emoji: '🍱',
  label: 'Food',
  color: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
    gradient: 'from-orange-50 to-amber-50',
  },
};

/**
 * Category name → emoji + vibrant culinary colour treatment.
 * Keys are matched case-insensitively as substrings.
 */
export const FOOD_CATEGORY_MAP: Record<string, CategoryVisuals> = {
  Produce: {
    emoji: '🍎',
    label: 'Produce',
    color: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      gradient: 'from-emerald-50 to-lime-50',
    },
  },
  'Fruits & Vegetables': {
    emoji: '🥦',
    label: 'Fruits & Veg',
    color: {
      bg: 'bg-lime-100',
      text: 'text-lime-700',
      border: 'border-lime-200',
      gradient: 'from-lime-50 to-emerald-50',
    },
  },
  'Leafy Greens & Salad': {
    emoji: '🥬',
    label: 'Greens',
    color: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
      gradient: 'from-green-50 to-emerald-50',
    },
  },
  'Dairy & Eggs': {
    emoji: '🥛',
    label: 'Dairy',
    color: {
      bg: 'bg-sky-100',
      text: 'text-sky-700',
      border: 'border-sky-200',
      gradient: 'from-sky-50 to-cyan-50',
    },
  },
  Dairy: {
    emoji: '🧀',
    label: 'Dairy',
    color: {
      bg: 'bg-sky-100',
      text: 'text-sky-700',
      border: 'border-sky-200',
      gradient: 'from-sky-50 to-cyan-50',
    },
  },
  'Meat & Seafood': {
    emoji: '🥩',
    label: 'Meat',
    color: {
      bg: 'bg-rose-100',
      text: 'text-rose-700',
      border: 'border-rose-200',
      gradient: 'from-rose-50 to-red-50',
    },
  },
  Meat: {
    emoji: '🍗',
    label: 'Meat',
    color: {
      bg: 'bg-rose-100',
      text: 'text-rose-700',
      border: 'border-rose-200',
      gradient: 'from-rose-50 to-red-50',
    },
  },
  'Bakery & Bread': {
    emoji: '🍞',
    label: 'Bakery',
    color: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      gradient: 'from-amber-50 to-orange-50',
    },
  },
  Bakery: {
    emoji: '🥖',
    label: 'Bakery',
    color: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      gradient: 'from-amber-50 to-orange-50',
    },
  },
  Pantry: {
    emoji: '📦',
    label: 'Pantry',
    color: {
      bg: 'bg-violet-100',
      text: 'text-violet-700',
      border: 'border-violet-200',
      gradient: 'from-violet-50 to-purple-50',
    },
  },
  Frozen: {
    emoji: '❄️',
    label: 'Frozen',
    color: {
      bg: 'bg-cyan-100',
      text: 'text-cyan-700',
      border: 'border-cyan-200',
      gradient: 'from-cyan-50 to-sky-50',
    },
  },
  Beverages: {
    emoji: '🥤',
    label: 'Drinks',
    color: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-200',
      gradient: 'from-purple-50 to-fuchsia-50',
    },
  },
  Snacks: {
    emoji: '🍿',
    label: 'Snacks',
    color: {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      border: 'border-orange-200',
      gradient: 'from-orange-50 to-amber-50',
    },
  },
};

/** Item-name fallbacks so every item gets a tasty emoji even without a category. */
const FOOD_NAME_EMOJI: Array<[RegExp, string]> = [
  [/apple/i, '🍎'],
  [/avocado/i, '🥑'],
  [/banana/i, '🍌'],
  [/berr/i, '🫐'],
  [/orange|citrus|lemon|lime/i, '🍊'],
  [/grape/i, '🍇'],
  [/tomato/i, '🍅'],
  [/potato/i, '🥔'],
  [/carrot/i, '🥕'],
  [/spinach|kale|lettuce|salad|green/i, '🥬'],
  [/broccoli/i, '🥦'],
  [/onion|garlic/i, '🧅'],
  [/mushroom/i, '🍄'],
  [/milk|cream|yog(h)?urt/i, '🥛'],
  [/cheese|cheddar|mozzarella/i, '🧀'],
  [/egg/i, '🥚'],
  [/butter/i, '🧈'],
  [/chicken|turkey/i, '🍗'],
  [/beef|steak|mince/i, '🥩'],
  [/bacon|pork|ham/i, '🥓'],
  [/fish|salmon|tuna|shrimp|prawn/i, '🐟'],
  [/bread|sourdough|baguette|loaf/i, '🍞'],
  [/bagel|croissant|pastry/i, '🥐'],
  [/rice|pasta|noodle/i, '🍚'],
  [/bean|lentil|chickpea/i, '🫘'],
  [/oil|vinegar|sauce/i, '🫒'],
  [/juice|soda|drink|water/i, '🥤'],
  [/coffee|tea/i, '☕'],
  [/frozen|ice/i, '❄️'],
];

export function getFoodEmoji(itemName: string | null | undefined, categoryName?: string | null): string {
  if (itemName) {
    const matched = FOOD_NAME_EMOJI.find(([pattern]) => pattern.test(itemName));
    if (matched) return matched[1];
  }
  return getCategoryVisuals(categoryName ?? null).emoji;
}

export function getCategoryVisuals(categoryName: string | null, itemName?: string | null): CategoryVisuals {
  if (!categoryName) {
    return itemName ? { ...DEFAULT_VISUALS, emoji: getFoodEmoji(itemName, null) } : DEFAULT_VISUALS;
  }

  const normalized = categoryName.trim().toLowerCase();
  const matched = Object.entries(FOOD_CATEGORY_MAP).find(
    ([key]) => normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)
  );

  const visuals = matched ? matched[1] : DEFAULT_VISUALS;
  return { ...visuals, emoji: getFoodEmoji(itemName, categoryName) };
}

export interface StatusVisuals {
  label: string;
  emoji: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  gradient: string;
}

const STATUS_VISUALS: Record<'fresh' | 'expiring' | 'expired' | 'consumed' | 'wasted', StatusVisuals> = {
  fresh: {
    label: 'Fresh',
    emoji: '🌿',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    gradient: 'from-emerald-50 via-white to-lime-50',
  },
  expiring: {
    label: 'Expiring Soon',
    emoji: '⏳',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    gradient: 'from-amber-50 via-white to-orange-50',
  },
  expired: {
    label: 'Expired',
    emoji: '🚨',
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
    gradient: 'from-red-50 via-white to-rose-50',
  },
  consumed: {
    label: 'Consumed',
    emoji: '✅',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    gradient: 'from-emerald-50 to-white',
  },
  wasted: {
    label: 'Wasted',
    emoji: '🗑️',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    gradient: 'from-slate-50 to-white',
  },
};

export function getStatusColor(status: string): { bg: string; text: string; border: string } {
  const visuals = STATUS_VISUALS[status as keyof typeof STATUS_VISUALS] ?? STATUS_VISUALS.fresh;
  return { bg: visuals.bg, text: visuals.text, border: visuals.border };
}

/** Map remaining shelf life to a vibrant, colour-coded status. */
export function getExpiryStatus(daysLeft: number): 'fresh' | 'expiring' | 'expired' {
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 5) return 'expiring';
  return 'fresh';
}

export function getExpiryVisuals(daysLeft: number): StatusVisuals {
  return STATUS_VISUALS[getExpiryStatus(daysLeft)];
}

export function getStatusVisuals(status: string): StatusVisuals {
  return STATUS_VISUALS[status as keyof typeof STATUS_VISUALS] ?? STATUS_VISUALS.fresh;
}

export interface StorageVisuals {
  emoji: string;
  label: string;
  bg: string;
  text: string;
  border: string;
}

export const STORAGE_VISUALS: Record<StorageLocation, StorageVisuals> = {
  fridge: {
    emoji: '🧊',
    label: 'Fridge',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
  },
  pantry: {
    emoji: '🏠',
    label: 'Pantry',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  freezer: {
    emoji: '❄️',
    label: 'Freezer',
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
  },
};

export function getStorageVisuals(location: StorageLocation | null | undefined): StorageVisuals {
  return STORAGE_VISUALS[location ?? 'pantry'] ?? STORAGE_VISUALS.pantry;
}
