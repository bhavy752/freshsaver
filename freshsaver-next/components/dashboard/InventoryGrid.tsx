'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { PackageOpen, Plus, ScanLine, SearchX } from 'lucide-react';
import type { FoodItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InventoryItemCard } from '@/components/dashboard/InventoryItemCard';
import { InventorySkeleton } from '@/components/dashboard/InventorySkeleton';

interface InventoryGridProps {
  items: FoodItem[];
  totalItems: number;
  loading: boolean;
  hasFilters: boolean;
  onClearFilters: () => void;
  onAdd: () => void;
  onScan: () => void;
  onRecipe: (item: FoodItem) => void;
  onDelete: (item: FoodItem) => void;
}

export function InventoryGrid({
  items,
  totalItems,
  loading,
  hasFilters,
  onClearFilters,
  onAdd,
  onScan,
  onRecipe,
  onDelete,
}: InventoryGridProps) {
  if (loading) return <InventorySkeleton />;

  if (items.length === 0) {
    if (totalItems === 0) {
      return (
        <EmptyState
          icon={PackageOpen}
          title="Your pantry is waiting"
          description="Scan your first receipt or add an item manually. FreshSaver will track every expiry date and turn what needs eating into a rescue recipe."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={onScan}>
                <ScanLine className="h-4 w-4" />
                Scan a receipt
              </Button>
              <Button variant="outline" onClick={onAdd}>
                <Plus className="h-4 w-4" />
                Add an item
              </Button>
            </div>
          }
        />
      );
    }

    return (
      <EmptyState
        icon={SearchX}
        title="No matches on this shelf"
        description={
          hasFilters
            ? 'Try another category or expiry filter — your pantry has more to show.'
            : 'There are no items to show right now.'
        }
        action={
          hasFilters ? (
            <Button variant="outline" onClick={onClearFilters}>
              Clear filters
            </Button>
          ) : (
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4" />
              Add an item
            </Button>
          )
        }
      />
    );
  }

  return (
    <motion.div layout className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <InventoryItemCard
            key={item.id}
            item={item}
            onRecipe={onRecipe}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
