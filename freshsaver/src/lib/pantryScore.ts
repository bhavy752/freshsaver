import type { FoodItem } from '@/types';
import { daysUntil } from '@/utils';

export interface PantryScoreBreakdown {
  activeUtilization: number;   // 0-100 (35% weight)
  shelfLifeCompliance: number; // 0-100 (30% weight)
  notNearExpiry: number;       // 0-100 (25% weight)
  zeroWasteStreak: number;     // 0-10  (10% weight, streak capped at 10)
}

export interface PantryScoreResult {
  score: number; // 0-100
  breakdown: PantryScoreBreakdown;
}

const WEIGHTS = {
  activeUtilization: 0.35,
  shelfLifeCompliance: 0.30,
  notNearExpiry: 0.25,
  zeroWasteStreak: 0.10,
} as const;

const STREAK_CAP = 10;

/**
 * Calculate the Pantry Health Score (0-100).
 *
 * Components:
 *  - 35% active inventory utilization: active items / total items
 *  - 30% shelf-life compliance: items whose remaining life is within the
 *    category's default expiry window (approximated by days-left >= 0 and
 *    remaining <= category default expiry days when known, else not expired)
 *  - 25% items not nearing expiration: active items with >2 days left
 *  - 10% zero-waste streak (capped at 10, mapped to 0-100)
 */
export function calculatePantryScore(
  items: FoodItem[],
  zeroWasteStreak: number
): PantryScoreResult {
  const total = items.length;

  if (total === 0) {
    return {
      score: 0,
      breakdown: {
        activeUtilization: 0,
        shelfLifeCompliance: 0,
        notNearExpiry: 0,
        zeroWasteStreak: 0,
      },
    };
  }

  // 1. Active utilization
  const activeStatuses = ['active', 'fresh', 'expiring', 'expired'];
  const activeCount = items.filter((i) => activeStatuses.includes(i.status)).length;
  const activeUtilization = Math.round((activeCount / total) * 100);

  // 2. Shelf-life compliance: active items not yet expired and within
  //    a reasonable fresh window. We treat an item as compliant if it is
  //    active and has >0 days remaining (not expired).
  const compliantCount = items.filter(
    (i) => activeStatuses.includes(i.status) && daysUntil(i.expires_at) > 0
  ).length;
  const shelfLifeCompliance = Math.round((compliantCount / total) * 100);

  // 3. Not near expiry: active items with > 2 days remaining
  const freshCount = items.filter(
    (i) => activeStatuses.includes(i.status) && daysUntil(i.expires_at) > 2
  ).length;
  const notNearExpiry = Math.round((freshCount / total) * 100);

  // 4. Zero-waste streak (capped at STREAK_CAP, scaled to 0-100)
  const cappedStreak = Math.max(0, Math.min(STREAK_CAP, zeroWasteStreak));
  const zeroWasteStreakScore = Math.round((cappedStreak / STREAK_CAP) * 100);

  const score = Math.round(
    activeUtilization * WEIGHTS.activeUtilization +
      shelfLifeCompliance * WEIGHTS.shelfLifeCompliance +
      notNearExpiry * WEIGHTS.notNearExpiry +
      zeroWasteStreakScore * WEIGHTS.zeroWasteStreak
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    breakdown: {
      activeUtilization,
      shelfLifeCompliance,
      notNearExpiry,
      zeroWasteStreak: zeroWasteStreakScore,
    },
  };
}
