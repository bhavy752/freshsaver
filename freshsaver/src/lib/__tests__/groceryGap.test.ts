import { describe, it, expect } from 'vitest';
import { findMissingIngredients } from '@/lib/groceryGap';
import { makeFoodItem, makeRecipe } from './helpers';

describe('findMissingIngredients', () => {
  it('returns all ingredients when inventory is empty', () => {
    const recipe = makeRecipe({
      title: 'Salad',
      ingredients: [
        { item_name: 'Spinach', quantity: '2 cups' },
        { item_name: 'Tomato', quantity: '1 pcs' },
      ],
    });
    const gaps = findMissingIngredients(recipe, []);
    expect(gaps).toHaveLength(2);
    expect(gaps.map((g) => g.item_name)).toContain('Spinach');
    expect(gaps.map((g) => g.item_name)).toContain('Tomato');
  });

  it('returns no gaps when all ingredients are present in sufficient quantity', () => {
    const recipe = makeRecipe({
      title: 'Rice',
      ingredients: [{ item_name: 'Rice', quantity: '1 kg' }],
    });
    const items = [makeFoodItem({ name: 'Rice', quantity: 5, unit: 'kg' })];
    const gaps = findMissingIngredients(recipe, items);
    expect(gaps).toHaveLength(0);
  });

  it('returns the deficit when inventory quantity is insufficient (same unit)', () => {
    const recipe = makeRecipe({
      title: 'Milk Drink',
      ingredients: [{ item_name: 'Milk', quantity: '2 liters' }],
    });
    const items = [makeFoodItem({ name: 'Milk', quantity: 0.5, unit: 'liters' })];
    const gaps = findMissingIngredients(recipe, items);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].item_name).toBe('Milk');
    expect(gaps[0].suggested_quantity).toBe(1.5);
    expect(gaps[0].unit).toBe('liters');
  });

  it('matches ingredients case-insensitively and by substring', () => {
    const recipe = makeRecipe({
      title: 'Soup',
      ingredients: [{ item_name: 'Baby Spinach', quantity: '1 pcs' }],
    });
    const items = [makeFoodItem({ name: 'spinach', quantity: 1, unit: 'pcs' })];
    const gaps = findMissingIngredients(recipe, items);
    expect(gaps).toHaveLength(0);
  });

  it('treats different units as a gap (no unit conversion)', () => {
    const recipe = makeRecipe({
      title: 'Bread',
      ingredients: [{ item_name: 'Flour', quantity: '500 g' }],
    });
    const items = [makeFoodItem({ name: 'Flour', quantity: 2, unit: 'packs' })];
    const gaps = findMissingIngredients(recipe, items);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].unit).toBe('kg'); // 'g' aliases to 'kg'
  });

  it('ignores consumed/wasted items when checking inventory', () => {
    const recipe = makeRecipe({
      title: 'Salad',
      ingredients: [{ item_name: 'Spinach', quantity: '1 pcs' }],
    });
    const items = [makeFoodItem({ name: 'Spinach', quantity: 5, unit: 'pcs', status: 'consumed' })];
    const gaps = findMissingIngredients(recipe, items);
    expect(gaps).toHaveLength(1);
  });
});
