import { describe, it, expect } from 'vitest';
import { prioritizeRecipes, urgencyWeight } from '@/lib/recipePrioritizer';
import { makeFoodItem, makeRecipe } from './helpers';

describe('urgencyWeight', () => {
  it('returns 10 for items within 48 hours', () => {
    expect(urgencyWeight(2)).toBe(10);
    expect(urgencyWeight(0)).toBe(10);
    expect(urgencyWeight(-1)).toBe(10);
  });

  it('returns 5 for items expiring in 3-5 days', () => {
    expect(urgencyWeight(3)).toBe(5);
    expect(urgencyWeight(5)).toBe(5);
  });

  it('returns 1 for items with more than 5 days', () => {
    expect(urgencyWeight(6)).toBe(1);
    expect(urgencyWeight(30)).toBe(1);
  });
});

describe('prioritizeRecipes', () => {
  const items = [
    makeFoodItem({ name: 'Spinach', expires_at: daysFromNow(1) }),   // critical (10x)
    makeFoodItem({ name: 'Milk', expires_at: daysFromNow(4) }),      // soon (5x)
    makeFoodItem({ name: 'Rice', expires_at: daysFromNow(30) }),     // fresh (1x)
  ];

  it('ranks a recipe using a critical item higher than one using only fresh items', () => {
    const criticalRecipe = makeRecipe({
      title: 'Spinach Salad',
      ingredients: [{ item_name: 'Spinach', quantity: '2 cups' }],
    });
    const freshRecipe = makeRecipe({
      title: 'Rice Bowl',
      ingredients: [{ item_name: 'Rice', quantity: '1 cup' }],
    });

    const ranked = prioritizeRecipes([freshRecipe, criticalRecipe], items);
    expect(ranked[0].recipe.title).toBe('Spinach Salad');
    expect(ranked[0].hasCriticalItem).toBe(true);
  });

  it('penalizes recipes that skip critical items', () => {
    const usesCritical = makeRecipe({
      title: 'Uses Spinach',
      ingredients: [{ item_name: 'Spinach', quantity: '1 cup' }],
    });
    const skipsCritical = makeRecipe({
      title: 'Only Rice',
      ingredients: [{ item_name: 'Rice', quantity: '1 cup' }],
    });

    const ranked = prioritizeRecipes([usesCritical, skipsCritical], items);
    // skipsCritical has matched weight 1 but penalty 5 => -4
    // usesCritical has matched weight 10
    expect(ranked[0].recipe.title).toBe('Uses Spinach');
    expect(ranked[1].score).toBeLessThan(0);
  });

  it('ensures at least 90% of returned recipes include a critical item when critical items exist', () => {
    const criticalItems = [makeFoodItem({ name: 'Spinach', expires_at: daysFromNow(1) })];
    const recipes = [
      makeRecipe({ title: 'R1', ingredients: [{ item_name: 'Spinach', quantity: '1' }] }),
      makeRecipe({ title: 'R2', ingredients: [{ item_name: 'Spinach', quantity: '1' }] }),
      makeRecipe({ title: 'R3', ingredients: [{ item_name: 'Spinach', quantity: '1' }] }),
      makeRecipe({ title: 'R4', ingredients: [{ item_name: 'Spinach', quantity: '1' }] }),
      makeRecipe({ title: 'R5', ingredients: [{ item_name: 'Spinach', quantity: '1' }] }),
      makeRecipe({ title: 'R6', ingredients: [{ item_name: 'Spinach', quantity: '1' }] }),
      makeRecipe({ title: 'R7', ingredients: [{ item_name: 'Spinach', quantity: '1' }] }),
      makeRecipe({ title: 'R8', ingredients: [{ item_name: 'Spinach', quantity: '1' }] }),
      makeRecipe({ title: 'R9', ingredients: [{ item_name: 'Spinach', quantity: '1' }] }),
      makeRecipe({ title: 'R10', ingredients: [{ item_name: 'Unrelated', quantity: '1' }] }),
    ];

    const ranked = prioritizeRecipes(recipes, criticalItems);
    const withCritical = ranked.filter((r) => r.hasCriticalItem).length;
    // 9 of 10 should include the critical item (the one that doesn't is penalized to bottom)
    expect(withCritical).toBeGreaterThanOrEqual(9);
    // The non-matching recipe should be last
    expect(ranked[ranked.length - 1].recipe.title).toBe('R10');
  });
});

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
