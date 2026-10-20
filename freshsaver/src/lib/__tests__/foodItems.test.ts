import { describe, it, expect, vi } from 'vitest';
import { sanitizeUuid } from '@/services/foodItems';

const VALID_UUID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

describe('sanitizeUuid', () => {
  it('keeps a valid UUID unchanged', () => {
    expect(sanitizeUuid(VALID_UUID, 'category_id')).toBe(VALID_UUID);
  });

  it('converts empty and whitespace-only values to null', () => {
    expect(sanitizeUuid('', 'category_id')).toBeNull();
    expect(sanitizeUuid('   ', 'category_id')).toBeNull();
    expect(sanitizeUuid('\t\n', 'household_id')).toBeNull();
  });

  it('converts missing values to null', () => {
    expect(sanitizeUuid(undefined, 'added_by')).toBeNull();
    expect(sanitizeUuid(null, 'added_by')).toBeNull();
  });

  it('drops malformed identifiers instead of sending them to Postgres', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(sanitizeUuid('not-a-uuid', 'household_id')).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('trims UUIDs before returning them', () => {
    expect(sanitizeUuid(`  ${VALID_UUID}  `, 'category_id')).toBe(VALID_UUID);
  });
});
