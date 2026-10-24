'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Category, FoodItem } from '@/lib/types';
import { DEMO_CATEGORIES, DEMO_FOOD_ITEMS } from '@/lib/demo-data';
import { generateId, sleep } from '@/lib/utils';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  deleteFoodItem,
  deductFoodItemQuantity,
  fetchCategories,
  fetchFoodItems,
  insertFoodItem,
  insertFoodItemsBulk,
  type FoodItemInput,
} from '@/services/foodItems';
import { useSyncStatus } from '@/components/providers/sync-provider';

interface UseInventoryOptions {
  demo: boolean;
  householdId: string | null;
  userId: string | null;
  initialItems?: FoodItem[];
}

function sortByExpiry(items: FoodItem[]): FoodItem[] {
  return [...items].sort(
    (first, second) =>
      new Date(first.expires_at).getTime() - new Date(second.expires_at).getTime()
  );
}

function itemFromInput(
  input: FoodItemInput,
  householdId: string | null,
  userId: string | null,
  categories: Category[]
): FoodItem {
  return {
    id: generateId(),
    household_id: householdId,
    added_by: userId,
    category_id: input.category_id,
    category: categories.find((category) => category.id === input.category_id) ?? null,
    name: input.name,
    quantity: input.quantity,
    original_quantity: input.original_quantity ?? input.quantity,
    unit: input.unit,
    status: 'active',
    storage_location: input.storage_location,
    barcode: input.barcode,
    estimated_cost: input.estimated_cost,
    created_at: new Date().toISOString(),
    expires_at: input.expires_at,
  };
}

export function useInventory({
  demo,
  householdId,
  userId,
  initialItems,
}: UseInventoryOptions) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { beginSync, endSync, markSynced } = useSyncStatus();
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  const [items, setItems] = useState<FoodItem[]>(
    initialItems ?? (demo ? DEMO_FOOD_ITEMS : [])
  );
  const [categories, setCategories] = useState<Category[]>(demo ? DEMO_CATEGORIES : []);
  const [loading, setLoading] = useState(!initialItems);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      if (!silent) setLoading(true);
      setError(null);

      if (demo) {
        await sleep(initialItems ? 0 : 450);
        if (mountedRef.current) {
          setItems(initialItems ?? DEMO_FOOD_ITEMS);
          setCategories(DEMO_CATEGORIES);
          setLoading(false);
        }
        loadingRef.current = false;
        return;
      }

      if (!supabase || !userId) {
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      beginSync();
      try {
        const [nextItems, nextCategories] = await Promise.all([
          fetchFoodItems(supabase, householdId, userId),
          fetchCategories(supabase),
        ]);
        if (mountedRef.current) {
          setItems(sortByExpiry(nextItems));
          setCategories(nextCategories);
          markSynced();
        }
      } catch (loadError) {
        if (mountedRef.current) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load inventory');
        }
      } finally {
        endSync();
        if (mountedRef.current) setLoading(false);
        loadingRef.current = false;
      }
    },
    [
      demo,
      householdId,
      userId,
      supabase,
      initialItems,
      beginSync,
      endSync,
      markSynced,
    ]
  );

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  useEffect(() => {
    if (demo || !supabase || !householdId) return;

    const channel = supabase
      .channel(`inventory-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_items',
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

  const addItem = useCallback(
    async (input: FoodItemInput): Promise<FoodItem> => {
      if (demo) {
        const next = itemFromInput(input, householdId, userId, categories);
        setItems((current) => sortByExpiry([next, ...current]));
        markSynced();
        return next;
      }

      if (!supabase) throw new Error('Supabase is not configured.');
      const created = await insertFoodItem(supabase, householdId, userId, input);
      setItems((current) => sortByExpiry([created, ...current]));
      markSynced();
      return created;
    },
    [demo, householdId, userId, categories, supabase, markSynced]
  );

  const addItems = useCallback(
    async (inputs: FoodItemInput[]): Promise<FoodItem[]> => {
      if (inputs.length === 0) return [];

      if (demo) {
        const created = inputs.map((input) =>
          itemFromInput(input, householdId, userId, categories)
        );
        setItems((current) => sortByExpiry([...created, ...current]));
        markSynced();
        return created;
      }

      if (!supabase) throw new Error('Supabase is not configured.');
      const created = await insertFoodItemsBulk(supabase, householdId, userId, inputs);
      setItems((current) => sortByExpiry([...created, ...current]));
      markSynced();
      return created;
    },
    [demo, householdId, userId, categories, supabase, markSynced]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      if (!demo) {
        if (!supabase) throw new Error('Supabase is not configured.');
        await deleteFoodItem(supabase, id);
      }
      setItems((current) => current.filter((item) => item.id !== id));
      markSynced();
    },
    [demo, supabase, markSynced]
  );

  const consumeItem = useCallback(
    async (id: string): Promise<void> => {
      if (demo) {
        setItems((current) =>
          current.map((item) => {
            if (item.id !== id) return item;
            const nextQuantity = item.quantity - 1;
            return nextQuantity <= 0
              ? { ...item, quantity: 0, status: 'consumed' as const }
              : { ...item, quantity: nextQuantity };
          })
        );
        markSynced();
        return;
      }

      if (!supabase) throw new Error('Supabase is not configured.');
      await deductFoodItemQuantity(supabase, id);
      setItems((current) =>
        current.map((item) => {
          if (item.id !== id) return item;
          const nextQuantity = item.quantity - 1;
          return nextQuantity <= 0
            ? { ...item, quantity: 0, status: 'consumed' as const }
            : { ...item, quantity: nextQuantity };
        })
      );
      markSynced();
    },
    [demo, supabase, markSynced]
  );

  return {
    items,
    categories,
    loading,
    error,
    addItem,
    addItems,
    deleteItem,
    consumeItem,
    refresh: load,
  };
}
