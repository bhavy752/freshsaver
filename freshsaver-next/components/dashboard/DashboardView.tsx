'use client';

import { useEffect, useState } from 'react';
import { Package, Radio, RefreshCw, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import type { CategoryFilter, ExpiryFilter, FoodItem } from '@/lib/types';
import type { FoodItemInput } from '@/services/foodItems';
import { computeMetrics, filterInventory } from '@/lib/inventory';
import { useApp } from '@/components/providers/app-provider';
import { useInventory } from '@/hooks/use-inventory';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricsBar } from '@/components/dashboard/MetricsBar';
import { InventoryFilters } from '@/components/dashboard/InventoryFilters';
import { InventoryGrid } from '@/components/dashboard/InventoryGrid';
import { RescueRail } from '@/components/dashboard/RescueRail';
import { AddItemModal } from '@/components/dashboard/AddItemModal';
import { RecipeIdeaModal } from '@/components/dashboard/RecipeIdeaModal';
import { ReceiptScannerModal } from '@/components/receipt/ReceiptScannerModal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';

export function DashboardView() {
  const { demo, user, profile, household } = useApp();
  const {
    items,
    categories,
    loading,
    error,
    addItem,
    addItems,
    deleteItem,
    consumeItem,
    refresh,
  } = useInventory({
    demo,
    householdId: household.id,
    userId: user.id,
  });

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [recipeItem, setRecipeItem] = useState<FoodItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FoodItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [cooking, setCooking] = useState(false);

  const metrics = computeMetrics(items, profile.money_saved);
  const activeItems = items.filter(
    (item) => item.status !== 'consumed' && item.status !== 'wasted'
  );
  const filteredItems = filterInventory(items, categoryFilter, expiryFilter);
  const hasFilters = categoryFilter !== 'all' || expiryFilter !== 'all';
  const firstName = user.fullName.split(' ')[0] || 'Friend';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('scan') === '1') setScanOpen(true);
    if (params.get('add') === '1') setAddOpen(true);
    if (params.toString()) {
      window.history.replaceState({}, '', '/dashboard');
    }

    const openAdd = () => setAddOpen(true);
    const openScan = () => setScanOpen(true);
    window.addEventListener('freshsaver:add-item', openAdd);
    window.addEventListener('freshsaver:scan-receipt', openScan);
    return () => {
      window.removeEventListener('freshsaver:add-item', openAdd);
      window.removeEventListener('freshsaver:scan-receipt', openScan);
    };
  }, []);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setAddOpen(true);
      }
      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        setScanOpen(true);
      }
    }

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  async function handleAdd(input: FoodItemInput): Promise<FoodItem> {
    return addItem(input);
  }

  async function handleImport(inputs: FoodItemInput[]): Promise<FoodItem[]> {
    return addItems(inputs);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteItem(deleteTarget.id);
      toast.success(`${deleteTarget.name} removed from your pantry.`);
      setDeleteTarget(null);
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : 'Could not remove the item.'
      );
    } finally {
      setDeleting(false);
    }
  }

  async function handleCook(item: FoodItem) {
    setCooking(true);
    try {
      await consumeItem(item.id);
      toast.success(`Rescued ${item.name.toLowerCase()} — nice work.`);
      setRecipeItem(null);
    } catch (cookError) {
      toast.error(
        cookError instanceof Error ? cookError.message : 'Could not update the item.'
      );
    } finally {
      setCooking(false);
    }
  }

  function clearFilters() {
    setCategoryFilter('all');
    setExpiryFilter('all');
  }

  return (
    <div className="space-y-5">
      <DashboardHeader
        firstName={firstName}
        metrics={metrics}
        wasteStreak={profile.waste_streak}
        onAdd={() => setAddOpen(true)}
        onScan={() => setScanOpen(true)}
      />

      {error ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-coral-200 bg-coral-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
            <div>
              <p className="text-xs font-black text-coral-700">Inventory sync paused</p>
              <p className="mt-0.5 text-[10px] font-medium text-coral-600/80">{error}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      ) : null}

      <MetricsBar metrics={metrics} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="min-w-0">
          <div className="rounded-2xl border border-ink-100 bg-white/65 p-3 shadow-[0_18px_50px_-40px_rgba(6,78,59,0.3)] backdrop-blur-sm sm:p-4">
            <div className="flex flex-col gap-2 border-b border-ink-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Package className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-black tracking-[-0.02em] text-ink-950">
                    Pantry inventory
                  </h2>
                  <p className="text-[10px] font-semibold text-ink-400">
                    {activeItems.length} items tracked · updated live
                  </p>
                </div>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-700">
                <Radio className="h-2.5 w-2.5" />
                Real-time
              </span>
            </div>

            <div className="mt-3">
              <InventoryFilters
                items={items}
                category={categoryFilter}
                expiry={expiryFilter}
                onCategoryChange={setCategoryFilter}
                onExpiryChange={setExpiryFilter}
              />
            </div>

            <div className="mt-4">
              <InventoryGrid
                items={filteredItems}
                totalItems={activeItems.length}
                loading={loading}
                hasFilters={hasFilters}
                onClearFilters={clearFilters}
                onAdd={() => setAddOpen(true)}
                onScan={() => setScanOpen(true)}
                onRecipe={setRecipeItem}
                onDelete={setDeleteTarget}
              />
            </div>
          </div>
        </section>

        <RescueRail
          items={items}
          moneySaved={profile.money_saved}
          wasteStreak={profile.waste_streak}
          onRecipe={setRecipeItem}
        />
      </div>

      <p className="text-center text-[9px] font-semibold text-ink-300">
        Shortcuts: press <span className="font-black text-ink-400">N</span> to add an item ·{' '}
        <span className="font-black text-ink-400">S</span> to scan a receipt
      </p>

      <AddItemModal
        open={addOpen}
        categories={categories}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
      />

      <ReceiptScannerModal
        open={scanOpen}
        categories={categories}
        onClose={() => setScanOpen(false)}
        onImport={handleImport}
      />

      <RecipeIdeaModal
        item={recipeItem}
        cooking={cooking}
        onClose={() => setRecipeItem(null)}
        onCook={handleCook}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Remove ${deleteTarget?.name ?? 'this item'}?`}
        description="This removes it from your shared pantry. It won’t affect your money-saved total, but it can’t be undone."
        confirmLabel="Remove item"
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
