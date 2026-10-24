'use client';

import { ChefHat, Clock3, Flame, Loader2, Sparkles } from 'lucide-react';
import type { FoodItem } from '@/lib/types';
import { categoryEmoji, recipeIdeaForItem } from '@/lib/inventory';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface RecipeIdeaModalProps {
  item: FoodItem | null;
  cooking: boolean;
  onClose: () => void;
  onCook: (item: FoodItem) => void;
}

export function RecipeIdeaModal({ item, cooking, onClose, onCook }: RecipeIdeaModalProps) {
  const recipe = item ? recipeIdeaForItem(item) : null;

  return (
    <Modal
      open={Boolean(item && recipe)}
      onClose={onClose}
      label={recipe?.title ?? 'Rescue recipe'}
      description={recipe?.description}
      className="max-w-lg"
    >
      {item && recipe ? (
        <div>
          <div className="border-b border-ink-100 bg-gradient-to-br from-emerald-50/80 to-amber-50/50 px-5 pb-5 pt-5 sm:px-6">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                {categoryEmoji(item.category, item.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-700">
                    <Sparkles className="h-2.5 w-2.5" />
                    AI rescue recipe
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-amber-700">
                    <Clock3 className="h-2.5 w-2.5" />
                    {recipe.prepMinutes} min
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-black leading-tight tracking-[-0.04em] text-ink-950">
                  {recipe.title}
                </h2>
                <p className="mt-1 text-xs font-medium leading-relaxed text-ink-500">
                  {recipe.description}
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-[calc(92vh-18rem)] space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-ink-400">
                What you’ll need
              </p>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {recipe.ingredients.map((ingredient) => (
                  <div
                    key={ingredient}
                    className="flex items-center gap-2 rounded-xl border border-ink-100 bg-ink-50/40 px-2.5 py-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-semibold text-ink-700">{ingredient}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-ink-400">
                Method
              </p>
              <ol className="mt-2 space-y-2.5">
                {recipe.steps.map((step, index) => (
                  <li key={step} className="flex gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white">
                      {index + 1}
                    </span>
                    <p className="pt-0.5 text-[11px] font-medium leading-relaxed text-ink-600">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
              <Flame className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <p className="text-[10px] font-semibold leading-relaxed text-emerald-800">
                Cooking this now rescues one {item.name.toLowerCase()} and keeps your waste streak
                alive.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-ink-100 bg-ink-50/40 px-5 py-4 sm:px-6">
            <Button variant="outline" onClick={onClose} disabled={cooking}>
              Not now
            </Button>
            <Button onClick={() => onCook(item)} disabled={cooking}>
              {cooking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChefHat className="h-4 w-4" />}
              I cooked this
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
