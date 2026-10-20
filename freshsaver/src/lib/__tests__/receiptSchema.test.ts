import { describe, it, expect } from 'vitest';
import { receiptParseSchema } from '@/validation';

describe('receiptParseSchema', () => {
  it('accepts a well-formed receipt payload', () => {
    const result = receiptParseSchema.safeParse({
      items: [
        { name: 'Milk', categoryName: 'Dairy', shelfLifeDays: 7 },
        { name: 'Eggs', categoryName: 'Dairy', shelfLifeDays: 14 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty items array', () => {
    const result = receiptParseSchema.safeParse({ items: [] });
    expect(result.success).toBe(false);
  });

  it('rejects items missing a name', () => {
    const result = receiptParseSchema.safeParse({
      items: [{ name: '', categoryName: 'Dairy', shelfLifeDays: 7 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative shelf life days', () => {
    const result = receiptParseSchema.safeParse({
      items: [{ name: 'Milk', categoryName: 'Dairy', shelfLifeDays: -3 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-array items field', () => {
    const result = receiptParseSchema.safeParse({ items: 'not-an-array' });
    expect(result.success).toBe(false);
  });
});
