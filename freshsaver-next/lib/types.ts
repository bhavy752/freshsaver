export type DietaryPreference =
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'gluten-free'
  | 'dairy-free'
  | 'nut-free'
  | 'halal'
  | 'none';

export interface Household {
  id: string;
  name: string;
  family_members_count: number;
  join_code: string;
  dietary_preferences: string[];
  onboarding_completed: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  household_id: string | null;
  money_saved: number;
  waste_streak: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  default_expiry_days: number;
  icon: string;
}

export type FoodUnit = 'pcs' | 'pieces' | 'kg' | 'liters' | 'packs' | 'bunches';
export type StorageLocation = 'fridge' | 'pantry' | 'freezer';
export type FoodItemStatus = 'active' | 'fresh' | 'expiring' | 'expired' | 'consumed' | 'wasted';

export interface FoodItem {
  id: string;
  household_id: string | null;
  added_by: string | null;
  category_id: string | null;
  category?: Category | null;
  name: string;
  quantity: number;
  original_quantity?: number;
  unit: FoodUnit;
  status: FoodItemStatus;
  storage_location: StorageLocation;
  barcode?: string;
  estimated_cost?: number;
  created_at: string;
  expires_at: string;
}

export interface GroceryItem {
  id: string;
  household_id: string;
  item_name: string;
  suggested_quantity: number;
  unit: FoodUnit;
  is_purchased: boolean;
  auto_generated: boolean;
  category_name?: string | null;
  created_at: string;
}

export interface ParsedReceiptItem {
  name: string;
  categoryName: string;
  shelfLifeDays: number;
  quantity: number;
  unit: FoodUnit;
  estimatedCost?: number;
  confidence?: number;
}

export interface DashboardMetrics {
  totalItems: number;
  expiringSoon: number;
  expired: number;
  moneySaved: number;
}

export type ExpiryFilter = 'all' | 'fresh' | 'soon' | 'expired';
export type CategoryFilter = 'all' | 'produce' | 'dairy' | 'pantry' | 'meat' | 'bakery' | 'frozen';

export interface RecipeIdea {
  title: string;
  description: string;
  prepMinutes: number;
  ingredients: string[];
  steps: string[];
  usesItemId: string;
}

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
}
