'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import {
  ChefHat,
  Clock3,
  Package,
  Refrigerator,
  Snowflake,
  Trash2,
} from 'lucide-react';
import type { FoodItem } from '@/lib/types';
import { categoryEmoji, getExpiryState } from '@/lib/inventory';
import { cn, formatCurrency, pluralize } from '@/lib/utils';

const storageMeta = {
  fridge: { label: 'Fridge', icon: Refrigerator },
  freezer: { label: 'Freezer', icon: Snowflake },
  pantry: { label: 'Pantry', icon: Package },
} as const;

interface InventoryItemCardProps {
  item: FoodItem;
  onRecipe: (item: FoodItem) => void;
  onDelete: (item: FoodItem) => void;
}

export const InventoryItemCard = forwardRef<HTMLElement, InventoryItemCardProps>(
  function InventoryItemCard({ item, onRecipe, onDelete }, ref) {
    const state = getExpiryState(item);
    const storage = storageMeta[item.storage_location] ?? storageMeta.pantry;
    const StorageIcon = storage.icon;

    const created = new Date(item.created_at).getTime();
    const expires = new Date(item.expires_at).getTime();
    const total = Math.max(expires - created, 1);
    const remaining = Math.max(expires - Date.now(), 0);
    const freshness = Math.max(0, Math.min(100, Math.round((remaining / total) * 100)));

    return (
      <motion.article
        ref={ref}
        layout
        initial={{ opacity: 0, y: 14, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -3 }}
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-2xl border bg-slate-900/60 backdrop-blur-xl p-4 shadow-xl shadow-emerald-950/10 transition-all duration-300',
          state.key === 'expired'
            ? 'border-red-500/30 bg-red-500/10 hover:border-red-500/50 hover:bg-red-500/20'
            : state.key === 'critical' || state.key === 'soon'
              ? 'border-amber-500/30 bg-amber-500/10 hover:border-amber-500/50 hover:bg-amber-500/20'
              : 'border-emerald-500/20 hover:border-emerald-500/40'
        )}
      >
        <div
          className={cn(
            'absolute inset-x-0 top-0 h-1 transition-colors',
            state.key === 'expired'
              ? 'bg-red-500'
              : state.key === 'critical' || state.key === 'soon'
                ? 'bg-amber-500'
                : 'bg-emerald-400'
          )}
        />

        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/25">
            {categoryEmoji(item.category, item.name)}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-black tracking-[-0.02em] text-white">
              {item.name}
            </h3>
            <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">
              {item.category?.name ?? 'Uncategorized'}
            </p>
          </div>
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em]',
              state.badgeClass
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', state.dotClass)} />
            {state.label}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-3 text-[10px] font-semibold text-slate-400">
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1">
            {pluralize(item.quantity, item.unit === 'pcs' ? 'pc' : item.unit, item.unit)}
          </span>
          <span className="inline-flex items-center gap-1">
            <StorageIcon className="h-3 w-3 text-slate-500" />
            {storage.label}
          </span>
          {item.estimated_cost ? (
            <span className="ml-auto text-[10px] font-black text-slate-300">
              {formatCurrency(item.estimated_cost)}
            </span>
          ) : null}
        </div>

        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
            <div
              className={cn('h-full rounded-full transition-[width] duration-700', state.barClass)}
              style={{ width: `${freshness}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400">
              <Clock3 className="h-2.5 w-2.5" />
              {state.countdown}
            </span>
            {item.quantity <= 1 ? (
              <span className="rounded-full bg-amber-900/30 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.08em] text-amber-400">
                Low stock
              </span>
            ) : (
              <span className="text-[9px] font-semibold text-slate-500">
                {item.original_quantity && item.original_quantity > item.quantity
                  ? `${item.quantity} of ${item.original_quantity} left`
                  : 'Stocked'}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 border-t border-slate-700 pt-3">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex-1"
          >
            <button
              type="button"
              onClick={() => onRecipe(item)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-2 text-[10px] font-black text-emerald-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-300"
            >
              <ChefHat className="h-3 w-3" />
              Use recipe
            </button>
          </motion.div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => onDelete(item)}
            aria-label={`Delete ${item.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition-colors hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </motion.article>
    );
  }
);