import { describe, it, expect } from 'vitest';
import { calculatePantryScore } from '@/lib/pantryScore';
import { makeFoodItem } from './helpers';

describe('calculatePantryScore', () => {
  it('returns 0 with zero breakdown for an empty pantry', () => {
    const result = calculatePantryScore([], 0);
    expect(result.score).toBe(0);
    expect(result.breakdown).toEqual({
      activeUtilization: 0,
      shelfLifeCompliance: 0,
      notNearExpiry: 0,
      zeroWasteStreak: 0,
    });
  });

  it('scores 100 for a fully fresh, active pantry with max streak', () => {
    const items = [
      makeFoodItem({ name: 'Fresh 1', expires_at: daysFromNow(10) }),
      makeFoodItem({ name: 'Fresh 2', expires_at: daysFromNow(14) }),
    ];
    const result = calculatePantryScore(items, 10);
    expect(result.score).toBe(100);
    expect(result.breakdown.activeUtilization).toBe(100);
    expect(result.breakdown.shelfLifeCompliance).toBe(100);
    expect(result.breakdown.notNearExpiry).toBe(100);
    expect(result.breakdown.zeroWasteStreak).toBe(100);
  });

  it('scores 0 when all items are wasted/expired and streak is 0', () => {
    const items = [
      makeFoodItem({ name: 'Expired 1', expires_at: daysFromNow(-2), status: 'wasted' }),
      makeFoodItem({ name: 'Expired 2', expires_at: daysFromNow(-1), status: 'wasted' }),
    ];
    const result = calculatePantryScore(items, 0);
    // activeUtilization = 0, shelfLifeCompliance = 0, notNearExpiry = 0, streak = 0
    expect(result.score).toBe(0);
  });

  it('caps the zero-waste streak component at 10 days (100%)', () => {
    const items = [makeFoodItem({ name: 'Fresh', expires_at: daysFromNow(10) })];
    const result = calculatePantryScore(items, 999);
    expect(result.breakdown.zeroWasteStreak).toBe(100);
  });

  it('applies the 35/30/25/10 weighting correctly for a mixed pantry', () => {
    // 4 items: 2 active fresh (>2d), 1 active critical (<=2d), 1 wasted
    const items = [
      makeFoodItem({ name: 'A', expires_at: daysFromNow(10) }),
      makeFoodItem({ name: 'B', expires_at: daysFromNow(8) }),
      makeFoodItem({ name: 'C', expires_at: daysFromNow(1) }),
      makeFoodItem({ name: 'D', expires_at: daysFromNow(-1), status: 'wasted' }),
    ];
    const result = calculatePantryScore(items, 5);
    // activeUtilization = 3/4 = 75
    expect(result.breakdown.activeUtilization).toBe(75);
    // shelfLifeCompliance = active & not expired = 3/4 = 75
    expect(result.breakdown.shelfLifeCompliance).toBe(75);
    // notNearExpiry = active & >2 days = 2/4 = 50
    expect(result.breakdown.notNearExpiry).toBe(50);
    // zeroWasteStreak = min(5,10)/10 * 100 = 50
    expect(result.breakdown.zeroWasteStreak).toBe(50);
    // score = 75*0.35 + 75*0.30 + 50*0.25 + 50*0.10
    const expected = Math.round(75 * 0.35 + 75 * 0.3 + 50 * 0.25 + 50 * 0.1);
    expect(result.score).toBe(expected);
  });
});

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
