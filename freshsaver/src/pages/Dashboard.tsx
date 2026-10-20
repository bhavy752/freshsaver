import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, LogOut, Package, ChefHat, ShoppingCart, Users, Loader2, Flame, TrendingUp, Recycle, ScanLine, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { fetchFoodItems, updateFoodItemStatus, deleteFoodItem, insertFoodItem, insertFoodItemsBulk, deductFoodItemQuantity } from '@/services/foodItems';
import { fetchRecipes, deleteRecipe, insertRecipe } from '@/services/recipes';
import { fetchGroceryList, toggleGroceryItemPurchased, deleteGroceryItem, insertGroceryItem, autoGenerateGroceryItems } from '@/services/groceryList';
import { fetchCategories } from '@/services/categories';
import { updateWasteStreak } from '@/services/profiles';
import type { FoodItem, Recipe, GroceryListItem, Category, RecipeIngredient, FoodUnit, StorageLocation } from '@/types';
import { countExpiringSoon, consumedValue, addDaysToDate } from '@/utils';
import { calculatePantryScore } from '@/lib/pantryScore';
import { InventoryView } from '@/components/InventoryView';
import { RecipesView } from '@/components/RecipesView';
import { GroceryView } from '@/components/GroceryView';
import { ScanView } from '@/components/ScanView';
import { PantryHealthWidget } from '@/components/PantryHealthWidget';
import { BottomNav, type DashboardTab } from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function Dashboard() {
  const { user, profile, household, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('inventory');
  const [items, setItems] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pantryScore, setPantryScore] = useState<{score: number, breakdown: {activeUtilization: number, shelfLifeCompliance: number, notNearExpiry: number, zeroWasteStreak: number}} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const householdId = household?.id ?? '';
  const userId = user?.id ?? '';
  const expiringCount = countExpiringSoon(items, 2);
  const streak = profile?.waste_streak ?? 0;
  const moneySaved = profile?.money_saved ?? 0;
  const consumedCount = consumedValue(items);
  const seededRef = useRef(false);

  /** First-run sample inventory so the dashboard never opens empty. */
  const seedSampleData = useCallback(async (
    targetHouseholdId: string,
    targetUserId: string,
    cats: Category[]
  ): Promise<FoodItem[]> => {
    const categoryId = (...needles: string[]) => {
      for (const needle of needles) {
        const match = cats.find((c) => c.name.toLowerCase().includes(needle));
        if (match) return match.id;
      }
      return null;
    };

    const sampleItems = [
      {
        name: 'Fresh Apples',
        category_id: categoryId('produce', 'fruit'),
        quantity: 6,
        unit: 'pcs' as FoodUnit,
        expires_at: addDaysToDate(7),
        storage_location: 'fridge' as StorageLocation,
        original_quantity: 6,
        estimated_cost: 4.5,
      },
      {
        name: 'Organic Milk',
        category_id: categoryId('dairy', 'milk'),
        quantity: 1,
        unit: 'liters' as FoodUnit,
        expires_at: addDaysToDate(2),
        storage_location: 'fridge' as StorageLocation,
        original_quantity: 1,
        estimated_cost: 3.2,
      },
      {
        name: 'Sourdough Bread',
        category_id: categoryId('bakery', 'bread'),
        quantity: 1,
        unit: 'packs' as FoodUnit,
        expires_at: addDaysToDate(4),
        storage_location: 'pantry' as StorageLocation,
        original_quantity: 1,
        estimated_cost: 5.0,
      },
      {
        name: 'Ripe Avocados',
        category_id: categoryId('produce', 'fruit'),
        quantity: 3,
        unit: 'pcs' as FoodUnit,
        expires_at: addDaysToDate(1),
        storage_location: 'fridge' as StorageLocation,
        original_quantity: 3,
        estimated_cost: 3.75,
      },
    ];

    return insertFoodItemsBulk(targetHouseholdId, targetUserId, sampleItems);
  }, []);

  const loadData = useCallback(async () => {
    if (!householdId && !userId) {
      // No user or household resolved yet — clear the loader so the UI never hangs.
      setLoading(false);
      setItems([]);
      setRecipes([]);
      setGroceryItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [foodItems, recipeList, grocery, cats] = await Promise.all([
        // Also loads fallback items saved under the user when no household exists.
        fetchFoodItems(householdId, userId),
        householdId ? fetchRecipes(householdId) : Promise.resolve([]),
        householdId ? fetchGroceryList(householdId) : Promise.resolve([]),
        fetchCategories(),
      ]);

      setCategories(cats);
      let inventory = foodItems;

      // Seed once per household (and only when the inventory is genuinely empty).
      if (householdId) {
        const seedKey = `freshsaver:seeded:${householdId}`;
        let alreadySeeded = false;
        try {
          alreadySeeded = window.localStorage.getItem(seedKey) === 'true';
        } catch {
          // Private browsing / storage disabled — seed based on the empty inventory only.
        }

        if (inventory.length === 0 && !alreadySeeded && !seededRef.current && userId) {
          seededRef.current = true;
          try {
            inventory = await seedSampleData(householdId, userId, cats);
            try {
              window.localStorage.setItem(seedKey, 'true');
            } catch {
              // Ignore storage failures.
            }
            toast.success('Added a few sample items to get you started 🍎');
          } catch (seedErr) {
            seededRef.current = false;
            console.warn('Sample data seeding skipped:', seedErr);
          }
        }
      }

      setItems(inventory);
      setRecipes(recipeList);
      setGroceryItems(grocery);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [householdId, userId, seedSampleData]);

  // Load everything once the household is resolved.
  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Recalculate Pantry Health Score whenever inventory or streak changes
  useEffect(() => {
    if (items.length > 0) {
      setPantryScore(calculatePantryScore(items, profile?.waste_streak ?? 0));
    }
  }, [items, profile?.waste_streak]);

  // Realtime sync with last-write-wins conflict resolution via updated_at triggers
  useEffect(() => {
    if (!householdId) return;

    const channel = supabase
      .channel(`dashboard-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_items',
          filter: `household_id=eq.${householdId}`,
        },
        (payload: RealtimePostgresChangesPayload<FoodItem>) => {
          const next = payload.new as FoodItem;
          if (payload.eventType === 'INSERT') {
            setItems((prev) =>
              prev.some((i) => i.id === next.id)
                ? prev
                : [next, ...prev]
            );
          } else if (payload.eventType === 'UPDATE') {
            setItems((prev) =>
              prev.map((i) =>
                i.id === next.id ? { ...i, ...next } : i
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const removedId = (payload.old as Partial<FoodItem>).id;
            setItems((prev) => prev.filter((i) => i.id !== removedId));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recipes',
          filter: `household_id=eq.${householdId}`,
        },
        (payload: RealtimePostgresChangesPayload<Recipe>) => {
          const next = payload.new as Recipe;
          if (payload.eventType === 'INSERT') {
            setRecipes((prev) => [next, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setRecipes((prev) =>
              prev.map((r) =>
                r.id === next.id ? { ...r, ...next } : r
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const removedId = (payload.old as Partial<Recipe>).id;
            setRecipes((prev) => prev.filter((r) => r.id !== removedId));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grocery_items',
          filter: `household_id=eq.${householdId}`,
        },
        (payload: RealtimePostgresChangesPayload<GroceryListItem>) => {
          const next = payload.new as GroceryListItem;
          if (payload.eventType === 'INSERT') {
            setGroceryItems((prev) => [next, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setGroceryItems((prev) =>
              prev.map((g) =>
                g.id === next.id ? { ...g, ...next } : g
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const removedId = (payload.old as Partial<GroceryListItem>).id;
            setGroceryItems((prev) => prev.filter((g) => g.id !== removedId));
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime sync active');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime sync error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId]);

  const handleAddItem = useCallback(async (item: {
    name: string; category_id: string | null; quantity: number; unit: FoodItem['unit']; expires_at: string;
    storage_location: StorageLocation; // Added storage_location
  }) => {
    const hadNoHousehold = !householdId;
    try {
      // The service resolves the profile household or creates a Personal Pantry.
      const saved = await insertFoodItem(householdId, userId, item);
      setItems((prev) => [...prev, saved]);
      if (hadNoHousehold) {
        toast.success(`${item.name} added to your Personal Pantry 🌿`);
      } else {
        toast.success(`${item.name} added to inventory`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add item');
      throw err;
    }
  }, [householdId, userId]);

  const handleAddItems = useCallback(async (items: Array<{
    name: string; category_id: string | null; quantity: number; unit: FoodUnit; expires_at: string;
    storage_location: StorageLocation; // Added storage_location
  }>) => {
    const hadNoHousehold = !householdId;
    try {
      // The service resolves the profile household or creates a Personal Pantry.
      const saved = await insertFoodItemsBulk(householdId, userId, items);
      setItems((prev) => [...prev, ...saved]);
      if (hadNoHousehold) {
        toast.success(`Added ${saved.length} item${saved.length === 1 ? '' : 's'} to your Personal Pantry 🌿`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add items');
      throw err;
    }
  }, [householdId, userId]);

  const evaluateStreak = useCallback(async (newItems: FoodItem[]) => {
    if (!userId) return;
    const today = new Date().toISOString().split('T')[0];
    const lastCheck = profile?.last_waste_check_date;

    if (lastCheck === today) return;

    const wastedToday = newItems.some(
      (i) => i.status === 'wasted'
    );

    if (wastedToday) {
      await updateWasteStreak(userId, 0, today);
    } else {
      const newStreak = (profile?.waste_streak ?? 0) + 1;
      await updateWasteStreak(userId, newStreak, today);
    }
  }, [userId, profile]);

  const handleUpdateStatus = useCallback(async (id: string, status: FoodItem['status']) => {
    const previous = items;
    const newItems = items.map((i) => i.id === id ? { ...i, status } : i);
    setItems(newItems);
    try {
      await updateFoodItemStatus(id, status);
      await evaluateStreak(newItems);
      if (status === 'consumed') toast.success('Marked as consumed');
      if (status === 'wasted') toast.error('Marked as wasted — streak reset');
    } catch (err) {
      setItems(previous);
      toast.error(err instanceof Error ? err.message : 'Failed to update item');
    }
  }, [items, evaluateStreak]);

  const handleDeleteItem = useCallback(async (id: string) => {
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteFoodItem(id);
      toast.success('Item removed');
    } catch (err) {
      setItems(previous);
      toast.error(err instanceof Error ? err.message : 'Failed to delete item');
    }
  }, [items]);

  const handleDeleteRecipe = useCallback(async (id: string) => {
    const previous = recipes;
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    try {
      await deleteRecipe(id);
      toast.success('Recipe deleted');
    } catch (err) {
      setRecipes(previous);
      toast.error(err instanceof Error ? err.message : 'Failed to delete recipe');
    }
  }, [recipes]);

  const handleAddRecipe = useCallback(async (recipe: {
    title: string; description: string; ingredients: RecipeIngredient[];
    instructions: string[]; prep_time_mins: number;
  }) => {
    try {
      const saved = await insertRecipe(householdId, userId, recipe);
      setRecipes((prev) => [saved, ...prev]);
      toast.success(`${recipe.title} created`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create recipe');
      throw err;
    }
  }, [householdId, userId]);

  const handleCookRecipe = useCallback(async (recipe: Recipe) => {
    const updatedItems: FoodItem[] = [];
    const errors: string[] = [];
    const results = await Promise.all(
      recipe.ingredients.map(async (ing) => {
        const matching = items.find(
          (i) => i.status === 'fresh' &&
            (i.name.toLowerCase().includes(ing.item_name.toLowerCase()) ||
             ing.item_name.toLowerCase().includes(i.name.toLowerCase()))
        );
        if (!matching) return null;
        const qtyMatch = parseFloat(ing.quantity);
        const deduct = isNaN(qtyMatch) ? 1 : qtyMatch;
        try {
          return await deductFoodItemQuantity(matching.id, deduct);
        } catch {
          errors.push(matching.name);
          return null;
        }
      })
    );

    for (const updated of results) {
      if (updated) updatedItems.push(updated);
    }

    if (updatedItems.length > 0) {
      setItems((prev) => prev.map((i) => {
        const updated = updatedItems.find((u) => u.id === i.id);
        return updated ?? i;
      }));
      toast.success(`Cooked ${recipe.title} — inventory updated`);
    } else {
      toast.info('No matching inventory items found for this recipe');
    }

    if (errors.length > 0) {
      toast.error(`Could not update: ${errors.join(', ')}`);
    }
  }, [items]);

  const handleAddGroceryItems = useCallback(async (items: Array<{
    item_name: string; suggested_quantity: number; unit: GroceryListItem['unit'];
  }>) => {
    try {
      await autoGenerateGroceryItems(householdId, items);
      const refreshed = await fetchGroceryList(householdId);
      setGroceryItems(refreshed);
      toast.success(`Generated ${items.length} item${items.length === 1 ? '' : 's'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate list');
    }
  }, [householdId]);

  const handleAddGroceryItem = useCallback(async (item: {
    item_name: string; suggested_quantity: number; unit: GroceryListItem['unit'];
  }) => {
    try {
      const saved = await insertGroceryItem(householdId, item);
      setGroceryItems((prev) => [saved, ...prev]);
      toast.success(`${item.item_name} added to grocery list`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add grocery item');
      throw err;
    }
  }, [householdId]);

  const handleToggleGrocery = useCallback(async (id: string, isPurchased: boolean) => {
    const previous = groceryItems;
    setGroceryItems((prev) => prev.map((g) => g.id === id ? { ...g, is_purchased: isPurchased } : g));
    try {
      await toggleGroceryItemPurchased(id, isPurchased);
    } catch (err) {
      setGroceryItems(previous);
      toast.error(err instanceof Error ? err.message : 'Failed to update item');
    }
  }, [groceryItems]);

  const handleDeleteGrocery = useCallback(async (id: string) => {
    const previous = groceryItems;
    setGroceryItems((prev) => prev.filter((g) => g.id !== id));
    try {
      await deleteGroceryItem(id);
      toast.success('Item removed from list');
    } catch (err) {
      setGroceryItems(previous);
      toast.error(err instanceof Error ? err.message : 'Failed to delete item');
    }
  }, [groceryItems]);

  const handleAutoGenerate = useCallback(async (newItems: Array<{
    item_name: string; suggested_quantity: number; unit: GroceryListItem['unit'];
  }>) => {
    try {
      await autoGenerateGroceryItems(householdId, newItems);
      const refreshed = await fetchGroceryList(householdId);
      setGroceryItems(refreshed);
      toast.success(`Generated ${newItems.length} item${newItems.length === 1 ? '' : 's'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate list');
    }
  }, [householdId]);

  const userName = profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'there';

  const tabs: { key: DashboardTab; label: string; emoji: string; icon: typeof Package }[] = [
    { key: 'inventory', label: 'Inventory', emoji: '📦', icon: Package },
    { key: 'scan', label: 'Scan', emoji: '📷', icon: ScanLine },
    { key: 'recipes', label: 'Recipes', emoji: '👨‍🍳', icon: ChefHat },
    { key: 'grocery', label: 'Grocery List', emoji: '🛒', icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <header className="bg-gradient-to-b from-emerald-50 to-[#FDFBF7] px-5 pt-6 pb-4 lg:px-6 lg:pt-8 lg:pb-6 lg:rounded-b-3xl">
        <div className="lg:max-w-6xl lg:mx-auto">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-sage-500 shadow-sm lg:w-12 lg:h-12">
                <Leaf className="w-5 h-5 text-white lg:w-6 lg:h-6" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none lg:text-3xl">
                  FreshSaver <span className="text-xl lg:text-2xl">🥗</span>
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5 lg:text-sm">
                  Hi, {userName} · {household?.name ?? 'Personal Pantry'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {household && (
                <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3 py-2">
                <Users className="w-4 h-4 text-sage-500" strokeWidth={2.5} />
                <span className="text-xs font-bold text-slate-600">{household.join_code}</span>
              </div>
              )}
              <button onClick={() => signOut()}
                  className="flex items-center gap-1.5 rounded-xl bg-white text-slate-800 border border-slate-300 px-3 py-2 text-xs font-bold hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95">
                <LogOut className="w-4 h-4" strokeWidth={2.5} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200 px-3 py-3 shadow-sm hover:scale-[1.02] transition-all duration-200">
              <div className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" strokeWidth={2.5} />
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Streak</span>
              </div>
              <p className="text-lg font-black text-slate-900 mt-0.5">{streak}d 🔥</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-lime-100 border border-emerald-200 px-3 py-3 shadow-sm hover:scale-[1.02] transition-all duration-200">
              <div className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Saved</span>
              </div>
              <p className="text-lg font-black text-emerald-700 mt-0.5">${moneySaved.toFixed(2)} 💰</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-red-100 border border-rose-200 px-3 py-3 shadow-sm hover:scale-[1.02] transition-all duration-200">
              <div className="flex items-center gap-1">
                <Recycle className="w-3.5 h-3.5 text-rose-500" strokeWidth={2.5} />
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wide">Rescued</span>
              </div>
              <p className="text-lg font-black text-slate-900 mt-0.5">{consumedCount} 🥗</p>
            </div>
            <div className="relative rounded-2xl bg-gradient-to-br from-violet-50 to-purple-100 border border-violet-200 px-3 py-3 shadow-sm group hover:scale-[1.02] transition-all duration-200">
              <div className="flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5 text-violet-600" strokeWidth={2.5} />
                <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wide">Pantry</span>
              </div>
              <PantryHealthWidget 
                pantryScore={pantryScore} 
                expiringCount={expiringCount}
              />
            </div>
          </div>

          {/* Impact Tracker Widget */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white shadow-xl shadow-emerald-200 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-32 h-32" strokeWidth={1} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Recycle className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-black tracking-tight">Your Impact Tracker</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-100 opacity-80">Streak</span>
                  <span className="text-2xl font-black">{streak} Days</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-100 opacity-80">Saved</span>
                  <span className="text-2xl font-black">${moneySaved.toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-100 opacity-80">Rescued</span>
                  <span className="text-2xl font-black">{consumedCount} Items</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Tab navigation — desktop only (mobile uses bottom nav) */}
      <div className="hidden lg:block sticky top-0 z-30 bg-cream-50/90 backdrop-blur-md border-b border-sage-100 lg:max-w-6xl lg:mx-auto">
        <div className="flex items-center gap-1 px-5 py-2 lg:px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all active:scale-95 ${
                    isActive ? 'bg-sage-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                  }`}>
                <Icon className="w-4 h-4" strokeWidth={2.5} />
                <span className="text-base leading-none">{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="lg:max-w-6xl lg:mx-auto lg:px-6 lg:pt-6 pb-24 lg:pb-8">
        {error && (
          <div className="mx-5 mt-4 rounded-2xl bg-coral-50 border border-coral-200 px-4 py-3 lg:mx-0">
            <p className="text-sm font-bold text-coral-700">{error}</p>
            <button onClick={() => setError(null)} className="text-xs text-coral-500 font-medium mt-1">Dismiss</button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-sage-400 animate-spin" strokeWidth={2} />
            <p className="text-sm text-slate-400 font-medium mt-3">Loading your data...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'inventory' && (
                <InventoryView
                  items={items}
                  categories={categories}
                  streak={streak}
                  loading={loading}
                  onAddItem={async (item) => {
                    await handleAddItem(item);
                  }}
                  onUpdateStatus={handleUpdateStatus}
                  onDeleteItem={handleDeleteItem}
                />
              )}
              {activeTab === 'scan' && (
                <ScanView
                  categories={categories}
                  onAddItems={async (items) => {
                    await handleAddItems(items);
                  }}
                  loading={loading}
                />
              )}
              {activeTab === 'recipes' && (
                <RecipesView
                  recipes={recipes}
                  foodItems={items}
                  loading={loading}
                  onDeleteRecipe={handleDeleteRecipe}
                  onAddRecipe={handleAddRecipe}
                  onCookRecipe={handleCookRecipe}
                  onAddGroceryItems={handleAddGroceryItems}
                />
              )}
              {activeTab === 'grocery' && (
                <GroceryView
                  items={groceryItems}
                  foodItems={items}
                  familyMembersCount={household?.family_members_count ?? 1}
                  loading={loading}
                  onAddItem={handleAddGroceryItem}
                  onTogglePurchased={handleToggleGrocery}
                  onDeleteItem={handleDeleteGrocery}
                  onAutoGenerate={handleAutoGenerate}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
