'use client';

import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  CheckCircle2,
  ChefHat,
  Flame,
  Radar,
  Sparkles,
} from 'lucide-react';
import type { FoodItem } from '@/lib/types';
import { categoryEmoji, getExpiryState } from '@/lib/inventory';
import { formatCurrency } from '@/lib/utils';

interface RescueRailProps {
  items: FoodItem[];
  moneySaved: number;
  wasteStreak: number;
  onRecipe: (item: FoodItem) => void;
}

export function RescueRail({ items, moneySaved, wasteStreak, onRecipe }: RescueRailProps) {
  const activeItems = items
    .filter((item) => item.status !== 'consumed' && item.status !== 'wasted')
    .sort(
      (first, second) =>
        new Date(first.expires_at).getTime() - new Date(second.expires_at).getTime()
    );

  const topItems = activeItems.slice(0, 3);
  const nextMilestone = Math.min(7, Math.max(1, 7 - (wasteStreak % 7 || 7) + (wasteStreak % 7 === 0 ? 0 : 0)));

  return (
    <aside className="space-y-3 xl:sticky xl:top-24">
      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white p-4 shadow-[0_18px_50px_-38px_rgba(6,78,59,0.35)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Radar className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-xs font-black text-ink-950">Rescue radar</h2>
              <p className="text-[9px] font-semibold text-ink-400">What needs eating first</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-700">
            <Sparkles className="h-2.5 w-2.5" />
            AI picks
          </span>
        </div>

        <div className="mt-3 space-y-1.5">
          {topItems.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 px-3 py-5 text-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <p className="mt-2 text-[11px] font-black text-emerald-900">All clear</p>
              <p className="mt-0.5 text-[9px] font-medium text-emerald-700/70">
                Nothing urgent in the pantry.
              </p>
            </div>
          ) : (
            topItems.map((item) => {
              const state = getExpiryState(item);
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onRecipe(item)}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-transparent px-2 py-2 text-left transition-colors hover:border-ink-100 hover:bg-ink-50/60"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream-100 text-base">
                    {categoryEmoji(item.category, item.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-black text-ink-900">
                      {item.name}
                    </span>
                    <span
                      className={`mt-0.5 block text-[9px] font-bold ${
                        state.key === 'expired'
                          ? 'text-coral-500'
                          : state.key === 'fresh'
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                      }`}
                    >
                      {state.countdown}
                    </span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-ink-300" />
                </motion.button>
              );
            })
          )}
        </div>

        {topItems.length > 0 ? (
          <button
            type="button"
            onClick={() => onRecipe(topItems[0])}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <ChefHat className="h-3 w-3" />
            Plan a rescue meal
          </button>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-ink-800 bg-ink-950 p-4 text-white shadow-[0_24px_60px_-38px_rgba(6,78,59,0.7)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />

        <div className="relative flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
            <Flame className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35">
              Household streak
            </p>
            <p className="text-xs font-black text-white">{wasteStreak}-day rescue run</p>
          </div>
        </div>

        <p className="relative mt-3 text-2xl font-black tracking-[-0.04em] text-white">
          {formatCurrency(moneySaved)}
        </p>
        <p className="relative mt-0.5 text-[9px] font-semibold text-white/35">
          Rescued from the bin this month
        </p>

        <div className="relative mt-3">
          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.1em] text-white/30">
            <span>Next badge</span>
            <span>{nextMilestone} days</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-300"
              style={{ width: `${Math.max(12, (wasteStreak / (wasteStreak + nextMilestone)) * 100)}%` }}
            />
          </div>
        </div>

        <div className="relative mt-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2">
          <p className="text-[9px] font-medium leading-relaxed text-white/40">
            Every item you cook before it expires keeps the streak alive and grows your savings.
          </p>
        </div>
      </div>
    </aside>
  );
}
