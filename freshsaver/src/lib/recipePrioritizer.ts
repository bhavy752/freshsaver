import type { FoodItem, Recipe } from '@/types';
import { daysUntil } from '@/utils';

/**
 * Urgency weighting for recipe prioritization.
 *  - <= 2 days (critical / <= 48h): 10x
 *  - 3-5 days (soon): 5x
 *  - > 5 days (fresh): 1x
 */
export function urgencyWeight(daysLeft: number): number {
  if (daysLeft <= 2) return 10;
  if (daysLeft <= 5) return 5;
  return 1;
}

export interface PrioritizedRecipe {
  recipe: Recipe;
  score: number;
  matchedIngredients: string[];
  hasCriticalItem: boolean;
}

const CRITICAL_SKIP_PENALTY = 5;

function namesMatch(a: string, b: string): boolean {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na);
}

/**
 * Rank recipes by expiry-weighted ingredient overlap with the active
 * inventory. Applies a penalty for skipping critical (≤48h) items so
 * recipes that use near-expiry food surface first.
 */
export function prioritizeRecipes(
  recipes: Recipe[],
  items: FoodItem[]
): PrioritizedRecipe[] {
  const active = items.filter((i) => i.status === 'active');

  // Build a name -> max-urgency-weight map for quick lookup.
  const itemWeights = new Map<string, number>();
  const criticalItemNames = new Set<string>();

  for (const item of active) {
    const dl = daysUntil(item.expires_at);
    const w = urgencyWeight(dl);
    const existing = itemWeights.get(item.name.toLowerCase()) ?? 0;
    if (w > existing) itemWeights.set(item.name.toLowerCase(), w);
    if (dl <= 2) criticalItemNames.add(item.name.toLowerCase());
  }

  const results: PrioritizedRecipe[] = recipes.map((recipe) => {
    const matched: string[] = [];
    let matchedWeight = 0;
    let hasCritical = false;

    for (const ing of recipe.ingredients) {
      const ingName = ing.item_name.toLowerCase();
      for (const [itemName, weight] of itemWeights) {
        if (namesMatch(ingName, itemName)) {
          matched.push(ing.item_name);
          matchedWeight += weight;
          if (criticalItemNames.has(itemName)) hasCritical = true;
          break;
        }
      }
    }

    // Penalty: each critical inventory item the recipe does NOT match.
    let skippedCritical = 0;
    for (const criticalName of criticalItemNames) {
      const recipeUsesIt = recipe.ingredients.some((ing) =>
        namesMatch(ing.item_name, criticalName)
      );
      if (!recipeUsesIt) skippedCritical++;
    }
    const penalty = skippedCritical * CRITICAL_SKIP_PENALTY;

    return {
      recipe,
      score: matchedWeight - penalty,
      matchedIngredients: matched,
      hasCriticalItem: hasCritical,
    };
  });

  // Sort by score descending. Recipes with critical matches tie-break higher.
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.hasCriticalItem !== b.hasCriticalItem) return a.hasCriticalItem ? -1 : 1;
    return b.matchedIngredients.length - a.matchedIngredients.length;
  });

  return results;
}
