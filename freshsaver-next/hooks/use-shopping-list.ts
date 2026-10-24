'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Category, FoodItem, GroceryItem } from '@/lib/types';
import { DEMO_GROCERY_ITEMS } from '@/lib/demo-data';
import { deriveLowStock } from '@/lib/inventory';
import { generateId, sleep } from '@/lib/utils';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  autoGenerateGroceryItems,
  deleteGroceryItem,
  fetchGroceryItems,
  insertGroceryItem,
  toggleGroceryItem,
} from '@/services/grocery';
import { useSyncStatus } from '@/components/providers/sync-provider';

interface UseShoppingListOptions {
  demo: boolean;
  householdId: string | null;
  inventory: FoodItem[];
  categories: Category[];
}

function mergeDerivedItems(
  current: GroceryItem[],
  derived: ReturnType<typeof deriveLowStock>,
  householdId: string | null
): GroceryItem[] {
  const existing = new Set(current.map((item) => item.item_name.trim().toLowerCase()));
  const additions: GroceryItem[] = [];

  for (const suggestion of derived) {
    const key = suggestion.item_name.trim().toLowerCase();
    if (!key || existing.has(key)) continue;
    existing.add(key);
    additions.push({
      id: generateId(),
      household_id: householdId ?? 'demo-household',
      item_name: suggestion.item_name,
      suggested_quantity: suggestion.suggested_quantity,
      unit: suggestion.unit,
      is_purchased: false,
      auto_generated: true,
      category_name: suggestion.category_name,
      created_at: new Date().toISOString(),
    });
  }

  return [...additions, ...current];
}

export function useShoppingList({
  demo,
  householdId,
  inventory,
  categories,
}: UseShoppingListOptions) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { beginSync, endSync, markSynced } = useSyncStatus();
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  const [items, setItems] = useState<GroceryItem[]>(
    demo ? DEMO_GROCERY_ITEMS : []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      if (!silent) setLoading(true);
      setError(null);

      if (demo) {
        await sleep(350);
        if (mountedRef.current) {
          setItems((current) => mergeDerivedItems(current, deriveLowStock(inventory), householdId));
          setLoading(false);
        }
        loadingRef.current = false;
        return;
      }

      if (!supabase || !householdId) {
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      beginSync();
      try {
        let nextItems = await fetchGroceryItems(supabase, householdId);
        const existingNames = new Set(
          nextItems.map((item) => item.item_name.trim().toLowerCase())
        );
        const missing = deriveLowStock(inventory).filter(
          (item) => !existingNames.has(item.item_name.trim().toLowerCase())
        );

        if (missing.length > 0) {
          const generated = await autoGenerateGroceryItems(supabase, householdId, missing);
          nextItems = [...generated, ...nextItems];
        }

        if (mountedRef.current) {
          setItems(nextItems);
          markSynced();
        }
      } catch (loadError) {
        if (mountedRef.current) {
          setError(
            loadError instanceof Error ? loadError.message : 'Failed to load shopping list'
          );
        }
      } finally {
        endSync();
        if (mountedRef.current) setLoading(false);
        loadingRef.current = false;
      }
    },
    [demo, householdId, inventory, supabase, beginSync, endSync, markSynced]
  );

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  useEffect(() => {
    if (!demo) return;
    setItems((current) => mergeDerivedItems(current, deriveLowStock(inventory), householdId));
  }, [demo, inventory, householdId]);

  useEffect(() => {
    if (demo || !supabase || !householdId) return;

    const channel = supabase
      .channel(`shopping-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grocery_list',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          void load(true);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [demo, supabase, householdId, load]);

  const addCustomItem = useCallback(
    async (name: string): Promise<GroceryItem> => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('Give the item a name first.');

      const category =
        categories.find((entry) =>
          trimmed.toLowerCase().includes(entry.name.split(' ')[0].toLowerCase())
        )?.name ?? 'Pantry & Grains';

      if (demo) {
        const item: GroceryItem = {
          id: generateId(),
          household_id: householdId ?? 'demo-household',
          item_name: trimmed,
          suggested_quantity: 1,
          unit: 'pcs',
          is_purchased: false,
          auto_generated: false,
          category_name: category,
          created_at: new Date().toISOString(),
        };
        setItems((current) => [item, ...current]);
        markSynced();
        return item;
      }

      if (!supabase || !householdId) throw new Error('Supabase is not configured.');
      const created = await insertGroceryItem(supabase, householdId, {
        item_name: trimmed,
        suggested_quantity: 1,
        unit: 'pcs',
      });
      setItems((current) => [created, ...current]);
      markSynced();
      return created;
    },
    [demo, householdId, categories, supabase, markSynced]
  );

  const togglePurchased = useCallback(
    async (id: string): Promise<void> => {
      const currentItem = items.find((item) => item.id === id);
      if (!currentItem) return;
      const nextValue = !currentItem.is_purchased;

      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, is_purchased: nextValue } : item
        )
      );

      if (demo) {
        markSynced();
        return;
      }

      try {
        if (!supabase) throw new Error('Supabase is not configured.');
        await toggleGroceryItem(supabase, id, nextValue);
        markSynced();
      } catch (toggleError) {
        setItems((current) =>
          current.map((item) =>
            item.id === id ? { ...item, is_purchased: !nextValue } : item
          )
        );
        throw toggleError;
      }
    },
    [items, demo, supabase, markSynced]
  );

  const removeItem = useCallback(
    async (id: string): Promise<void> => {
      if (!demo) {
        if (!supabase) throw new Error('Supabase is not configured.');
        await deleteGroceryItem(supabase, id);
      }
      setItems((current) => current.filter((item) => item.id !== id));
      markSynced();
    },
    [demo, supabase, markSynced]
  );

  const clearPurchased = useCallback(async (): Promise<void> => {
    const purchased = items.filter((item) => item.is_purchased);
    if (purchased.length === 0) return;

    if (!demo) {
      if (!supabase) throw new Error('Supabase is not configured.');
      await Promise.all(purchased.map((item) => deleteGroceryItem(supabase, item.id)));
    }

    setItems((current) => current.filter((item) => !item.is_purchased));
    markSynced();
  }, [items, demo, supabase, markSynced]);

  return {
    items,
    loading,
    error,
    addCustomItem,
    togglePurchased,
    removeItem,
    clearPurchased,
    refresh: load,
  };
}
