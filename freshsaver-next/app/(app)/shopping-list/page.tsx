import type { Metadata } from 'next';
import { ShoppingListView } from '@/components/shopping/ShoppingListView';

export const metadata: Metadata = {
  title: 'Shopping list',
  description: 'An auto-built shopping list from your pantry’s low-stock signals.',
};

export default function ShoppingListPage() {
  return <ShoppingListView />;
}
