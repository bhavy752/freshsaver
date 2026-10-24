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
          'group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-4 shadow-[0_16px_46px_-38px_rgba(6,78,59,0.4)] transition-shadow hover:shadow-[0_24px_60px_-36px_rgba(6,78,59,0.35)]',
          state.key === 'expired'
            ? 'border-coral-200'
            : state.key === 'fresh'
              ? 'border-ink-100'
              : 'border-amber-200'
        )}
      >
        <div
          className={cn(
            'absolute inset-x-0 top-0 h-1',
            state.key === 'expired'
              ? 'bg-coral-400'
              : state.key === 'fresh'
                ? 'bg-emerald-400'
                : 'bg-amber-400'
          )}
        />

        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream-100 text-xl">
            {categoryEmoji(item.category, item.name)}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-black tracking-[-0.02em] text-ink-950">
              {item.name}
            </h3>
            <p className="mt-0.5 truncate text-[10px] font-semibold text-ink-400">
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

        <div className="mt-3 flex items-center gap-3 text-[10px] font-semibold text-ink-500">
          <span className="inline-flex items-center gap-1 rounded-lg bg-ink-50 px-2 py-1">
            {pluralize(item.quantity, item.unit === 'pcs' ? 'pc' : item.unit, item.unit)}
          </span>
          <span className="inline-flex items-center gap-1">
            <StorageIcon className="h-3 w-3 text-ink-300" />
            {storage.label}
          </span>
          {item.estimated_cost ? (
            <span className="ml-auto text-[10px] font-black text-ink-700">
              {formatCurrency(item.estimated_cost)}
            </span>
          ) : null}
        </div>

        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
            <div
              className={cn('h-full rounded-full transition-[width] duration-700', state.barClass)}
              style={{ width: `${freshness}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-ink-400">
              <Clock3 className="h-2.5 w-2.5" />
              {state.countdown}
            </span>
            {item.quantity <= 1 ? (
              <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.08em] text-amber-700">
                Low stock
              </span>
            ) : (
              <span className="text-[9px] font-semibold text-ink-300">
                {item.original_quantity && item.original_quantity > item.quantity
                  ? `${item.quantity} of ${item.original_quantity} left`
                  : 'Stocked'}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 border-t border-ink-100 pt-3">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex-1"
          >
            <button
              type="button"
              onClick={() => onRecipe(item)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-2 text-[10px] font-black text-emerald-700 transition-colors hover:bg-emerald-100"
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
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-100 text-ink-400 transition-colors hover:border-coral-200 hover:bg-coral-50 hover:text-coral-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </motion.article>
    );
  }
);
