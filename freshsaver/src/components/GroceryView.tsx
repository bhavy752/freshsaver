import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, ShoppingCart, Sparkles, X, Users } from 'lucide-react';
import type { GroceryListItem, FoodItem, FoodUnit } from '@/types';
import { UNIT_OPTIONS } from '@/utils';
import { groceryItemSchema } from '@/validation';
import { SkeletonCard, SkeletonEmptyState } from '@/components/Skeleton';

interface GroceryViewProps {
  items: GroceryListItem[];
  foodItems: FoodItem[];
  familyMembersCount: number;
  loading?: boolean;
  onAddItem: (item: { item_name: string; suggested_quantity: number; unit: FoodUnit }) => Promise<void>;
  onTogglePurchased: (id: string, isPurchased: boolean) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onAutoGenerate: (items: Array<{ item_name: string; suggested_quantity: number; unit: FoodUnit }>) => Promise<void>;
}

const SKELETON_COUNT = 5;

export function GroceryView({ items, foodItems, familyMembersCount, loading = false, onAddItem, onTogglePurchased, onDeleteItem, onAutoGenerate }: GroceryViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [generating, setGenerating] = useState(false);

  const unpurchased = items.filter((i) => !i.is_purchased);
  const purchased = items.filter((i) => i.is_purchased);

  const handleAutoGenerate = async () => {
    setGenerating(true);
    try {
      const consumed = foodItems.filter((i) => i.status === 'consumed');
      const wasted = foodItems.filter((i) => i.status === 'wasted');
      const toReplenish = [...consumed, ...wasted];

      if (toReplenish.length === 0) {
        return;
      }

      const grouped = new Map<string, { quantity: number; unit: FoodUnit }>();
      for (const item of toReplenish) {
        const existing = grouped.get(item.name);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          grouped.set(item.name, { quantity: item.quantity, unit: item.unit });
        }
      }

      const scale = familyMembersCount > 0 ? familyMembersCount : 1;

      const newItems = Array.from(grouped.entries()).map(([name, info]) => ({
        item_name: name,
        suggested_quantity: Math.round(info.quantity * scale * 10) / 10,
        unit: info.unit,
      }));

      await onAutoGenerate(newItems);
    } finally {
      setGenerating(false);
    }
  };

  const consumedCount = foodItems.filter((i) => i.status === 'consumed').length;
  const wastedCount = foodItems.filter((i) => i.status === 'wasted').length;

  return (
    <div className="px-5 py-4 lg:px-0 lg:py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-slateink-800">Grocery List</h2>
        <button onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 rounded-xl bg-sage-500 text-white text-sm font-bold px-4 py-2.5 hover:bg-sage-600 active:scale-95 transition-all shadow-sm">
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Add Item
        </button>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-4 pb-8">
          <div className="space-y-2">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <SkeletonCard key={i} className="h-16" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <SkeletonEmptyState
          title="Your grocery list is empty"
          description="Add items manually or auto-generate from consumed items"
          ctaLabel="Add Item"
          ctaOnClick={() => setShowAddForm(true)}
          icon={ShoppingCart}
        />
      ) : (
        <div className="space-y-4 pb-8">
          {/* Auto-generate banner */}
          {(consumedCount > 0 || wastedCount > 0) && unpurchased.length < 20 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-sage-50 border border-sage-200 p-4 mb-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sage-100 shrink-0">
                  <Sparkles className="w-5 h-5 text-sage-600" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-sage-700">
                    {consumedCount + wastedCount} item{consumedCount + wastedCount === 1 ? '' : 's'} consumed or wasted
                  </p>
                  <p className="text-xs text-sage-500 font-medium mt-0.5 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Scaled for {familyMembersCount} member{familyMembersCount === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <button onClick={handleAutoGenerate} disabled={generating}
                className="flex items-center gap-1.5 rounded-xl bg-sage-500 text-white text-xs font-bold px-3 py-2 hover:bg-sage-600 active:scale-95 transition-all disabled:opacity-60 shrink-0">
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </motion.div>
          )}

          {/* Unpurchased */}
          {unpurchased.length > 0 && (
            <div>
              <p className="text-xs font-extrabold text-slateink-400 uppercase tracking-wide mb-2">To Buy</p>
              <div className="space-y-2">
                <AnimatePresence>
                  {unpurchased.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center gap-3 rounded-2xl bg-white border border-slateink-100 p-3.5"
                    >
                      <button onClick={() => onTogglePurchased(item.id, true)}
                        className="flex items-center justify-center w-7 h-7 rounded-lg border-2 border-slateink-200 hover:border-sage-400 hover:bg-sage-50 transition-all active:scale-90 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slateink-800">{item.item_name}</p>
                        <p className="text-xs text-slateink-400 font-medium">
                          {item.suggested_quantity} {item.unit}
                          {item.auto_generated && <span className="text-sage-500 ml-1">· auto</span>}
                        </p>
                      </div>
                      <button onClick={() => onDeleteItem(item.id)}
                        className="flex items-center justify-center w-7 h-7 rounded-lg text-slateink-300 hover:text-coral-500 hover:bg-coral-50 transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Purchased */}
          {purchased.length > 0 && (
            <div>
              <p className="text-xs font-extrabold text-slateink-400 uppercase tracking-wide mb-2">Purchased</p>
              <div className="space-y-2">
                {purchased.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    className="flex items-center gap-3 rounded-2xl bg-sage-50/50 border border-sage-100 p-3.5"
                  >
                    <button onClick={() => onTogglePurchased(item.id, false)}
                      className="flex items-center justify-center w-7 h-7 rounded-lg bg-sage-500 text-white shrink-0 active:scale-90 transition-transform">
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slateink-400 line-through">{item.item_name}</p>
                      <p className="text-xs text-slateink-300 font-medium">{item.suggested_quantity} {item.unit}</p>
                    </div>
                    <button onClick={() => onDeleteItem(item.id)}
                      className="flex items-center justify-center w-7 h-7 rounded-lg text-slateink-300 hover:text-coral-500 hover:bg-coral-50 transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showAddForm && (
          <AddGroceryModal onClose={() => setShowAddForm(false)} onAdd={onAddItem} />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddGroceryModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (item: { item_name: string; suggested_quantity: number; unit: FoodUnit }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<FoodUnit>('pcs');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const qty = parseFloat(quantity);

    const result = groceryItemSchema.safeParse({
      item_name: name.trim(),
      suggested_quantity: qty,
      unit,
    });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Please check your inputs');
      return;
    }

    setSubmitting(true);
    try {
      await onAdd({ item_name: result.data.item_name, suggested_quantity: result.data.suggested_quantity, unit: result.data.unit });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slateink-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="relative w-full sm:max-w-md bg-cream-50 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-sage-100">
              <ShoppingCart className="w-4 h-4 text-sage-600" strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-extrabold text-slateink-800">Add to Grocery List</h2>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-full bg-slateink-100 hover:bg-slateink-200 transition-colors">
            <X className="w-4 h-4 text-slateink-500" strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <div>
            <label className="text-sm font-bold text-slateink-700 block mb-1.5">Item Name</label>
            <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Olive Oil" autoFocus
              className="w-full text-base font-medium text-slateink-800 bg-white rounded-xl px-4 py-3 border border-slateink-100 outline-none focus:border-sage-300 transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-slateink-700 block mb-1.5">Quantity</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="0" step="0.1"
                className="w-full text-base font-medium text-slateink-800 bg-white rounded-xl px-4 py-3 border border-slateink-100 outline-none focus:border-sage-300 transition-colors" />
            </div>
            <div>
              <label className="text-sm font-bold text-slateink-700 block mb-1.5">Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value as FoodUnit)}
                className="w-full text-base font-medium text-slateink-800 bg-white rounded-xl px-4 py-3 border border-slateink-100 outline-none focus:border-sage-300 transition-colors">
                {UNIT_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
          </div>

          {error && <div className="rounded-xl bg-coral-50 border border-coral-200 px-4 py-2.5"><p className="text-sm font-bold text-coral-700">{error}</p></div>}

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-sage-500 text-white font-bold text-base py-3.5 hover:bg-sage-600 active:scale-[0.98] transition-all disabled:opacity-60">
            {submitting ? 'Adding...' : 'Add to List'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
