import { describe, it, expect } from 'vitest';
import type { Category } from '@/types';
import BarcodeScanner, { type ScannedProduct } from '@/services/barcodeScanner';

describe('BarcodeScanner productToFoodItemPayload', () => {
  // Helper to create test data
  const createCategory = (name: string, id?: string): Category => ({
    id: id || `cat-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    default_expiry_days: 7,
    icon: '🍎',
  });

  // Test categories for matching
  const categories: Category[] = [
    createCategory('Fruits'),
    createCategory('Dairy & Eggs'),
    createCategory('Bakery & Bread'),
    createCategory('Vegetables'),
    createCategory('Meat & Fish'),
    createCategory('Pantry'),
  ];

  it('converts scanned product with matching category name', () => {
    const scanner = new BarcodeScanner();
    const product: ScannedProduct = {
      code: '1234567890',
      name: 'Organic Bananas',
      category: 'Fruits',
      quantity: 3,
      quantity_unit: 'pcs',
      image_url: 'https://example.com/banana.jpg',
    };
    
    const result = scanner.productToFoodItemPayload(product, categories);
    
    expect(result.name).toBe('Organic Bananas');
    expect(result.category_id).toBe(categories[0].id); // Fruits category
    expect(result.quantity).toBe(3);
    expect(result.unit).toBe('pcs');
    expect(result.expires_at).toBeDefined();
  });

  it('converts scanned product with different unit mapping', () => {
    const scanner = new BarcodeScanner();
    const product: ScannedProduct = {
      code: '9876543210',
      name: 'Whole Milk',
      category: 'Dairy',
      quantity: 2,
      quantity_unit: 'l',
      image_url: 'https://example.com/milk.jpg',
    };
    
    const result = scanner.productToFoodItemPayload(product, categories);
    
    expect(result.name).toBe('Whole Milk');
    expect(result.category_id).toBe(categories[1].id); // Should match 'Dairy & Eggs'
    expect(result.quantity).toBe(2);
    expect(result.unit).toBe('liters'); // 'l' maps to 'liters'
  });

  it('uses default unit when unit mapping is not found', () => {
    const scanner = new BarcodeScanner();
    const product: ScannedProduct = {
      code: '5555555555',
      name: 'Unknown Product',
      category: 'Unknown',
      quantity: 1,
      quantity_unit: 'unknown-unit',
      image_url: 'https://example.com/unknown.jpg',
    };
    
    const result = scanner.productToFoodItemPayload(product, categories);
    
    expect(result.name).toBe('Unknown Product');
    expect(result.category_id).toBeNull(); // No matching category
    expect(result.quantity).toBe(1);
    expect(result.unit).toBe('pcs'); // Default unit
  });

  it('matches category by substring (case-insensitive)', () => {
    const scanner = new BarcodeScanner();
    const product: ScannedProduct = {
      code: '1111111111',
      name: 'Spinach',
      category: 'fresh vegetables',
      quantity: 1,
      quantity_unit: 'g',
      image_url: 'https://example.com/spinach.jpg',
    };
    
    const result = scanner.productToFoodItemPayload(product, categories);
    
    expect(result.name).toBe('Spinach');
    expect(result.category_id).toBe(categories[3].id); // Should match 'Vegetables'
    expect(result.unit).toBe('kg'); // 'g' maps to 'kg'
  });

  it('defaults to pcs unit when quantity is not specified', () => {
    const scanner = new BarcodeScanner();
    const product: ScannedProduct = {
      code: '2222222222',
      name: 'Bread Loaf',
      category: 'Bakery',
      quantity_unit: undefined, // No quantity_unit specified
      image_url: 'https://example.com/bread.jpg',
    };
    
    const result = scanner.productToFoodItemPayload(product, categories);
    
    expect(result.name).toBe('Bread Loaf');
    expect(result.category_id).toBe(categories[2].id); // Should match 'Bakery & Bread'
    expect(result.quantity).toBe(1); // Default quantity
    expect(result.unit).toBe('pcs'); // Default unit
  });

  it('applies shelf life based on product type detection', () => {
    const scanner = new BarcodeScanner();
    
    // Test milk shelf life
    const milkProduct: ScannedProduct = {
      code: '3333333333',
      name: 'Whole Milk',
      category: 'Dairy',
      quantity: 1,
      quantity_unit: 'l',
      image_url: 'https://example.com/milk.jpg',
    };
    
    const milkResult = scanner.productToFoodItemPayload(milkProduct, categories);
    const milkExpiryDate = new Date(milkResult.expires_at);
    const daysUntilMilkExpiry = Math.ceil((milkExpiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    expect(daysUntilMilkExpiry).toBe(7); // Milk has 7-day shelf life
    
    // Test meat shelf life
    const beefProduct: ScannedProduct = {
      code: '4444444444',
      name: 'Ground Beef',
      category: 'Meat',
      quantity: 1,
      quantity_unit: 'kg',
      image_url: 'https://example.com/beef.jpg',
    };
    
    const beefResult = scanner.productToFoodItemPayload(beefProduct, categories);
    const beefExpiryDate = new Date(beefResult.expires_at);
    const daysUntilBeefExpiry = Math.ceil((beefExpiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    expect(daysUntilBeefExpiry).toBe(3); // Meat has 3-day shelf life
    
    // Test fruit shelf life - use product name that matches our keywords
    const bananaProduct: ScannedProduct = {
      code: '5555555555',
      name: 'Fresh Bananas',
      category: 'Fruits',
      quantity: 1,
      quantity_unit: 'pcs',
      image_url: 'https://example.com/bananas.jpg',
    };
    
    const bananaResult = scanner.productToFoodItemPayload(bananaProduct, categories);
    const bananaExpiryDate = new Date(bananaResult.expires_at);
    const daysUntilBananaExpiry = Math.ceil((bananaExpiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    expect(daysUntilBananaExpiry).toBe(5); // Fruits have 5-day shelf life
  });

  it('handles units correctly (g -> kg, l -> liters, pcs -> pcs)', () => {
    const scanner = new BarcodeScanner();
    
    // Test grams to kilograms
    const gramsProduct: ScannedProduct = {
      code: '6666666666',
      name: 'Tomatoes',
      quantity: 500,
      quantity_unit: 'g',
    };
    
    const gramsResult = scanner.productToFoodItemPayload(gramsProduct, categories);
    expect(gramsResult.unit).toBe('kg');
    expect(gramsResult.quantity).toBe(500);
    
    // Test milliliters to liters
    const mlProduct: ScannedProduct = {
      code: '7777777777',
      name: 'Orange Juice',
      quantity: 1000,
      quantity_unit: 'ml',
    };
    
    const mlResult = scanner.productToFoodItemPayload(mlProduct, categories);
    expect(mlResult.unit).toBe('liters');
    expect(mlResult.quantity).toBe(1000);
    
    // Test pieces (no mapping)
    const pcsProduct: ScannedProduct = {
      code: '8888888888',
      name: 'Apples',
      quantity: 6,
      quantity_unit: 'pcs',
    };
    
    const pcsResult = scanner.productToFoodItemPayload(pcsProduct, categories);
    expect(pcsResult.unit).toBe('pcs');
    expect(pcsResult.quantity).toBe(6);
  });

  it('handles null/undefined values gracefully', () => {
    const scanner = new BarcodeScanner();
    const product: ScannedProduct = {
      code: '9999999999',
      name: 'Test Product',
      category: undefined,
      quantity: undefined,
      quantity_unit: undefined,
      image_url: undefined,
    };
    
    const result = scanner.productToFoodItemPayload(product, categories);
    
    expect(result.name).toBe('Test Product');
    expect(result.category_id).toBeNull();
    expect(result.quantity).toBe(1); // Default
    expect(result.unit).toBe('pcs'); // Default
  });
});