'use client';

import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Clock3,
  Package,
  PiggyBank,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import type { DashboardMetrics } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export function MetricsBar({ metrics }: { metrics: DashboardMetrics }) {
  const cards = [
    {
      label: 'Total items',
      value: String(metrics.totalItems),
      detail: 'Across your shared pantry',
      icon: Package,
      className: 'border-ink-100 bg-white',
      iconClass: 'bg-emerald-50 text-emerald-600',
      valueClass: 'text-ink-950',
      detailClass: 'text-ink-400',
      badge: null,
    },
    {
      label: 'Expiring soon',
      value: String(metrics.expiringSoon),
      detail: metrics.expiringSoon > 0 ? 'Needs a rescue plan' : 'Nothing urgent today',
      icon: Clock3,
      className: 'border-amber-200 bg-amber-50/70',
      iconClass: 'bg-amber-100 text-amber-700',
      valueClass: 'text-amber-900',
      detailClass: 'text-amber-700/70',
      badge: metrics.expiringSoon > 0 ? 'Act now' : null,
      pulse: metrics.expiringSoon > 0,
    },
    {
      label: 'Expired',
      value: String(metrics.expired),
      detail: metrics.expired > 0 ? 'Ready for the bin' : 'Nothing wasted',
      icon: Trash2,
      className: 'border-coral-200 bg-coral-50/60',
      iconClass: 'bg-coral-100 text-coral-600',
      valueClass: 'text-coral-700',
      detailClass: 'text-coral-600/60',
      badge: metrics.expired > 0 ? 'Rescue' : null,
    },
    {
      label: 'Money saved',
      value: formatCurrency(metrics.moneySaved),
      detail: 'This month’s rescued value',
      icon: PiggyBank,
      className: 'border-ink-800 bg-ink-950 text-white',
      iconClass: 'bg-emerald-400/15 text-emerald-300',
      valueClass: 'text-white',
      detailClass: 'text-white/40',
      badge: null,
      dark: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`relative overflow-hidden rounded-2xl border p-4 shadow-[0_18px_50px_-38px_rgba(6,78,59,0.35)] sm:p-5 ${card.className}`}
          >
            {card.dark ? (
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-400/15 blur-2xl" />
            ) : null}

            <div className="flex items-start justify-between gap-2">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconClass} ${
                  card.pulse ? 'animate-pulse-ring' : ''
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              {card.badge ? (
                <span
                  className={`rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${
                    card.label === 'Expired'
                      ? 'bg-coral-100 text-coral-600'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {card.badge}
                </span>
              ) : card.label === 'Money saved' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-300">
                  <TrendingUp className="h-2.5 w-2.5" />
                  +18%
                </span>
              ) : null}
            </div>

            <p className={`mt-3 text-2xl font-black tracking-[-0.05em] sm:text-3xl ${card.valueClass}`}>
              {card.value}
            </p>
            <p className={`mt-0.5 text-[10px] font-black uppercase tracking-[0.1em] ${card.detailClass}`}>
              {card.label}
            </p>
            <p className={`mt-2 text-[10px] font-semibold ${card.detailClass}`}>{card.detail}</p>

            {card.label === 'Money saved' ? (
              <div className="mt-3 flex items-center gap-1 text-[9px] font-bold text-emerald-300/70">
                <ArrowUpRight className="h-3 w-3" />
                Keep rescuing to grow this
              </div>
            ) : null}
          </motion.div>
        );
      })}
    </div>
  );
}
