import type { Category, FoodItem, GroceryItem, Household, Profile } from '@/lib/types';
import { addDays } from '@/lib/utils';

export const DEMO_USER = {
  id: '33333333-3333-4333-8333-333333333301',
  email: 'avery@greentable.demo',
  fullName: 'Avery Chen',
};

export const DEMO_HOUSEHOLD: Household = {
  id: '44444444-4444-4444-8444-444444444401',
  name: 'The Green Table',
  family_members_count: 4,
  join_code: 'GREENT',
  dietary_preferences: ['gluten-free'],
  onboarding_completed: true,
  created_at: addDays(-120),
};

export const DEMO_PROFILE: Profile = {
  id: DEMO_USER.id,
  username: 'avery',
  full_name: DEMO_USER.fullName,
  household_id: DEMO_HOUSEHOLD.id,
  money_saved: 248.4,
  waste_streak: 12,
  created_at: addDays(-120),
};

export const DEMO_CATEGORIES: Category[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    name: 'Produce',
    default_expiry_days: 7,
    icon: '🥬',
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    name: 'Dairy & Eggs',
    default_expiry_days: 14,
    icon: '🥛',
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    name: 'Bakery & Bread',
    default_expiry_days: 5,
    icon: '🥖',
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    name: 'Pantry & Grains',
    default_expiry_days: 180,
    icon: '🫙',
  },
  {
    id: '11111111-1111-4111-8111-111111111105',
    name: 'Meat & Seafood',
    default_expiry_days: 3,
    icon: '🍗',
  },
  {
    id: '11111111-1111-4111-8111-111111111106',
    name: 'Frozen',
    default_expiry_days: 180,
    icon: '🧊',
  },
  {
    id: '11111111-1111-4111-8111-111111111107',
    name: 'Herbs & Spices',
    default_expiry_days: 365,
    icon: '🌿',
  },
  {
    id: '11111111-1111-4111-8111-111111111108',
    name: 'Beverages',
    default_expiry_days: 14,
    icon: '🥤',
  },
  {
    id: '11111111-1111-4111-8111-111111111109',
    name: 'Other',
    default_expiry_days: 7,
    icon: '🍽️',
  },
];

const categoryById = new Map(DEMO_CATEGORIES.map((category) => [category.id, category]));

function demoItem(
  id: string,
  name: string,
  categoryId: string,
  quantity: number,
  unit: FoodItem['unit'],
  expiryDays: number,
  storage: FoodItem['storage_location'],
  estimatedCost: number,
  originalQuantity = quantity
): FoodItem {
  const category = categoryById.get(categoryId) ?? null;
  return {
    id,
    household_id: DEMO_HOUSEHOLD.id,
    added_by: DEMO_PROFILE.id,
    category_id: categoryId,
    category,
    name,
    quantity,
    original_quantity: originalQuantity,
    unit,
    status: 'active',
    storage_location: storage,
    estimated_cost: estimatedCost,
    created_at: addDays(-3),
    expires_at: addDays(expiryDays),
  };
}

export const DEMO_FOOD_ITEMS: FoodItem[] = [
  demoItem(
    '22222222-2222-4222-8222-222222222201',
    'Avocados',
    DEMO_CATEGORIES[0].id,
    3,
    'pcs',
    0,
    'fridge',
    5.4
  ),
  demoItem(
    '22222222-2222-4222-8222-222222222202',
    'Oat milk',
    DEMO_CATEGORIES[1].id,
    1,
    'liters',
    2,
    'fridge',
    4.1
  ),
  demoItem(
    '22222222-2222-4222-8222-222222222203',
    'Baby spinach',
    DEMO_CATEGORIES[0].id,
    1,
    'packs',
    -1,
    'fridge',
    3.2
  ),
  demoItem(
    '22222222-2222-4222-8222-222222222204',
    'Sourdough loaf',
    DEMO_CATEGORIES[2].id,
    1,
    'pcs',
    5,
    'pantry',
    6
  ),
  demoItem(
    '22222222-2222-4222-8222-222222222205',
    'Greek yogurt',
    DEMO_CATEGORIES[1].id,
    3,
    'pcs',
    6,
    'fridge',
    4.5
  ),
  demoItem(
    '22222222-2222-4222-8222-222222222206',
    'Cherry tomatoes',
    DEMO_CATEGORIES[0].id,
    12,
    'pcs',
    4,
    'fridge',
    3.8
  ),
  demoItem(
    '22222222-2222-4222-8222-222222222207',
    'Chicken breast',
    DEMO_CATEGORIES[4].id,
    1,
    'packs',
    1,
    'fridge',
    8.5
  ),
  demoItem(
    '22222222-2222-4222-8222-222222222208',
    'Basmati rice',
    DEMO_CATEGORIES[3].id,
    1,
    'kg',
    120,
    'pantry',
    4
  ),
  demoItem(
    '22222222-2222-4222-8222-222222222209',
    'Aged cheddar',
    DEMO_CATEGORIES[1].id,
    1,
    'packs',
    14,
    'fridge',
    5
  ),
  demoItem(
    '22222222-2222-4222-8222-222222222210',
    'Frozen peas',
    DEMO_CATEGORIES[5].id,
    1,
    'packs',
    180,
    'freezer',
    2.5
  ),
  demoItem(
    '22222222-2222-4222-8222-222222222211',
    'Lemons',
    DEMO_CATEGORIES[0].id,
    2,
    'pcs',
    8,
    'fridge',
    2
  ),
  demoItem(
    '22222222-2222-4222-8222-222222222212',
    'Extra virgin olive oil',
    DEMO_CATEGORIES[3].id,
    1,
    'liters',
    365,
    'pantry',
    9
  ),
];

export const DEMO_GROCERY_ITEMS: GroceryItem[] = [
  {
    id: '55555555-5555-4555-8555-555555555501',
    household_id: DEMO_HOUSEHOLD.id,
    item_name: 'Coffee beans',
    suggested_quantity: 1,
    unit: 'packs',
    is_purchased: false,
    auto_generated: false,
    category_name: 'Pantry & Grains',
    created_at: addDays(-1),
  },
  {
    id: '55555555-5555-4555-8555-555555555502',
    household_id: DEMO_HOUSEHOLD.id,
    item_name: 'Dish soap',
    suggested_quantity: 1,
    unit: 'pcs',
    is_purchased: false,
    auto_generated: false,
    category_name: 'Other',
    created_at: addDays(-1),
  },
  {
    id: '55555555-5555-4555-8555-555555555503',
    household_id: DEMO_HOUSEHOLD.id,
    item_name: 'Paper towels',
    suggested_quantity: 1,
    unit: 'packs',
    is_purchased: true,
    auto_generated: false,
    category_name: 'Other',
    created_at: addDays(-2),
  },
];
