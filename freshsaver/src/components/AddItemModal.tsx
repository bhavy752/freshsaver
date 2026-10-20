import { useMemo, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, Package, Sparkles } from 'lucide-react';
import type { Category, FoodUnit, StorageLocation } from '@/types';
import { UNIT_OPTIONS, addDaysToDate } from '@/utils';
import { foodItemSchema } from '@/validation';
import { getCategoryVisuals, getFoodEmoji, STORAGE_VISUALS } from '@/utils/foodEmojis';

interface AddItemModalProps {
  categories: Category[];
  onClose: () => void;
  onAdd: (item: {
    name: string;
    category_id: string | null;
    quantity: number;
    unit: FoodUnit;
    expires_at: string;
    storage_location: StorageLocation;
  }) => Promise<void>;
}

const STORAGE_OPTIONS: StorageLocation[] = ['fridge', 'pantry', 'freezer'];

export function AddItemModal({ categories, onClose, onAdd }: AddItemModalProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('fridge');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<FoodUnit>('pcs');
  const [shelfLifeDays, setShelfLifeDays] = useState(7);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedCat = categories.find((c) => c.id === categoryId);
  const effectiveDays = selectedCat ? selectedCat.default_expiry_days : shelfLifeDays;
  const previewVisuals = getCategoryVisuals(selectedCat?.name ?? null, name);
  const previewEmoji = getFoodEmoji(name, selectedCat?.name ?? null);
  const previewDate = useMemo(
    () => new Date(addDaysToDate(effectiveDays)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    [effectiveDays]
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    // Never send empty/whitespace ids to Postgres — they must be null or a real UUID.
    const safeCategoryId = categories.some((c) => c.id?.trim() === categoryId) ? categoryId : null;
    const qty = parseFloat(quantity);
    const result = foodItemSchema.safeParse({
      name: name.trim(),
      category_id: safeCategoryId,
      quantity: qty,
      unit,
      expires_at: addDaysToDate(effectiveDays),
    });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Please check your inputs');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onAdd({
        name: result.data.name,
        category_id: result.data.category_id ?? null,
        quantity: result.data.quantity,
        unit: result.data.unit,
        expires_at: result.data.expires_at,
        storage_location: storageLocation,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  const shelfLifeOptions = [1, 2, 3, 5, 7, 10, 14, 21, 30, 60];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        role="dialog"
        aria-modal="true"
        aria-label="Add food item"
        className="relative w-full sm:max-w-lg bg-gradient-to-b from-white to-emerald-50/40 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92dvh] sm:max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0 bg-white/80 backdrop-blur-sm border-b border-emerald-100">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm shadow-emerald-200">
              <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 leading-tight">Add Food Item 🥗</h2>
              <p className="text-[11px] font-medium text-slate-500">Track it before it goes to waste</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close add item dialog"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-500 transition-all active:scale-90"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Single form so the sticky footer submit always submits the form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
            {/* Live preview */}
            <div className={`flex items-center gap-3 rounded-2xl border ${previewVisuals.color.border} bg-gradient-to-r ${previewVisuals.color.gradient} px-4 py-3`}>
              <motion.span
                key={previewEmoji}
                initial={{ scale: 0.6, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-2xl shadow-sm shrink-0"
              >
                {previewEmoji}
              </motion.span>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-slate-900 truncate">
                  {name.trim() || 'Your next fresh find'}
                </p>
                <p className="text-xs font-bold text-slate-500">
                  {(selectedCat?.name ?? previewVisuals.label)} · {STORAGE_VISUALS[storageLocation].emoji} {STORAGE_VISUALS[storageLocation].label} · {previewDate}
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="food-name" className="text-sm font-bold text-slate-700 block mb-1.5">Food Name</label>
              <input
                id="food-name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="e.g. Organic Spinach 🥬"
                autoFocus
                className="w-full text-base font-medium text-slate-800 bg-white rounded-xl px-4 py-3 border-2 border-slate-100 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1.5">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const catVisuals = getCategoryVisuals(cat.name);
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        const nextCategoryId = cat.id?.trim() ? cat.id : null;
                        setCategoryId(isSelected ? null : nextCategoryId);
                        setError('');
                      }}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition-all duration-200 active:scale-95 border-2 ${
                        isSelected
                          ? `${catVisuals.color.bg} ${catVisuals.color.text} ${catVisuals.color.border} shadow-sm scale-[1.02]`
                          : 'bg-white text-slate-600 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/60'
                      }`}
                    >
                      <span className="text-base">{catVisuals.emoji}</span>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Storage location */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1.5">Storage Location</label>
              <div className="grid grid-cols-3 gap-2">
                {STORAGE_OPTIONS.map((location) => {
                  const visuals = STORAGE_VISUALS[location];
                  const isSelected = storageLocation === location;
                  return (
                    <button
                      key={location}
                      type="button"
                      onClick={() => setStorageLocation(location)}
                      aria-pressed={isSelected}
                      className={`flex flex-col items-center gap-1 rounded-xl py-2.5 px-2 text-xs font-bold transition-all duration-200 active:scale-95 border-2 ${
                        isSelected
                          ? `${visuals.bg} ${visuals.text} ${visuals.border} shadow-sm`
                          : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg">{visuals.emoji}</span>
                      {visuals.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="food-quantity" className="text-sm font-bold text-slate-700 block mb-1.5">Quantity</label>
                <input
                  id="food-quantity"
                  type="number"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => { setQuantity(e.target.value); setError(''); }}
                  min="0"
                  step="0.1"
                  className="w-full text-base font-medium text-slate-800 bg-white rounded-xl px-4 py-3 border-2 border-slate-100 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all"
                />
              </div>
              <div>
                <label htmlFor="food-unit" className="text-sm font-bold text-slate-700 block mb-1.5">Unit</label>
                <select
                  id="food-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as FoodUnit)}
                  className="w-full text-base font-medium text-slate-800 bg-white rounded-xl px-4 py-3 border-2 border-slate-100 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all"
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold text-slate-700">
                  Shelf Life (days)
                  {selectedCat && <span className="text-emerald-600 font-normal ml-1">· auto from category</span>}
                </label>
                <AnimatePresence>
                  {selectedCat && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-xs font-extrabold text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-1"
                    >
                      {effectiveDays} days
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-wrap gap-2">
                {shelfLifeOptions.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => { setShelfLifeDays(days); setCategoryId(null); setError(''); }}
                    className={`rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-200 active:scale-95 border-2 ${
                      effectiveDays === days
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-white text-slate-500 border-slate-100 hover:border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    {days} {days === 1 ? 'day' : 'days'}
                  </button>
                ))}
              </div>
              <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Expires on {previewDate}
                </p>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 overflow-hidden"
                >
                  <p className="text-sm font-bold text-red-700">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sticky footer: always visible, never clipped by the scroll area */}
          <div className="sticky bottom-0 shrink-0 border-t border-emerald-100 bg-white/95 backdrop-blur-md p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-16px_rgba(16,185,129,0.5)]">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-extrabold text-base py-3.5 hover:from-emerald-600 hover:to-emerald-700 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
            >
              {submitting ? (
                <span className="flex items-center gap-2"><Package className="w-5 h-5 animate-pulse" /> Adding...</span>
              ) : (
                <><Check className="w-5 h-5" strokeWidth={2.5} /> Add to Inventory</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
