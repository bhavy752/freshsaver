export interface Household {
  id: string;
  name: string;
  family_members_count: number;
  join_code: string;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  household_id: string | null;
  pin_code_hash: string | null;
  waste_streak: number;
  money_saved: number;
  last_waste_check_date: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  default_expiry_days: number;
  icon: string;
}

/** `active` is the state stored in the database for items still in the pantry. */
export type FoodItemStatus = 'active' | 'fresh' | 'expiring' | 'expired' | 'consumed' | 'wasted';
export type FoodUnit = 'pcs' | 'kg' | 'liters' | 'packs' | 'bunches';
export type StorageLocation = 'fridge' | 'pantry' | 'freezer';

export interface FoodItem {
  id: string;
  household_id: string;
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

export interface WasteLog {
  id: string;
  household_id: string;
  food_item_id: string;
  item_name: string;
  quantity_wasted: number;
  estimated_loss: number;
  reason: string;
  logged_at: string;
}

export interface RecipeIngredient {
  item_name: string;
  quantity: string;
  unit?: FoodUnit;
}

export interface Recipe {
  id: string;
  household_id: string | null;
  created_by: string | null;
  title: string;
  description: string | null;
  ingredients: RecipeIngredient[];
  instructions: string[];
  prep_time_mins: number | null;
  is_custom: boolean;
  created_at: string;
}

export interface GroceryListItem {
  id: string;
  household_id: string;
  item_name: string;
  suggested_quantity: number;
  unit: FoodUnit;
  is_purchased: boolean;
  auto_generated: boolean;
  created_at: string;
}

export type UrgencyLevel = 'critical' | 'soon' | 'fresh';
