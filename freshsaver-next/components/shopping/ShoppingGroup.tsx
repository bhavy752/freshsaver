'use client';

import type { GroceryItem } from '@/lib/types';
import { ShoppingItemRow } from '@/components/shopping/ShoppingItemRow';

interface ShoppingGroupProps {
  label: string;
  emoji: string;
  items: GroceryItem[];
  onToggle: (item: GroceryItem) => void;
  onRemove: (item: GroceryItem) => void;
}

export function ShoppingGroup({ label, emoji, items, onToggle, onRemove }: ShoppingGroupProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/50 shadow-xl shadow-emerald-950/10 backdrop-blur-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-700 bg-slate-900/40 px-3 py-2.5 sm:px-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-700 text-emerald-400 shadow-sm">
          {emoji}
        </span>
        <h2 className="text-xs font-black tracking-[-0.01em] text-white">{label}</h2>
        <span className="ml-auto rounded-full bg-slate-700 px-2 py-0.5 text-[8px] font-black text-white">
          {items.length}
        </span>
      </div>
      <div className="divide-y divide-slate-700">
        {items.map((item) => (
          <ShoppingItemRow
            key={item.id}
            item={item}
            onToggle={onToggle}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  );
}