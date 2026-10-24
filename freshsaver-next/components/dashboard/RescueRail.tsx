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
    <aside className="space-y-6 xl:sticky xl:top-24">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-900/60 backdrop-blur-xl p-5 shadow-2xl shadow-emerald-950/20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Radar className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-xs font-black tracking-tight text-white">Rescue radar</h2>
              <p className="text-[9px] font-semibold text-slate-400">What needs eating first</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-emerald-300">
            <Sparkles className="h-2.5 w-2.5" />
            AI picks
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {topItems.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/10 px-3 py-6 text-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <p className="mt-2 text-[11px] font-black text-emerald-300">All clear</p>
              <p className="mt-0.5 text-[9px] font-medium text-emerald-300/70">
                Nothing urgent in the pantry.
              </p>
            </div>
          ) : (
            topItems.map((item) => {
              const state = getExpiryState(item);
              const isUrgent = state.key === 'expired' || state.key === 'critical';
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onRecipe(item)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all duration-300',
                    isUrgent
                      ? 'border-red-500/30 bg-red-500/10 hover:border-red-500/50 hover:bg-red-500/20'
                      : 'border-slate-700/50 bg-slate-800/30 hover:border-emerald-400/50 hover:bg-slate-800/50'
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-base">
                    {categoryEmoji(item.category, item.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-black text-white">
                      {item.name}
                    </span>
                    <span
                      className={`mt-0.5 block text-[9px] font-bold ${
                        isUrgent
                          ? 'text-red-400'
                          : state.key === 'fresh'
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                      }`}
                    >
                      {state.countdown}
                    </span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                </motion.button>
              );
            })
          )}
        </div>

        {topItems.length > 0 ? (
          <button
            type="button"
            onClick={() => onRecipe(topItems[0])}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[10px] font-black text-emerald-300 transition-all hover:bg-emerald-500/20 hover:text-emerald-200"
          >
            <ChefHat className="h-3 w-3" />
            Plan a rescue meal
          </button>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-900/60 backdrop-blur-xl p-5 text-white shadow-2xl shadow-emerald-950/20">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />

        <div className="relative z-10 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
            <Flame className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
              Household streak
            </p>
            <p className="text-xs font-black text-white">{wasteStreak}-day rescue run</p>
          </div>
        </div>

        <p className="relative mt-3 text-2xl font-black tracking-[-0.04em] text-white">
          {formatCurrency(moneySaved)}
        </p>
        <p className="relative mt-0.5 text-[9px] font-semibold text-slate-400">
          Rescued from the bin this month
        </p>

        <div className="relative mt-4">
          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">
            <span>Next badge</span>
            <span>{nextMilestone} days</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-300"
              style={{ width: `${Math.max(12, (wasteStreak / (wasteStreak + nextMilestone)) * 100)}%` }}
            />
          </div>
        </div>

        <div className="relative mt-3 rounded-xl border border-slate-700/50 bg-slate-800/30 px-3 py-2">
          <p className="text-[9px] font-medium leading-relaxed text-slate-400">
            Every item you cook before it expires keeps the streak alive and grows your savings.
          </p>
        </div>
      </div>
    </aside>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}