'use client';

import { useEffect, useState } from 'react';
import {
  Package,
  Radio,
  RefreshCw,
  TriangleAlert,
  Flame,
  DollarSign,
  Leaf,
  Plus,
  ScanLine,
  Search,
  Bell,
  User,
  ChevronDown,
  ArrowRight,
  Settings,
  LogOut,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import type { CategoryFilter, ExpiryFilter, FoodItem } from '@/lib/types';
import type { FoodItemInput } from '@/services/foodItems';
import { computeMetrics, filterInventory } from '@/lib/inventory';
import { cn, formatCurrency, pluralize } from '@/lib/utils';
import { useApp } from '@/components/providers/app-provider';
import { useInventory } from '@/hooks/use-inventory';
import { InventoryFilters } from '@/components/dashboard/InventoryFilters';
import { InventoryGrid } from '@/components/dashboard/InventoryGrid';
import { RescueRail } from '@/components/dashboard/RescueRail';
import { AddItemModal } from '@/components/dashboard/AddItemModal';
import { RecipeIdeaModal } from '@/components/dashboard/RecipeIdeaModal';
import { ReceiptScannerModal } from '@/components/receipt/ReceiptScannerModal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardTab {
  id: string;
  label: string;
  icon: React.ElementType;
}

const DASHBOARD_TABS: DashboardTab[] = [
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'scan', label: 'Scan', icon: ScanLine },
  { id: 'recipes', label: 'Recipes', icon: ArrowRight },
  { id: 'grocery', label: 'Grocery', icon: ShoppingBasketIcon },
];

function ShoppingBasketIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.5 4h7l1.1 2.2c0.3 0.6 0.9 1 1.6 1h5.6c0.7 0 1.3-0.4 1.6-1l1.1-2.2h7l-0.7 1.4c-0.2 0.4-0.5 0.7-0.9 0.9l-2 1c-0.7 0.4-1.4 0.6-2.2 0.6H4.1c-0.8 0-1.5-0.2-2.1-0.7l-2-1c-0.4-0.5-0.7-1.1-0.7-1.8V4z" />
    </svg>
  );
}

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
  const [activeTab, setActiveTab] = useState('inventory');
  const [householdMenuOpen, setHouseholdMenuOpen] = useState(false);

  const metrics = computeMetrics(items, profile.money_saved);
  const activeItems = items.filter(
    (item) => item.status !== 'consumed' && item.status !== 'wasted'
  );
  const filteredItems = filterInventory(items, categoryFilter, expiryFilter);
  const hasFilters = categoryFilter !== 'all' || expiryFilter !== 'all';
  const firstName = user.fullName.split(' ')[0] || 'Friend';

  const pantryHealthScore = Math.min(
    100,
    Math.round(
      (activeItems.filter((i) => i.status === 'fresh').length /
        Math.max(activeItems.length, 1)) *
        100
    )
  );

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
    <div className="min-h-screen bg-slate-950 text-white p-6 space-y-8">
      {/* Glassmorphic Topbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between gap-3 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-emerald-500/20 p-3 sm:p-4 shadow-2xl shadow-emerald-950/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/30">
            <Package className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-tight text-white">FreshSaver</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400/80">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              {household.name} • Synced
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all border border-white/5"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
          <div
            className="relative inline-block"
            onMouseEnter={() => setHouseholdMenuOpen(true)}
            onMouseLeave={() => setHouseholdMenuOpen(false)}
          >
            <div className="flex items-center gap-2 rounded-full bg-slate-800/50 border border-emerald-500/30 px-3 py-1.5 backdrop-blur-md cursor-pointer group">
              <div className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-emerald-500/40 group-hover:scale-110 transition-transform">
                {firstName[0]}
              </div>
              <span className="text-xs font-bold text-slate-300 group-hover:text-emerald-200 transition-colors">
                {firstName}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            {householdMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-emerald-500/20 p-2 shadow-2xl shadow-emerald-950/30 z-50 animate-in fade-in slide-in-from-top-2"
              >
                <Button
                  variant="ghost"
                  className="w-full justify-between text-sm font-medium text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-200 px-3 py-2 rounded-xl"
                  onClick={() => setHouseholdMenuOpen(false)}
                >
                  Switch household
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-between text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 px-3 py-2 rounded-xl mt-1"
                  onClick={() => {
                    setHouseholdMenuOpen(false);
                    toast.success('Signed out.');
                  }}
                >
                  Sign out
                  <LogOut className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </div>
          <Button
            onClick={() => setScanOpen(true)}
            className="rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-slate-950 font-black shadow-[0_0_25px_rgba(52,211,153,0.5)] transition-all hover:shadow-[0_0_35px_rgba(52,211,153,0.7)] hover:scale-105 active:scale-95"
          >
            <ScanLine className="h-4 w-4 mr-2" />
            + Scan Receipt
          </Button>
        </div>
      </header>

      {/* Welcome & Impact Ticker */}
      <section className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-2 space-y-2">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-black tracking-tight text-white"
          >
            Good morning, {firstName}.
          </motion.h2>
          <p className="text-slate-400 font-medium">
            {metrics.expiringSoon} items need a rescue plan today. You&apos;ve saved{' '}
            <span className="text-emerald-400 font-bold">${metrics.moneySaved}</span> so far.
          </p>
        </div>

        {/* Impact Cards */}
        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 p-4 shadow-2xl shadow-emerald-950/20 transition-all hover:border-emerald-500/40">
            <Flame className="h-5 w-5 text-orange-500 mb-2" />
            <span className="text-xl font-black text-white">{profile.waste_streak}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Streak</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 p-4 shadow-2xl shadow-emerald-950/20 transition-all hover:border-emerald-500/40">
            <DollarSign className="h-5 w-5 text-emerald-400 mb-2" />
            <span className="text-xl font-black text-white">${metrics.moneySaved}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Saved</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 p-4 shadow-2xl shadow-emerald-950/20 transition-all hover:border-emerald-500/40">
            <Leaf className="h-5 w-5 text-lime-400 mb-2" />
            <span className="text-xl font-black text-white">{activeItems.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rescued</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 p-4 shadow-2xl shadow-emerald-950/20 transition-all hover:border-emerald-500/40">
            <Activity className="h-5 w-5 text-emerald-300 mb-2" />
            <span className="text-xl font-black text-white">{pantryHealthScore}%</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Health</span>
          </div>
        </div>
      </section>

      {/* Floating Navigation Pill */}
      <nav className="mx-auto flex items-center gap-1 p-1 rounded-full bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 w-fit shadow-2xl shadow-emerald-950/20">
        {DASHBOARD_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-full px-4 py-2 text-xs font-bold transition-all',
                isActive
                  ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/20'
              )}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
              <span className="ml-1">{tab.label}</span>
            </Button>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <div className="grid gap-8 lg:grid-cols-[1fr_26rem]">
        <div className="space-y-6">
          {error ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <div className="text-red-200">
                  <p className="text-xs font-black">Inventory sync paused</p>
                  <p className="mt-0.5 text-[10px] font-medium opacity-80">{error}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => void refresh()} className="bg-transparent border-red-500/30 text-red-200 hover:bg-red-500/20">
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Retry
              </Button>
            </div>
          ) : null}

          <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/40 backdrop-blur-md p-4 sm:p-6 shadow-2xl shadow-emerald-950/20">
            <div className="flex flex-col gap-4 border-b border-emerald-500/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-white">Pantry Inventory</h2>
                  <p className="text-xs font-medium text-slate-400">
                    {activeItems.length} items tracked · <span className="text-emerald-400">Real-time sync</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddOpen(true)}
                  className="rounded-xl border-emerald-500/30 bg-transparent text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-200 transition-all"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mt-5 rounded-xl border border-emerald-500/20 bg-slate-900/60 backdrop-blur-md pl-8 pr-4 py-3 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-400 transition-all">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400/50" />
              <input
                type="text"
                placeholder="Search pantry items…"
                className="w-full bg-transparent text-sm font-medium text-slate-200 outline-none placeholder-slate-500/60"
              />
            </div>

            <div className="mt-6">
              <InventoryFilters
                items={items}
                category={categoryFilter}
                expiry={expiryFilter}
                onCategoryChange={setCategoryFilter}
                onExpiryChange={setExpiryFilter}
              />
            </div>

            <div className="mt-6">
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
        </div>

        <div className="space-y-6">
          <RescueRail
            items={items}
            moneySaved={profile.money_saved}
            wasteStreak={profile.waste_streak}
            onRecipe={setRecipeItem}
          />

          <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/40 backdrop-blur-md p-6 shadow-2xl shadow-emerald-950/20 relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-lg font-black mb-2 text-white">Waste-Free Pro</h3>
              <p className="text-sm text-emerald-200/70 mb-4 opacity-90">
                Unlock advanced AI nutrition tracking and unlimited household members.
              </p>
              <Button className="w-full bg-white text-emerald-900 font-black hover:bg-emerald-50 transition-all">
                Upgrade Now
              </Button>
            </div>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 text-white/10 rotate-12 group-hover:rotate-0 transition-transform duration-500">
              <Leaf className="h-24 w-24" />
            </div>
          </div>
        </div>
      </div>

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