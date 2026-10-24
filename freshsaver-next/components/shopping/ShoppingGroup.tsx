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
    <section className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_18px_50px_-42px_rgba(6,78,59,0.35)]">
      <div className="flex items-center gap-2.5 border-b border-ink-100 bg-gradient-to-r from-cream-50 to-white px-3 py-2.5 sm:px-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-base shadow-sm">
          {emoji}
        </span>
        <h2 className="text-xs font-black tracking-[-0.01em] text-ink-900">{label}</h2>
        <span className="ml-auto rounded-full bg-ink-100 px-2 py-0.5 text-[8px] font-black text-ink-500">
          {items.length}
        </span>
      </div>
      <div className="divide-y divide-ink-50">
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
