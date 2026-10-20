import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sanitizeUuid, insertFoodItem } from '@/services/foodItems';

const mocks = vi.hoisted(() => ({
  ensureHouseholdForUser: vi.fn(),
  insert: vi.fn(),
}));

vi.mock('@/services/profiles', () => ({
  ensureHouseholdForUser: mocks.ensureHouseholdForUser,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ insert: mocks.insert }),
  },
}));

const VALID_UUID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const USER_ID = '4fa85f64-5717-4562-b3fc-2c963f66afa7';
const NEW_HOUSEHOLD_ID = '5fa85f64-5717-4562-b3fc-2c963f66afa8';

const ITEM_INPUT = {
  name: 'Test Apples',
  category_id: null,
  quantity: 2,
  unit: 'pcs' as const,
  expires_at: '2026-11-01T00:00:00.000Z',
  storage_location: 'fridge' as const,
};

function mockInsertReturning(householdId: string | null) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: {
      id: '6fa85f64-5717-4562-b3fc-2c963f66afa9',
      household_id: householdId,
      added_by: USER_ID,
      category_id: null,
      name: ITEM_INPUT.name,
      quantity: ITEM_INPUT.quantity,
      unit: ITEM_INPUT.unit,
      status: 'active',
      storage_location: ITEM_INPUT.storage_location,
      created_at: '2026-10-20T00:00:00.000Z',
      expires_at: ITEM_INPUT.expires_at,
      category: null,
    },
    error: null,
  });
  const select = vi.fn(() => ({ maybeSingle }));
  mocks.insert.mockReturnValue({ select });
  return select;
}

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

describe('insertFoodItem household resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('uses a supplied household without looking up the profile', async () => {
    const select = mockInsertReturning(VALID_UUID);

    const saved = await insertFoodItem(VALID_UUID, USER_ID, ITEM_INPUT);

    expect(saved.household_id).toBe(VALID_UUID);
    expect(mocks.ensureHouseholdForUser).not.toHaveBeenCalled();
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ household_id: VALID_UUID, added_by: USER_ID })
    );
    expect(select).toHaveBeenCalled();
  });

  it('creates/resolves a Personal Pantry when the household is missing', async () => {
    mocks.ensureHouseholdForUser.mockResolvedValue(NEW_HOUSEHOLD_ID);
    mockInsertReturning(NEW_HOUSEHOLD_ID);

    const saved = await insertFoodItem(null, USER_ID, ITEM_INPUT);

    expect(mocks.ensureHouseholdForUser).toHaveBeenCalledWith(USER_ID);
    expect(saved.household_id).toBe(NEW_HOUSEHOLD_ID);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ household_id: NEW_HOUSEHOLD_ID, added_by: USER_ID })
    );
  });

  it('still saves under added_by when no household can be resolved', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.ensureHouseholdForUser.mockRejectedValue(new Error('household unavailable'));
    mockInsertReturning(null);

    const saved = await insertFoodItem('', USER_ID, ITEM_INPUT);

    expect(saved.household_id).toBeNull();
    const payload = mocks.insert.mock.calls[0]?.[0];
    expect(payload).toMatchObject({ added_by: USER_ID, household_id: null });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('never blocks insertion with a strict household validation error', async () => {
    mockInsertReturning(null);

    await expect(insertFoodItem(null, null, ITEM_INPUT)).resolves.toBeDefined();
    const payload = mocks.insert.mock.calls[0]?.[0];
    expect(payload).toMatchObject({ household_id: null, added_by: null });
  });

  it('fills in safe fallbacks for required payload values', async () => {
    mockInsertReturning(VALID_UUID);

    await insertFoodItem(VALID_UUID, USER_ID, {
      ...ITEM_INPUT,
      name: '   ',
      quantity: 0,
      expires_at: 'not-a-date',
      unit: '' as unknown as typeof ITEM_INPUT.unit,
      storage_location: '' as unknown as typeof ITEM_INPUT.storage_location,
    });

    const payload = mocks.insert.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      name: 'Unnamed Item',
      quantity: 1,
      unit: 'pieces',
      storage_location: 'pantry',
      status: 'active',
      category_id: null,
    });
    expect(Date.parse(payload.expires_at)).not.toBeNaN();
    expect(console.log).toHaveBeenCalledWith('Submitting food item:', payload);
  });
});
