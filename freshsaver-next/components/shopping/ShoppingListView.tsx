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
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cream-50 p-5 shadow-[0_24px_70px_-52px_rgba(6,78,59,0.45)] sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-amber-200/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/80 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-700">
              <Sparkles className="h-2.5 w-2.5" />
              Auto-built from pantry signals
            </span>
            <h1 className="mt-2.5 text-2xl font-black leading-[1.05] tracking-[-0.045em] text-ink-950 sm:text-3xl">
              Smart shopping list
            </h1>
            <p className="mt-1.5 max-w-lg text-xs font-medium leading-relaxed text-ink-500 sm:text-sm">
              Low stock and expired items land here automatically. Check things off as you shop,
              or add anything else your household needs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button variant="outline" size="sm" onClick={() => void handleCopy()} className="bg-white/80">
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button size="sm" onClick={() => void handleShare()}>
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
                className="rounded-2xl border border-white/80 bg-white/75 px-3 py-2.5 shadow-sm backdrop-blur"
              >
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={`h-3 w-3 ${
                      stat.tone === 'emerald'
                        ? 'text-emerald-500'
                        : stat.tone === 'amber'
                          ? 'text-amber-500'
                          : 'text-ink-400'
                    }`}
                  />
                  <span className="text-[8px] font-black uppercase tracking-[0.1em] text-ink-400">
                    {stat.label}
                  </span>
                </div>
                <p className="mt-1 text-xl font-black tracking-[-0.04em] text-ink-950">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <QuickAddBar onAdd={handleAdd} />

      {error ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-coral-200 bg-coral-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
            <div>
              <p className="text-xs font-black text-coral-700">Shopping list sync paused</p>
              <p className="mt-0.5 text-[10px] font-medium text-coral-600/80">{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refresh();
              void refreshInventory();
            }}
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
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-600"
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
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-black text-emerald-900">Everything’s in the cart.</p>
            <p className="mt-0.5 text-[10px] font-medium text-emerald-700/70">
              Nice work. Clear the purchased items whenever you’re ready.
            </p>
          </div>
        </div>
      ) : null}

      {!loading && purchased.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_18px_50px_-42px_rgba(6,78,59,0.3)]">
          <div className="flex items-center gap-2.5 border-b border-ink-100 bg-ink-50/50 px-3 py-2.5 sm:px-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-xs font-black text-ink-800">In the cart</h2>
            <span className="rounded-full bg-white px-2 py-0.5 text-[8px] font-black text-ink-400">
              {purchased.length}
            </span>
            <button
              type="button"
              onClick={() => void handleClearPurchased()}
              className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-black text-ink-400 transition-colors hover:bg-coral-50 hover:text-coral-500"
            >
              <Trash2 className="h-2.5 w-2.5" />
              Clear purchased
            </button>
          </div>
          <div className="divide-y divide-ink-50">
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

      <div className="flex items-start gap-2.5 rounded-2xl border border-ink-100 bg-white/70 px-4 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-[10px] font-black text-ink-800">How auto-generation works</p>
          <p className="mt-0.5 text-[10px] font-medium leading-relaxed text-ink-400">
            FreshSaver adds an item when its pantry quantity reaches 1 or it expires. Check it off
            after shopping and it will disappear from the active list.
          </p>
        </div>
      </div>
    </div>
  );
}
