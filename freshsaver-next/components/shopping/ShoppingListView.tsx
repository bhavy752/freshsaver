'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ListChecks,
  RefreshCw,
  Share2,
  ShoppingBasket,
  Sparkles,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import type { GroceryItem } from '@/lib/types';
import { groupGroceryItems } from '@/lib/inventory';
import { useApp } from '@/components/providers/app-provider';
import { useInventory } from '@/hooks/use-inventory';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { QuickAddBar } from '@/components/shopping/QuickAddBar';
import { ShoppingGroup } from '@/components/shopping/ShoppingGroup';
import { ShoppingItemRow } from '@/components/shopping/ShoppingItemRow';
import { ShoppingListSkeleton } from '@/components/shopping/ShoppingListSkeleton';

function buildShoppingText(
  groups: ReturnType<typeof groupGroceryItems>,
  purchased: GroceryItem[]
): string {
  const lines: string[] = ['🛒 FreshSaver shopping list', ''];

  for (const group of groups) {
    lines.push(`${group.emoji} ${group.label}`);
    for (const item of group.items) {
      lines.push(`• ${item.item_name} — ${item.suggested_quantity} ${item.unit}`);
    }
    lines.push('');
  }

  if (purchased.length > 0) {
    lines.push('✅ Already in the cart');
    for (const item of purchased) {
      lines.push(`• ${item.item_name}`);
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

export function ShoppingListView() {
  const { demo, user, household } = useApp();
  const {
    items: inventory,
    categories,
    loading: inventoryLoading,
    error: inventoryError,
    refresh: refreshInventory,
  } = useInventory({
    demo,
    householdId: household.id,
    userId: user.id,
  });

  const {
    items,
    loading: listLoading,
    error: listError,
    addCustomItem,
    togglePurchased,
    removeItem,
    clearPurchased,
    refresh,
  } = useShoppingList({
    demo,
    householdId: household.id,
    inventory,
    categories,
  });

  const loading = inventoryLoading || listLoading;
  const error = inventoryError || listError;
  const unpurchased = items.filter((item) => !item.is_purchased);
  const purchased = items.filter((item) => item.is_purchased);
  const groups = groupGroceryItems(unpurchased);
  const autoAdded = items.filter((item) => item.auto_generated).length;

  async function handleAdd(name: string) {
    await addCustomItem(name);
    toast.success(`${name} added to your list.`);
  }

  async function handleToggle(item: GroceryItem) {
    try {
      await togglePurchased(item.id);
    } catch (toggleError) {
      toast.error(
        toggleError instanceof Error ? toggleError.message : 'Could not update the item.'
      );
    }
  }

  async function handleRemove(item: GroceryItem) {
    try {
      await removeItem(item.id);
      toast.success(`${item.item_name} removed.`);
    } catch (removeError) {
      toast.error(
        removeError instanceof Error ? removeError.message : 'Could not remove the item.'
      );
    }
  }

  async function handleClearPurchased() {
    try {
      await clearPurchased();
      toast.success('Purchased items cleared.');
    } catch (clearError) {
      toast.error(
        clearError instanceof Error ? clearError.message : 'Could not clear purchased items.'
      );
    }
  }

  async function handleCopy() {
    const text = buildShoppingText(groups, purchased);
    if (!text || (groups.length === 0 && purchased.length === 0)) {
      toast.info('Add something to your list first.');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Shopping list copied to clipboard.');
    } catch {
      toast.error('Could not copy the list.');
    }
  }

  async function handleShare() {
    const text = buildShoppingText(groups, purchased);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'FreshSaver shopping list', text });
        return;
      } catch (shareError) {
        if (shareError instanceof Error && shareError.name === 'AbortError') return;
      }
    }
    await handleCopy();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/60 via-emerald-950/20 to-slate-950 p-5 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-amber-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-300 backdrop-blur-md">
              <Sparkles className="h-2.5 w-2.5" />
              Auto-built from pantry signals
            </span>
            <h1 className="mt-2.5 text-2xl font-black leading-[1.05] tracking-[-0.045em] text-white sm:text-3xl">
              Smart shopping list
            </h1>
            <p className="mt-1.5 max-w-lg text-xs font-medium leading-relaxed text-slate-400 sm:text-sm">
              Low stock and expired items land here automatically. Check things off as you shop,
              or add anything else your household needs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button variant="outline" size="sm" onClick={() => void handleCopy()} className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-200">
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button size="sm" className="bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-300" onClick={() => void handleShare()}>
                <Share2 className="h-3.5 w-3.5" />
                Share list
              </Button>
            </motion.div>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-2">
          {[
            { label: 'To buy', value: unpurchased.length, icon: ListChecks, tone: 'emerald' },
            { label: 'In cart', value: purchased.length, icon: CheckCircle2, tone: 'ink' },
            { label: 'Auto-added', value: autoAdded, icon: Sparkles, tone: 'amber' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-emerald-500/20 bg-slate-800/50 px-3 py-2.5 shadow-lg shadow-emerald-950/10 backdrop-blur-sm"
              >
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={`h-3 w-3 ${
                      stat.tone === 'emerald'
                        ? 'text-emerald-400'
                        : stat.tone === 'amber'
                          ? 'text-amber-400'
                          : 'text-slate-400'
                    }`}
                  />
                  <span className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
                    {stat.label}
                  </span>
                </div>
                <p className="mt-1 text-xl font-black tracking-[-0.04em] text-white">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <QuickAddBar onAdd={handleAdd} />

      {error ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <div className="text-red-200">
              <p className="text-xs font-black">Shopping list sync paused</p>
              <p className="mt-0.5 text-[10px] font-medium opacity-80">{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refresh();
              void refreshInventory();
            }}
            className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:text-red-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      ) : null}

      {loading ? <ShoppingListSkeleton /> : null}

      {!loading && groups.length === 0 && purchased.length === 0 ? (
        <EmptyState
          icon={ShoppingBasket}
          title="Your list is empty"
          description="When pantry items drop to their last unit or pass their expiry date, FreshSaver adds them here automatically. You can also add anything manually above."
          action={
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-400"
            >
              Browse my pantry
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
      ) : null}

      {!loading && groups.length > 0 ? (
        <div className="space-y-3">
          {groups.map((group) => (
            <ShoppingGroup
              key={group.key}
              label={group.label}
              emoji={group.emoji}
              items={group.items}
              onToggle={(item) => void handleToggle(item)}
              onRemove={(item) => void handleRemove(item)}
            />
          ))}
        </div>
      ) : null}

      {!loading && groups.length === 0 && purchased.length > 0 ? (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-black text-white">Everything’s in the cart.</p>
            <p className="mt-0.5 text-[10px] font-medium text-emerald-300/70">
              Nice work. Clear the purchased items whenever you’re ready.
            </p>
          </div>
        </div>
      ) : null}

      {!loading && purchased.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/50 shadow-xl shadow-emerald-950/10">
          <div className="flex items-center gap-2.5 border-b border-slate-700 bg-slate-900/50 px-3 py-2.5 sm:px-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-700 text-emerald-400 shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-xs font-black text-white">In the cart</h2>
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[8px] font-black text-slate-300">
              {purchased.length}
            </span>
            <button
              type="button"
              onClick={() => void handleClearPurchased()}
              className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-black text-slate-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
            >
              <Trash2 className="h-2.5 w-2.5" />
              Clear purchased
            </button>
          </div>
          <div className="divide-y divide-slate-700">
            {purchased.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                onToggle={(entry) => void handleToggle(entry)}
                onRemove={(entry) => void handleRemove(entry)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/30 bg-slate-800/50 px-4 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-[10px] font-black text-white">How auto-generation works</p>
          <p className="mt-0.5 text-[10px] font-medium leading-relaxed text-slate-400">
            FreshSaver adds an item when its pantry quantity reaches 1 or it expires. Check it off
            after shopping and it will disappear from the active list.
          </p>
        </div>
      </div>
    </div>
  );
}