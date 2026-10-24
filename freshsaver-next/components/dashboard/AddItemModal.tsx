'use client';

import { useEffect, useState } from 'react';
import { Loader2, PackagePlus, Sparkles, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import type { Category, FoodItem, FoodUnit, StorageLocation } from '@/lib/types';
import type { FoodItemInput } from '@/services/foodItems';
import { addDays, toDateInputValue } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';

const UNITS: Array<{ value: FoodUnit; label: string }> = [
  { value: 'pcs', label: 'pieces (pcs)' },
  { value: 'kg', label: 'kilograms (kg)' },
  { value: 'liters', label: 'liters (L)' },
  { value: 'packs', label: 'packs' },
  { value: 'bunches', label: 'bunches' },
];

const STORAGE: Array<{ value: StorageLocation; label: string; emoji: string }> = [
  { value: 'fridge', label: 'Fridge', emoji: '🧊' },
  { value: 'pantry', label: 'Pantry', emoji: '🫙' },
  { value: 'freezer', label: 'Freezer', emoji: '❄️' },
];

interface AddItemModalProps {
  open: boolean;
  categories: Category[];
  onClose: () => void;
  onAdd: (input: FoodItemInput) => Promise<FoodItem>;
}

export function AddItemModal({ open, categories, onClose, onAdd }: AddItemModalProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<FoodUnit>('pcs');
  const [categoryId, setCategoryId] = useState('');
  const [storage, setStorage] = useState<StorageLocation>('pantry');
  const [expiry, setExpiry] = useState(toDateInputValue(addDays(7)));
  const [cost, setCost] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setQuantity('1');
    setUnit('pcs');
    setCategoryId(categories[0]?.id ?? '');
    setStorage('pantry');
    setExpiry(toDateInputValue(addDays(7)));
    setCost('');
    setErrors({});
    setFormError(null);
    setSaving(false);
  }, [open, categories]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors: Record<string, string> = {};
    if (name.trim().length < 2) nextErrors.name = 'Give the item a name.';
    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      nextErrors.quantity = 'Use a quantity greater than zero.';
    }
    if (!expiry) nextErrors.expiry = 'Choose an expiry date.';
    const parsedCost = cost.trim() ? Number(cost) : undefined;
    if (parsedCost !== undefined && (!Number.isFinite(parsedCost) || parsedCost < 0)) {
      nextErrors.cost = 'Enter a valid cost.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const category = categories.find((entry) => entry.id === categoryId) ?? null;
    const payload: FoodItemInput = {
      name: name.trim() || 'Unnamed Item',
      category_id: category?.id ?? null,
      quantity: parsedQuantity || 1,
      unit,
      expires_at: new Date(`${expiry}T12:00:00`).toISOString(),
      storage_location: storage,
      original_quantity: parsedQuantity || 1,
      estimated_cost: parsedCost,
    };

    console.log('Submitting food item:', payload);
    setSaving(true);
    try {
      await onAdd(payload);
      toast.success(`${payload.name} added to your pantry.`);
      onClose();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Could not add the item. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Add an item to your pantry"
      description="Track a new food item with quantity, storage, and expiry."
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="border-b border-ink-100 bg-gradient-to-br from-emerald-50/70 to-cream-50 px-5 pb-4 pt-5 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
              <PackagePlus className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-[-0.04em] text-ink-950">
                Add to pantry
              </h2>
              <p className="mt-0.5 text-xs font-medium text-ink-500">
                A little detail now saves a lot of food later.
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-[calc(92vh-13rem)] space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-1.5">
            <Label htmlFor="item-name">Item name</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Baby spinach"
              autoFocus
              maxLength={80}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? (
              <p className="text-[11px] font-semibold text-coral-500">{errors.name}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="item-quantity">Quantity</Label>
              <Input
                id="item-quantity"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                aria-invalid={Boolean(errors.quantity)}
              />
              {errors.quantity ? (
                <p className="text-[11px] font-semibold text-coral-500">{errors.quantity}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-unit">Unit</Label>
              <select
                id="item-unit"
                value={unit}
                onChange={(event) => setUnit(event.target.value as FoodUnit)}
                className="flex h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm font-medium text-ink-900 shadow-sm focus-visible:border-emerald-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
              >
                {UNITS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-category">Category</Label>
              <select
                id="item-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="flex h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm font-medium text-ink-900 shadow-sm focus-visible:border-emerald-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
              >
                <option value="">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-storage">Storage</Label>
              <select
                id="item-storage"
                value={storage}
                onChange={(event) => setStorage(event.target.value as StorageLocation)}
                className="flex h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm font-medium text-ink-900 shadow-sm focus-visible:border-emerald-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
              >
                {STORAGE.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.emoji} {entry.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-expiry">Expiry date</Label>
              <Input
                id="item-expiry"
                type="date"
                value={expiry}
                onChange={(event) => setExpiry(event.target.value)}
                aria-invalid={Boolean(errors.expiry)}
              />
              {errors.expiry ? (
                <p className="text-[11px] font-semibold text-coral-500">{errors.expiry}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-cost">Estimated cost (optional)</Label>
              <Input
                id="item-cost"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={cost}
                onChange={(event) => setCost(event.target.value)}
                placeholder="0.00"
                aria-invalid={Boolean(errors.cost)}
              />
              {errors.cost ? (
                <p className="text-[11px] font-semibold text-coral-500">{errors.cost}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <p className="text-[10px] font-semibold leading-relaxed text-emerald-800">
              FreshSaver will watch this expiry date and surface a rescue recipe before it’s too
              late.
            </p>
          </div>

          {formError ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-coral-200 bg-coral-50 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-coral-600"
            >
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {formError}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-ink-100 bg-ink-50/40 px-5 py-4 sm:px-6">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
            Add to pantry
          </Button>
        </div>
      </form>
    </Modal>
  );
}
