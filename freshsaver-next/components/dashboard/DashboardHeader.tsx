'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Plus, ScanLine, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DashboardMetrics } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface DashboardHeaderProps {
  firstName: string;
  metrics: DashboardMetrics;
  wasteStreak: number;
  onAdd: () => void;
  onScan: () => void;
}

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardHeader({
  firstName,
  metrics,
  wasteStreak,
  onAdd,
  onScan,
}: DashboardHeaderProps) {
  const [greeting, setGreeting] = useState('Welcome back');

  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));
  }, []);

  const rescueCopy =
    metrics.expiringSoon > 0
      ? `${metrics.expiringSoon} ${metrics.expiringSoon === 1 ? 'item needs' : 'items need'} a rescue plan today.`
      : 'Everything is fresh. Your pantry is in great shape.';

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700">
            <Sparkles className="h-2.5 w-2.5" />
            Kitchen overview
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-amber-700">
            <Flame className="h-2.5 w-2.5" />
            {wasteStreak}-day rescue streak
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-black leading-[1.04] tracking-[-0.05em] text-ink-950 sm:text-4xl">
          {greeting}, {firstName}.
        </h1>
        <p className="mt-1.5 max-w-xl text-sm font-medium leading-relaxed text-ink-500">
          {rescueCopy}{' '}
          {metrics.moneySaved > 0 ? (
            <span className="font-bold text-ink-700">
              You’ve rescued {formatCurrency(metrics.moneySaved)} so far.
            </span>
          ) : null}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button variant="outline" onClick={onScan} className="h-10 bg-white/80">
            <ScanLine className="h-4 w-4" />
            Scan receipt
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={onAdd} className="h-10">
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
