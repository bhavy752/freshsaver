'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Check,
  Leaf,
  ScanLine,
  Sparkles,
  Star,
  TrendingDown,
  Users,
} from 'lucide-react';

const pantryRows = [
  { emoji: '🥑', name: 'Avocados', detail: '3 left · use today', tone: 'amber' },
  { emoji: '🥛', name: 'Oat milk', detail: '1 carton · 2 days', tone: 'amber' },
  { emoji: '🥬', name: 'Baby spinach', detail: 'rescued into shakshuka', tone: 'emerald' },
  { emoji: '🥖', name: 'Sourdough', detail: '5 days fresh', tone: 'emerald' },
];

const toneClasses: Record<string, string> = {
  amber: 'border-amber-200/80 bg-amber-50 text-amber-700',
  emerald: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
};

export function AuthShowcase() {
  const [impact, setImpact] = useState({ meals: 184_203, saved: 1_284_500, co2: 42_180 });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setImpact((current) => ({
        meals: current.meals + 3,
        saved: current.saved + 19,
        co2: current.co2 + 2,
      }));
    }, 2600);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <aside className="relative hidden min-h-screen overflow-hidden bg-ink-950 lg:flex lg:flex-col">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(16,185,129,0.32),transparent_34%),radial-gradient(circle_at_82%_88%,rgba(251,191,36,0.16),transparent_34%)]" />
      <div className="absolute inset-0 bg-grid-emerald bg-[size:44px_44px] opacity-30" />
      <div className="noise absolute inset-0" />

      <div className="relative z-10 flex items-center justify-between px-10 pt-9">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-ink-950 shadow-lg shadow-emerald-500/20">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="text-lg font-black tracking-[-0.04em] text-white">FreshSaver</span>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
          </span>
          Live kitchen
        </span>
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center px-10 py-12 xl:px-14">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
            <Sparkles className="h-3.5 w-3.5" />
            AI pantry intelligence
          </span>
          <h1 className="mt-5 text-balance text-5xl font-black leading-[0.98] tracking-[-0.055em] text-white xl:text-6xl">
            Your kitchen,
            <br />
            finally in sync.
          </h1>
          <p className="mt-5 max-w-md text-sm font-medium leading-relaxed text-white/55 xl:text-base">
            Scan a receipt once. FreshSaver organizes every item, predicts what will expire,
            and turns “what’s for dinner?” into a rescue mission.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-9 max-w-xl"
        >
          <div className="glass-dark relative overflow-hidden rounded-[1.75rem] p-4">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3.5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                  The Green Table
                </p>
                <p className="mt-0.5 text-sm font-black text-white">Today’s pantry</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-200">
                  <ScanLine className="h-3 w-3" />
                  Synced
                </span>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {pantryRows.map((row, index) => (
                <motion.div
                  key={row.name}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.28 + index * 0.08, duration: 0.4 }}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.045] px-3 py-2.5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-lg">
                    {row.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">{row.name}</p>
                    <p className="mt-0.5 truncate text-[10px] font-medium text-white/35">
                      {row.detail}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${toneClasses[row.tone]}`}
                  >
                    {row.tone === 'amber' ? 'Rescue' : 'Fresh'}
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.07] px-3.5 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                  <TrendingDown className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-200/60">
                    Waste avoided this month
                  </p>
                  <p className="text-sm font-black text-white">$248.40</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-300">
                +18%
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -right-6 -top-8 hidden w-44 rounded-2xl border border-white/10 bg-ink-900/80 p-3.5 shadow-2xl backdrop-blur-xl xl:block"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/40">
                Rescue recipe
              </p>
            </div>
            <p className="mt-2 text-xs font-black leading-snug text-white">
              Green shakshuka in 18 min
            </p>
            <p className="mt-1 text-[9px] font-medium text-white/35">
              Uses spinach, eggs & feta
            </p>
          </motion.div>

          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            className="absolute -bottom-7 -left-6 hidden w-44 rounded-2xl border border-white/10 bg-ink-900/80 p-3.5 shadow-2xl backdrop-blur-xl xl:block"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
                <Users className="h-3.5 w-3.5" />
              </span>
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/40">
                Household
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex -space-x-2">
                {['AC', 'MJ', 'SR'].map((initials, index) => (
                  <span
                    key={initials}
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink-900 text-[7px] font-black text-ink-950 ${
                      index === 0
                        ? 'bg-emerald-300'
                        : index === 1
                          ? 'bg-amber-300'
                          : 'bg-white/80'
                    }`}
                  >
                    {initials}
                  </span>
                ))}
              </div>
              <p className="text-[9px] font-bold text-white/50">4 in sync</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-10 grid max-w-xl grid-cols-3 gap-3"
        >
          {[
            { label: 'Meals rescued', value: impact.meals, format: 'number' },
            { label: 'Saved by cooks', value: impact.saved, format: 'currency' },
            { label: 'kg CO₂ avoided', value: impact.co2, format: 'number' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-3"
            >
              <p className="text-sm font-black tracking-[-0.03em] text-white">
                {stat.format === 'currency'
                  ? `$${Math.round(stat.value).toLocaleString('en-US')}`
                  : Math.round(stat.value).toLocaleString('en-US')}
              </p>
              <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-white/30">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="relative z-10 flex items-center justify-between border-t border-white/10 px-10 py-5">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {['MC', 'JR', 'AL', 'PK'].map((initials, index) => (
              <span
                key={initials}
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink-950 text-[8px] font-black text-ink-950 ${
                  ['bg-emerald-300', 'bg-amber-300', 'bg-white/80', 'bg-coral-300'][index]
                }`}
              >
                {initials}
              </span>
            ))}
          </div>
          <div>
            <div className="flex items-center gap-1 text-amber-300">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-3 w-3 fill-current" />
              ))}
            </div>
            <p className="mt-0.5 text-[9px] font-bold text-white/35">
              Loved by 12,000+ home cooks
            </p>
          </div>
        </div>
        <p className="hidden max-w-[15rem] text-right text-[10px] font-medium leading-relaxed text-white/30 xl:block">
          “We haven’t thrown away a bag of spinach in three weeks.”
        </p>
      </div>
    </aside>
  );
}
