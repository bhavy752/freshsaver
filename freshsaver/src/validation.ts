import { z } from 'zod';

export const foodItemSchema = z.object({
  name: z.string().min(1, 'Please enter a food name').max(100, 'Name is too long'),
  category_id: z.string().uuid().nullable().optional(),
  quantity: z.number().positive('Quantity must be greater than 0').max(10000, 'Quantity is too large'),
  unit: z.enum(['pcs', 'kg', 'liters', 'packs', 'bunches']),
  expires_at: z.string().min(1, 'Expiry date is required'),
});

export const groceryItemSchema = z.object({
  item_name: z.string().min(1, 'Please enter an item name').max(100, 'Name is too long'),
  suggested_quantity: z.number().positive('Quantity must be greater than 0').max(10000, 'Quantity is too large'),
  unit: z.enum(['pcs', 'kg', 'liters', 'packs', 'bunches']),
});

export const recipeSchema = z.object({
  title: z.string().min(1, 'Please enter a recipe title').max(200, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional().default(''),
  ingredients: z.array(
    z.object({
      item_name: z.string().min(1, 'Ingredient name is required'),
      quantity: z.string().min(1, 'Quantity is required'),
    })
  ).min(1, 'Add at least one ingredient'),
  instructions: z.array(z.string().min(1)).min(1, 'Add at least one instruction step'),
  prep_time_mins: z.number().int().min(1, 'Prep time must be at least 1 minute').max(600, 'Prep time is too large'),
});

export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().min(2, 'Username must be at least 2 characters').max(30, 'Username is too long'),
  fullName: z.string().max(100).optional().default(''),
  householdName: z.string().min(1, 'Please enter a household name').max(100, 'Household name is too long'),
  familyMembersCount: z.number().int().min(1, 'At least 1 family member').max(20, 'Too many members'),
  joinCode: z.string().max(6).optional().or(z.literal('')),
});

export const pinSchema = z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits');

/**
 * Strict schema for parsed receipt output from the Edge Function.
 * Each item must carry a name, a category hint, and a shelf life in days.
 */
export const receiptParseSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().min(1, 'Item name is required').max(100, 'Name is too long'),
      categoryName: z.string().min(1).max(100),
      shelfLifeDays: z.number().int().min(0).max(3650),
    })
  ).min(1, 'Receipt must contain at least one item'),
});

export type ReceiptParseInput = z.infer<typeof receiptParseSchema>;

export type FoodItemInput = z.infer<typeof foodItemSchema>;
export type GroceryItemInput = z.infer<typeof groceryItemSchema>;
export type RecipeInput = z.infer<typeof recipeSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
