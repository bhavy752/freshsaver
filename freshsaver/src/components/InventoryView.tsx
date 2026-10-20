import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, X, Package, Flame, TrendingUp, Barcode } from 'lucide-react';
import { toast } from 'sonner';
import type { FoodItem, Category, FoodItemStatus, StorageLocation } from '@/types';
import { daysUntil, getUrgency, sortByUrgency, freshnessPercent } from '@/utils';
import { getCategoryVisuals, getExpiryVisuals, getExpiryStatus, getStorageVisuals } from '@/utils/foodEmojis';
import { AddItemModal } from '@/components/AddItemModal';
import { ScanView } from '@/components/ScanView';
import { SkeletonCard } from '@/components/Skeleton';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { updateProfileMoneySaved } from '@/services/profiles';
import { useAuth } from '@/context/AuthContext';

interface InventoryViewProps {
  items: FoodItem[];
  categories: Category[];
  streak: number;
  loading?: boolean;
  onAddItem: (item: {
    name: string; category_id: string | null; quantity: number;
    unit: FoodItem['unit']; expires_at: string; storage_location: StorageLocation;
  }) => Promise<void>;
  onUpdateStatus: (id: string, status: FoodItemStatus) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onScanBarcode?: () => void;
}

type FilterType = 'all' | 'urgency' | 'location';

const TABS: { key: string; label: string; emoji: string; filterType: FilterType; location?: StorageLocation }[] = [
  { key: 'all', label: 'All', emoji: '🍱', filterType: 'all' },
  { key: 'critical', label: 'Urgent', emoji: '⏰', filterType: 'urgency' },
  { key: 'fridge', label: 'Fridge', emoji: '🧊', filterType: 'location', location: 'fridge' },
  { key: 'pantry', label: 'Pantry', emoji: '📦', filterType: 'location', location: 'pantry' },
  { key: 'freezer', label: 'Freezer', emoji: '❄️', filterType: 'location', location: 'freezer' },
];

/** Items still in the pantry — tolerate both the DB `active` flag and legacy values. */
const ACTIVE_STATUSES: FoodItemStatus[] = ['active', 'fresh', 'expiring', 'expired'];

const SKELETON_COUNT = 6;

export function InventoryView({ items, categories, streak, loading = false, onAddItem, onUpdateStatus, onDeleteItem }: InventoryViewProps) {
  const { user } = useAuth();
  const userId = user?.id;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanView, setShowScanView] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);

  const activeItems = useMemo(
    () => items.filter((i) => ACTIVE_STATUSES.includes(i.status)),
    [items]
  );

  const counts = useMemo(() => ({
    all: activeItems.length,
    critical: activeItems.filter((i) => getUrgency(daysUntil(i.expires_at)) === 'critical').length,
    fridge: activeItems.filter((i) => i.storage_location === 'fridge').length,
    pantry: activeItems.filter((i) => i.storage_location === 'pantry').length,
    freezer: activeItems.filter((i) => i.storage_location === 'freezer').length,
  }), [activeItems]);

  const filtered = useMemo(() => {
    let result = [...activeItems];
    const tab = TABS.find((t) => t.key === activeTab);
    if (tab?.filterType === 'urgency') {
      result = result.filter((i) => getUrgency(daysUntil(i.expires_at)) === 'critical');
    } else if (tab?.filterType === 'location') {
      result = result.filter((i) => i.storage_location === tab.location);
    }
    return sortByUrgency(result);
  }, [activeItems, activeTab]);

  const handleConsumed = async (id: string) => {
    const item = filtered.find((i) => i.id === id);
    const cost = item?.estimated_cost ?? 0;

    setRemovingIds((prev) => new Set(prev).add(id));
    try {
      await onUpdateStatus(id, 'consumed');

      // Increment money saved in profile (non-blocking if the RPC is unavailable)
      if (userId && cost > 0) {
        try {
          await updateProfileMoneySaved(userId, cost);
        } catch {
          // The status update already succeeded; don't surface a misleading error.
        }
      }

      toast.success(`Saved $${cost.toFixed(2)} by consuming ${item?.name ?? 'item'}! 🥗`);
    } catch {
      toast.error('Failed to mark as consumed');
    } finally {
      setTimeout(() => {
        setRemovingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      }, 400);
    }
  };

  const handleWasted = async (id: string) => {
    const item = filtered.find((i) => i.id === id);
    setRemovingIds((prev) => new Set(prev).add(id));

    try {
      await onUpdateStatus(id, 'wasted');

      if (item) {
        toast(`Wasted ${item.name}. Add it back to your shopping list?`, {
          action: {
            label: 'Add Back',
            onClick: async () => {
              try {
                await onAddItem({
                  name: item.name,
                  category_id: item.category_id,
                  quantity: item.original_quantity ?? item.quantity,
                  unit: item.unit,
                  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                  storage_location: item.storage_location,
                });
                toast.success('Added back to inventory');
              } catch {
                toast.error('Could not add item back');
              }
            }
          }
        });
      }
    } catch {
      toast.error('Failed to mark as wasted');
    } finally {
      setTimeout(() => {
        setRemovingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      }, 400);
    }
  };

  if (showScanView) {
    return (
      <div className="pt-2">
        <div className="px-5 lg:px-0 mb-2">
          <button
            onClick={() => setShowScanView(false)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white border-2 border-emerald-100 px-3 py-2 text-xs font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all duration-200"
          >
            ← Back to inventory
          </button>
        </div>
        <ScanView
          categories={categories}
          onAddItems={async (payloads) => {
            for (const payload of payloads) {
              await onAddItem(payload);
            }
            setShowScanView(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="px-5 py-4 lg:px-0 lg:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Your Inventory 🍱</h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Colour-coded by freshness — rescue the amber ones first!</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScanView(true)}
            className="flex items-center gap-2 rounded-2xl bg-sky-50 text-sky-700 text-sm font-bold px-4 py-2.5 hover:bg-sky-100 hover:scale-[1.02] active:scale-95 transition-all duration-200 border-2 border-sky-200 shadow-sm"
          >
            <Barcode className="w-4 h-4" strokeWidth={2.5} />
            Scan Barcode
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold px-4 py-2.5 hover:from-emerald-600 hover:to-emerald-700 hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-md shadow-emerald-200">
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add Item
          </button>
        </div>
      </div>

      {/* Streak badge */}
      {streak > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border-2 border-amber-200 px-4 py-3 mb-4 hover:scale-[1.01] transition-all duration-200"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-100 shrink-0 animate-pulse-soft">
            <Flame className="w-5 h-5 text-amber-500" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-amber-700">{streak}-day zero-waste streak! 🔥</p>
            <p className="text-xs text-amber-600 font-medium">Keep it up to earn more streak badges</p>
          </div>
          <TrendingUp className="w-5 h-5 text-amber-400" strokeWidth={2.5} />
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 lg:gap-3">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = counts[tab.key as keyof typeof counts] ?? 0;
          const accent = tab.key === 'critical'
            ? 'bg-coral-50 border-coral-200 text-coral-700'
            : tab.key === 'fridge'
            ? 'bg-sky-50 border-sky-200 text-sky-700'
            : tab.key === 'pantry'
            ? 'bg-amber-50 border-amber-200 text-amber-700'
            : tab.key === 'freezer'
            ? 'bg-cyan-50 border-cyan-200 text-cyan-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700';

          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                aria-pressed={isActive}
                className={`flex-shrink-0 flex flex-col items-center gap-1 rounded-2xl py-2.5 px-4 border-2 transition-all duration-200 active:scale-95 ${
                  isActive ? `${accent} shadow-md scale-[1.02]` : 'bg-white text-slate-500 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50'
                }`}>
              <span className="flex items-center gap-1 text-sm font-bold">
                <span className="text-base leading-none">{tab.emoji}</span>
                {tab.label}
              </span>
              <span className={`text-xs font-bold ${isActive ? '' : 'text-slate-400'} opacity-80`}>
                {count} {count === 1 ? 'item' : 'items'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Items grid: skeleton loaders during loading, empty state, or populated list */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 pb-8 sm:grid-cols-2 xl:grid-cols-3 lg:gap-4">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonCard key={i} className="h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex flex-col items-center justify-center py-12 lg:py-20 text-center"
        >
          {/* Colourful empty-state illustration */}
          <div className="relative w-44 h-32 mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-200/60 via-amber-200/50 to-rose-200/60 blur-2xl" />
            {['🍎', '🥛', '🍞', '🥑', '🥦'].map((emoji, i) => (
              <motion.span
                key={emoji}
                className={`absolute ${['left-1 top-6', 'left-14 top-0', 'right-6 top-4', 'left-6 bottom-0', 'right-0 bottom-2'][i]} flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-md shadow-emerald-100 border border-emerald-100 text-2xl`}
                animate={{ y: [0, i % 2 === 0 ? -6 : 6, 0] }}
                transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
              >
                {emoji}
              </motion.span>
            ))}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-200">
              <Package className="w-7 h-7" strokeWidth={2.2} />
            </div>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mb-1">
            {activeTab === 'critical' ? 'Everything is fresh! 🌿' : `${TABS.find((t) => t.key === activeTab)?.emoji ?? '🍱'} Nothing here yet`}
          </h3>
          <p className="text-sm text-slate-500 max-w-xs mt-1">
            {activeTab === 'critical'
              ? 'Great news — no items are nearing expiry right now.'
              : 'Items will appear here as they are added to your inventory.'}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowScanView(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 text-white font-bold py-2.5 px-6 hover:from-sky-600 hover:to-sky-700 hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-md shadow-sky-200"
            >
              <Barcode className="w-4 h-4" strokeWidth={2.5} />
              Scan a Barcode
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-emerald-200 text-emerald-700 font-bold py-2.5 px-6 hover:bg-emerald-50 hover:scale-[1.02] active:scale-95 transition-all duration-200"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Add Item Manually
            </button>
          </div>
          {activeTab !== 'critical' && activeItems.length > 0 && (
            <button
              onClick={() => setActiveTab('critical')}
              className="mt-6 text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors"
            >
              View urgent items instead ⏰
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-3 pb-8 sm:grid-cols-2 xl:grid-cols-3 lg:gap-4">
          <AnimatePresence>
            {filtered.map((item) => {
              const dl = daysUntil(item.expires_at);
              const status = getExpiryVisuals(dl);
              const urgency = getUrgency(dl);
              const isRemoving = removingIds.has(item.id);
              const visuals = getCategoryVisuals(item.category?.name ?? null, item.name);
              const storage = getStorageVisuals(item.storage_location);
              const freshness = freshnessPercent(item.created_at, item.expires_at);
              const isAlerting = urgency === 'critical' && getExpiryStatus(dl) !== 'fresh';

              const expiryText = dl < 0 ? `Expired ${Math.abs(dl)} day${Math.abs(dl) === 1 ? '' : 's'} ago` : dl === 0 ? 'Expires today!' : `${dl} day${dl === 1 ? '' : 's'} left`;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 1 }}
                  animate={{
                    opacity: isRemoving ? 0 : 1,
                    scale: isRemoving ? 0.9 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`rounded-3xl border-2 ${status.border} bg-gradient-to-br ${status.gradient} p-4 flex flex-col gap-3 shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-200 ${isAlerting ? 'animate-pulse-soft' : ''}`}
                  aria-label={`${item.name}, ${expiryText}, ${item.quantity} ${item.unit}${item.category ? `, ${item.category.name}` : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <motion.div
                      className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-2xl shrink-0 shadow-sm border border-white"
                      whileHover={{ rotate: -6, scale: 1.08 }}
                      animate={status.label === 'Expired' ? { rotate: [0, -3, 3, 0] } : {}}
                      transition={{ duration: 2.5, repeat: status.label === 'Expired' ? Infinity : 0 }}
                    >
                      {visuals.emoji}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                        {visuals.emoji} {item.name}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        {item.quantity} {item.unit}
                        {item.category && <span className="text-slate-500"> · {item.category.name}</span>}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${status.bg} ${status.text} border ${status.border}`}>
                          {status.emoji} {status.label}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${storage.bg} ${storage.text} border ${storage.border}`}>
                          {storage.emoji} {storage.label}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setDeleteTarget({ id: item.id, name: item.name })}
                        aria-label={`Delete ${item.name}`}
                        className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/70 text-slate-400 hover:text-coral-500 hover:bg-coral-50 transition-all active:scale-90 shrink-0">
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  </div>

                  <p className={`text-xs font-extrabold ${status.text} flex items-center gap-1`}>
                    {status.emoji} {expiryText}
                  </p>

                  {/* Freshness progress bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Freshness</span>
                      <span className={`text-[10px] font-extrabold ${status.text}`}>{Math.round(freshness)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/80 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${freshness}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: freshness > 60 ? '#10b981' : freshness > 30 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleConsumed(item.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold py-2.5 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-sm shadow-emerald-200">
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                      Consumed
                    </button>
                    <button onClick={() => handleWasted(item.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white text-slate-600 border-2 border-coral-200 text-xs font-bold py-2.5 hover:bg-coral-50 hover:text-coral-700 hover:border-coral-300 hover:scale-[1.02] active:scale-95 transition-all duration-200">
                      <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                      Wasted
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {showAddModal && (
        <AddItemModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onAdd={onAddItem}
        />
      )}

      <ConfirmationModal 
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await onDeleteItem(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        title="Delete Item"
        message={`Are you sure you want to remove ${deleteTarget?.name} from your inventory? This action cannot be undone.`}
        confirmText="Delete Item"
      />
    </div>
  );
}
