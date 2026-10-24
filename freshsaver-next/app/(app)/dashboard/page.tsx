import type { Metadata } from 'next';
import { DashboardView } from '@/components/dashboard/DashboardView';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your live pantry, expiry radar, and household savings.',
};

export default function DashboardPage() {
  return <DashboardView />;
}
