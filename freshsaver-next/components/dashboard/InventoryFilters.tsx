'use client';

import type { CategoryFilter, ExpiryFilter, FoodItem } from '@/lib/types';
import { CATEGORY_FILTERS, getExpiryState } from '@/lib/inventory';
import { cn } from '@/lib/utils';

interface InventoryFiltersProps {
  items: FoodItem[];
  category: CategoryFilter;
  expiry: ExpiryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  onExpiryChange: (expiry: ExpiryFilter) => void;
}

export function InventoryFilters({
  items,
  category,
  expiry,
  onCategoryChange,
  onExpiryChange,
}: InventoryFiltersProps) {
  const activeItems = items.filter(
    (item) => item.status !== 'consumed' && item.status !== 'wasted'
  );
  const now = new Date();
  const freshCount = activeItems.filter((item) => getExpiryState(item, now).key === 'fresh').length;
  const soonCount = activeItems.filter((item) => {
    const state = getExpiryState(item, now).key;
    return state === 'critical' || state === 'soon';
  }).length;
  const expiredCount = activeItems.filter(
    (item) => getExpiryState(item, now).key === 'expired'
  ).length;

  const expiryOptions: Array<{ key: ExpiryFilter; label: string; count: number }> = [
    { key: 'all', label: 'All', count: activeItems.length },
    { key: 'fresh', label: 'Fresh', count: freshCount },
    { key: 'soon', label: 'Expiring', count: soonCount },
    { key: 'expired', label: 'Expired', count: expiredCount },
  ];

  return (
    <div className="space-y-3">
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {CATEGORY_FILTERS.map((filter) => {
          const active = category === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => onCategoryChange(filter.key)}
              aria-pressed={active}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-bold transition-all',
                active
                  ? 'border-emerald-400 bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-emerald-400/50 hover:text-emerald-300'
              )}
            >
              <span aria-hidden="true">{filter.emoji}</span>
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-xl border border-slate-700 bg-slate-800/50 p-1 backdrop-blur-md">
          {expiryOptions.map((option) => {
            const active = expiry === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onExpiryChange(option.key)}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all sm:px-3',
                  active
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-700/50 hover:text-slate-200'
                )}
              >
                {option.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[8px] font-black',
                    active ? 'bg-emerald-400 text-slate-950' : 'bg-slate-700 text-slate-400'
                  )}
                >
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-[10px] font-semibold text-slate-500">
          Sorted by what needs rescuing first
        </p>
      </div>
    </div>
  );
}