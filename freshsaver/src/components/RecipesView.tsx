import { useMemo, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, Flame, Utensils, Trash2, ChevronDown, ChefHat, PlusCircle, X, Check, ShoppingBasket } from 'lucide-react';
import { toast } from 'sonner';
import { getCategoryVisuals, getFoodEmoji } from '@/utils/foodEmojis';
import type { Recipe, FoodItem, RecipeIngredient, FoodUnit } from '@/types';
import { daysUntil, getUrgency } from '@/utils';
import { recipeSchema } from '@/validation';
import { SkeletonCard, SkeletonEmptyState } from '@/components/Skeleton';

interface RecipesViewProps {
  recipes: Recipe[];
  foodItems: FoodItem[];
  onDeleteRecipe: (id: string) => Promise<void>;
  onAddRecipe: (recipe: {
    title: string; description: string; ingredients: RecipeIngredient[];
    instructions: string[]; prep_time_mins: number;
  }) => Promise<void>;
  onCookRecipe: (recipe: Recipe) => Promise<void>;
  onAddGroceryItems?: (items: Array<{ item_name: string; suggested_quantity: number; unit: FoodUnit }>) => Promise<void>;
  loading?: boolean;
}

const SKELETON_COUNT = 5;

const ACTIVE_STATUSES = ['active', 'fresh', 'expiring', 'expired'];

export function RecipesView({ recipes, foodItems, onDeleteRecipe, onAddRecipe, onCookRecipe, onAddGroceryItems, loading = false }: RecipesViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [gapRecipeId, setGapRecipeId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const urgentItemNames = useMemo(() =>
    foodItems
      .filter((i) => ACTIVE_STATUSES.includes(i.status) && getUrgency(daysUntil(i.expires_at)) !== 'fresh')
      .map((i) => i.name.toLowerCase()),
    [foodItems]
  );

  const prioritizedRecipes = useMemo(() => {
    const withGap = recipes.map((recipe) => {
      const matchedIngredients = recipe.ingredients.filter((ing) =>
        urgentItemNames.some((name) =>
          name.includes(ing.item_name.toLowerCase()) || ing.item_name.toLowerCase().includes(name)
        )
      );

      const hasCriticalItem = matchedIngredients.some((ing) => {
        const foodItem = foodItems.find((fi) => fi.name.toLowerCase() === ing.item_name.toLowerCase());
        return foodItem && getUrgency(daysUntil(foodItem.expires_at)) === 'critical';
      });

      const gap = recipe.ingredients
        .filter((ing) => {
          const ingredientName = ing.item_name.toLowerCase();
          return !foodItems.some((fi) => {
            if (!ACTIVE_STATUSES.includes(fi.status)) return false;
            const pantryName = fi.name.toLowerCase();
            return pantryName.includes(ingredientName) || ingredientName.includes(pantryName);
          });
        })
        .map((ing) => ({
          item_name: ing.item_name,
          suggested_quantity: Number.parseFloat(ing.quantity) || 1,
          unit: (ing.unit as FoodUnit) || 'pcs',
        }));

      return { recipe, matchedIngredients, hasCriticalItem, gap, score: matchedIngredients.length * 10 };
    });

    return withGap.sort((a, b) => b.matchedIngredients.length - a.matchedIngredients.length);
  }, [recipes, urgentItemNames, foodItems]);

  const handleShowGroceryGap = (recipeId: string) => {
    setGapRecipeId((current) => (current === recipeId ? null : recipeId));
  };

  const handleAddToGroceryList = async (recipeId: string) => {
    const gap = prioritizedRecipes.find((r) => r.recipe.id === recipeId)?.gap ?? [];
    if (gap.length === 0) {
      toast.info('Nothing missing — you have everything for this recipe! 🥳');
      return;
    }
    if (!onAddGroceryItems) {
      toast.error('Grocery list is unavailable right now');
      return;
    }
    try {
      await onAddGroceryItems(gap);
      setGapRecipeId(null);
    } catch {
      toast.error('Could not add missing ingredients');
    }
  };

  return (
    <div className="px-5 py-4 lg:px-0 lg:py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Recipes 👨‍🍳</h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Rescue expiring ingredients with these ideas</p>
        </div>
        <button onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold px-4 py-2.5 hover:from-emerald-600 hover:to-emerald-700 hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-md shadow-emerald-200">
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          New Recipe
        </button>
      </div>

      {loading ? (
        <div className="space-y-4 pb-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <SkeletonCard key={i} className="h-40" />
            ))}
          </div>
        </div>
      ) : prioritizedRecipes.length === 0 ? (
        <SkeletonEmptyState
          title="No recipes yet 👨‍🍳"
          description="Create your first recipe and turn those soon-to-expire ingredients into something delicious."
          ctaLabel="New Recipe"
          ctaOnClick={() => setShowAddForm(true)}
          icon={ChefHat}
          emojis={['🍳', '🥗', '🍲', '🥕', '🧅']}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 pb-8 sm:grid-cols-2 lg:gap-4">
          <AnimatePresence>
            {prioritizedRecipes.map(({ recipe, score, hasCriticalItem, gap }) => {
              const visuals = getCategoryVisuals(null, recipe.title);
              const isExpanded = expandedId === recipe.id;
              const isGapOpen = gapRecipeId === recipe.id;

              return (
                <motion.div
                  key={recipe.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl bg-gradient-to-br from-white via-white to-emerald-50/60 border-2 border-emerald-100 p-4 hover:shadow-lg hover:scale-[1.01] transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white border border-emerald-100 text-2xl shrink-0 shadow-sm">
                        {visuals.emoji}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                          {recipe.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full px-2 py-0.5">
                            <Utensils className="w-3 h-3" />
                            {score >= 50 ? 'Great match' : score >= 20 ? 'Some missing' : 'Check inventory'}
                          </span>
                          {recipe.is_custom && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5">
                              ✨ Custom
                            </span>
                          )}
                          {hasCriticalItem && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-red-700 bg-red-100 border border-red-200 rounded-full px-2 py-0.5 animate-pulse-soft">
                              ⏰ Use soon
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {recipe.is_custom && (
                      <button onClick={() => onDeleteRecipe(recipe.id)}
                        aria-label={`Delete ${recipe.title}`}
                        className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-300 hover:text-coral-500 hover:bg-coral-50 transition-all active:scale-90 shrink-0">
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                    )}
                  </div>

                  {recipe.description && (
                    <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">{recipe.description}</p>
                  )}

                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {recipe.prep_time_mins != null && (
                      <span className="flex items-center gap-1 text-xs font-bold text-sky-600 bg-sky-50 rounded-full px-2 py-0.5">
                        <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                        {recipe.prep_time_mins} min
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                      <Flame className="w-3.5 h-3.5" strokeWidth={2.5} />
                      Easy
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                      <Utensils className="w-3.5 h-3.5" strokeWidth={2.5} />
                      {recipe.ingredients.length} ingredients
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : recipe.id)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-bold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl py-2 transition-all"
                    >
                      {isExpanded ? 'Hide details' : 'View recipe'}
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => handleShowGroceryGap(recipe.id)}
                      className={`flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                        gap.length > 0
                          ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                      title="Show missing ingredients for this recipe"
                    >
                      <PlusCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                      {gap.length > 0 ? `${gap.length} missing` : 'Have all'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 mt-3 border-t border-emerald-100 space-y-3">
                          <div>
                            <p className="text-xs font-extrabold text-slate-700 mb-2">Ingredients 🧺</p>
                            <ul className="space-y-1">
                              {recipe.ingredients.map((ing, i) => (
                                <li key={i} className="text-xs text-slate-600 font-medium flex items-center gap-2">
                                  <span className="text-sm">{getFoodEmoji(ing.item_name)}</span>
                                  {ing.item_name} — {ing.quantity}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-700 mb-2">Instructions 📋</p>
                            <ol className="space-y-1.5">
                              {recipe.instructions.map((step, i) => (
                                <li key={i} className="text-xs text-slate-600 font-medium flex items-start gap-2">
                                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold shrink-0 mt-0.5">{i + 1}</span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>

                          <div className="rounded-xl bg-amber-50/70 border border-amber-100 p-2.5">
                            <p className="text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                              <ShoppingBasket className="w-3.5 h-3.5 text-amber-600" /> Grocery Gap
                            </p>
                            {gap.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {gap.map((missing) => (
                                  <span key={missing.item_name} className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-white border border-amber-200 rounded-full px-2 py-0.5">
                                    {getFoodEmoji(missing.item_name)} {missing.item_name} · {missing.suggested_quantity} {missing.unit}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] font-bold text-emerald-700 mb-2">You already have everything ✅</p>
                            )}
                            <button
                              onClick={() => handleAddToGroceryList(recipe.id)}
                              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold py-2 hover:bg-amber-600 hover:scale-[1.01] active:scale-95 transition-all duration-200"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              {gap.length > 0 ? 'Add missing to grocery list' : 'Nothing to add'}
                            </button>
                          </div>

                          <button
                            onClick={() => onCookRecipe(recipe)}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-extrabold py-2.5 hover:from-emerald-600 hover:to-emerald-700 hover:scale-[1.01] active:scale-95 transition-all duration-200 shadow-sm shadow-emerald-200"
                          >
                            <ChefHat className="w-4 h-4" /> Cook it & update inventory
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {isGapOpen && !isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 mt-3 border-t border-amber-100">
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {gap.length > 0 ? gap.map((missing) => (
                              <span key={missing.item_name} className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                                {getFoodEmoji(missing.item_name)} {missing.item_name} · {missing.suggested_quantity} {missing.unit}
                              </span>
                            )) : (
                              <span className="text-[11px] font-bold text-emerald-700">Everything you need is already in your pantry ✅</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddToGroceryList(recipe.id)}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold py-2 hover:bg-amber-600 active:scale-95 transition-all duration-200"
                          >
                            <PlusCircle className="w-3.5 h-3.5" /> Add to grocery list
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showAddForm && (
          <AddRecipeModal
            onClose={() => setShowAddForm(false)}
            onAdd={onAddRecipe}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddRecipeModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: RecipesViewProps['onAddRecipe'];
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('20');
  const [ingredientsText, setIngredientsText] = useState('');
  const [instructionsText, setInstructionsText] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const ingredients = ingredientsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [rawName, ...rest] = line.split(',');
        return {
          item_name: rawName.trim(),
          quantity: rest.join(',').trim() || '1',
        };
      });

    const instructions = instructionsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const result = recipeSchema.safeParse({
      title: title.trim(),
      description: description.trim(),
      ingredients,
      instructions,
      prep_time_mins: Number.parseInt(prepTime, 10),
    });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Please check your recipe');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onAdd({
        title: result.data.title,
        description: result.data.description ?? '',
        ingredients: result.data.ingredients,
        instructions: result.data.instructions,
        prep_time_mins: result.data.prep_time_mins,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create recipe');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        role="dialog"
        aria-modal="true"
        aria-label="Create a recipe"
        className="relative w-full sm:max-w-lg bg-gradient-to-b from-white to-amber-50/40 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92dvh] sm:max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0 bg-white/80 backdrop-blur-sm border-b border-emerald-100">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
              <ChefHat className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 leading-tight">New Recipe 👨‍🍳</h2>
              <p className="text-[11px] font-medium text-slate-500">Cook something from your pantry</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close recipe dialog"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-500 transition-all active:scale-90">
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-5 py-4 overflow-y-auto flex-1 space-y-3">
            <div>
              <label htmlFor="recipe-title" className="text-sm font-bold text-slate-700 block mb-1.5">Title</label>
              <input id="recipe-title" value={title} onChange={(e) => { setTitle(e.target.value); setError(''); }}
                placeholder="e.g. Apple Cinnamon Oat Bowl 🍎"
                className="w-full text-base font-medium text-slate-800 bg-white rounded-xl px-4 py-3 border-2 border-slate-100 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all" />
            </div>

            <div>
              <label htmlFor="recipe-description" className="text-sm font-bold text-slate-700 block mb-1.5">Description</label>
              <input id="recipe-description" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="A quick, cosy breakfast"
                className="w-full text-base font-medium text-slate-800 bg-white rounded-xl px-4 py-3 border-2 border-slate-100 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all" />
            </div>

            <div>
              <label htmlFor="recipe-prep" className="text-sm font-bold text-slate-700 block mb-1.5">Prep time (minutes)</label>
              <input id="recipe-prep" type="number" min="1" value={prepTime} onChange={(e) => setPrepTime(e.target.value)}
                className="w-full text-base font-medium text-slate-800 bg-white rounded-xl px-4 py-3 border-2 border-slate-100 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all" />
            </div>

            <div>
              <label htmlFor="recipe-ingredients" className="text-sm font-bold text-slate-700 block mb-1.5">
                Ingredients <span className="font-normal text-slate-400">— one per line: name, quantity</span>
              </label>
              <textarea id="recipe-ingredients" value={ingredientsText} onChange={(e) => { setIngredientsText(e.target.value); setError(''); }}
                rows={4}
                placeholder={'Fresh Apples, 2 pcs\nOrganic Milk, 1 cup\nOats, 50 g'}
                className="w-full text-sm font-medium text-slate-800 bg-white rounded-xl px-4 py-3 border-2 border-slate-100 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all resize-none" />
            </div>

            <div>
              <label htmlFor="recipe-instructions" className="text-sm font-bold text-slate-700 block mb-1.5">
                Instructions <span className="font-normal text-slate-400">— one step per line</span>
              </label>
              <textarea id="recipe-instructions" value={instructionsText} onChange={(e) => { setInstructionsText(e.target.value); setError(''); }}
                rows={4}
                placeholder={'Chop the apples.\nSimmer with oats and milk.\nTop with cinnamon and enjoy!'}
                className="w-full text-sm font-medium text-slate-800 bg-white rounded-xl px-4 py-3 border-2 border-slate-100 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all resize-none" />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5">
                <p className="text-sm font-bold text-red-700">{error}</p>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 shrink-0 border-t border-emerald-100 bg-white/95 backdrop-blur-md p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-extrabold text-base py-3.5 hover:from-emerald-600 hover:to-emerald-700 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 shadow-lg shadow-emerald-200">
              {submitting ? (
                <><Clock className="w-5 h-5 animate-spin" /> Saving…</>
              ) : (
                <><Check className="w-5 h-5" strokeWidth={2.5} /> Save Recipe</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
