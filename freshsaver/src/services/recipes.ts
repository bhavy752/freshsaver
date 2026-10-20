import { supabase } from '@/lib/supabase';
import type { Recipe, RecipeIngredient } from '@/types';

interface RecipeRow {
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

function rowToRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    household_id: row.household_id,
    created_by: row.created_by,
    title: row.title,
    description: row.description,
    ingredients: row.ingredients ?? [],
    instructions: row.instructions ?? [],
    prep_time_mins: row.prep_time_mins,
    is_custom: row.is_custom,
    created_at: row.created_at,
  };
}

const RECIPE_SELECT = 'id, household_id, created_by, title, description, ingredients, instructions, prep_time_mins, is_custom, created_at';

export async function fetchRecipes(householdId: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select(RECIPE_SELECT)
    .or(`household_id.is.null,household_id.eq.${householdId}`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to load recipes: ${error.message}`);
  return (data ?? []).map(rowToRecipe);
}

export async function insertRecipe(
  householdId: string,
  createdBy: string,
  recipe: {
    title: string;
    description: string;
    ingredients: RecipeIngredient[];
    instructions: string[];
    prep_time_mins: number;
  }
): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .insert({
      household_id: householdId,
      created_by: createdBy,
      title: recipe.title,
      description: recipe.description || null,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      prep_time_mins: recipe.prep_time_mins,
      is_custom: true,
    })
    .select(RECIPE_SELECT)
    .maybeSingle();

  if (error) throw new Error(`Failed to create recipe: ${error.message}`);
  if (!data) throw new Error('Failed to create recipe: no data returned');
  return rowToRecipe(data as RecipeRow);
}

export async function updateRecipe(
  id: string,
  recipe: {
    title: string;
    description: string;
    ingredients: RecipeIngredient[];
    instructions: string[];
    prep_time_mins: number;
  }
): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .update({
      title: recipe.title,
      description: recipe.description || null,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      prep_time_mins: recipe.prep_time_mins,
    })
    .eq('id', id)
    .select(RECIPE_SELECT)
    .maybeSingle();

  if (error) throw new Error(`Failed to update recipe: ${error.message}`);
  if (!data) throw new Error('Failed to update recipe: no data returned');
  return rowToRecipe(data as RecipeRow);
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete recipe: ${error.message}`);
}
