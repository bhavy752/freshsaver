'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles, Trash2 } from 'lucide-react';
import type { GroceryItem } from '@/lib/types';
import { categoryEmoji } from '@/lib/inventory';
import { cn } from '@/lib/utils';

interface ShoppingItemRowProps {
  item: GroceryItem;
  onToggle: (item: GroceryItem) => void;
  onRemove: (item: GroceryItem) => void;
}

export function ShoppingItemRow({ item, onToggle, onRemove }: ShoppingItemRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.22 }}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 transition-colors sm:px-4',
        item.is_purchased ? 'bg-slate-900/30' : 'hover:bg-emerald-500/10'
      )}
    >
      <motion.button
        type="button"
        whileTap={{ scale: 0.86 }}
        onClick={() => onToggle(item)}
        aria-label={item.is_purchased ? `Move ${item.item_name} back to list` : `Check off ${item.item_name}`}
        aria-pressed={item.is_purchased}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all',
          item.is_purchased
            ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
            : 'border-slate-600 bg-slate-800 text-transparent hover:border-emerald-400'
        )}
      >
        <motion.span
          initial={false}
          animate={{ scale: item.is_purchased ? 1 : 0.6, opacity: item.is_purchased ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <Check className="h-3.5 w-3.5" />
        </motion.span>
      </motion.button>

      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-emerald-400">
        {categoryEmoji(null, item.category_name ?? item.item_name)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p
            className={cn(
              'truncate text-xs font-black transition-colors',
              item.is_purchased ? 'text-slate-500 line-through' : 'text-white'
            )}
          >
            {item.item_name}
          </p>
          {item.auto_generated ? (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.08em] text-emerald-300">
              <Sparkles className="h-2 w-2" />
              Auto
            </span>
          ) : null}
        </div>
        <p className={cn('mt-0.5 text-[9px] font-semibold', item.is_purchased ? 'text-slate-500' : 'text-slate-400')}>
          {item.suggested_quantity} {item.unit} · {item.category_name ?? 'Pantry'}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onRemove(item)}
        aria-label={`Remove ${item.item_name}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 opacity-60 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}