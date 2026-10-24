import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  Clock3,
  Leaf,
  ScanLine,
  Sparkles,
  TrendingDown,
  Users,
} from 'lucide-react';

type ItemStatus = 'urgent' | 'soon' | 'fresh';

interface PreviewItem {
  emoji: string;
  name: string;
  quantity: string;
  location: string;
  status: ItemStatus;
  label: string;
  days: number;
  hours: number;
  progress: number;
}

const PREVIEW_ITEMS: PreviewItem[] = [
  {
    emoji: '🥑',
    name: 'Avocados',
    quantity: '3 pcs',
    location: 'Fridge',
    status: 'urgent',
    label: 'Eat today',
    days: 0,
    hours: 7,
    progress: 96,
  },
  {
    emoji: '🥛',
    name: 'Oat milk',
    quantity: '1 liter',
    location: 'Fridge',
    status: 'soon',
    label: '2 days left',
    days: 2,
    hours: 14,
    progress: 68,
  },
  {
    emoji: '🍓',
    name: 'Strawberries',
    quantity: '1 punnet',
    location: 'Fridge',
    status: 'soon',
    label: '3 days left',
    days: 3,
    hours: 5,
    progress: 52,
  },
  {
    emoji: '🥦',
    name: 'Broccoli',
    quantity: '2 heads',
    location: 'Crisper',
    status: 'fresh',
    label: '6 days left',
    days: 6,
    hours: 2,
    progress: 24,
  },
];

const STATUS_STYLES: Record<ItemStatus, { dot: string; text: string; badge: string; bar: string }> = {
  urgent: {
    dot: 'bg-rose-400 shadow-[0_0_0_4px_rgba(251,113,133,0.14)]',
    text: 'text-rose-300',
    badge: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
    bar: 'bg-gradient-to-r from-rose-400 to-coral-400',
  },
  soon: {
    dot: 'bg-amber-300 shadow-[0_0_0_4px_rgba(252,211,77,0.14)]',
    text: 'text-amber-200',
    badge: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
    bar: 'bg-gradient-to-r from-amber-300 to-orange-400',
  },
  fresh: {
    dot: 'bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.14)]',
    text: 'text-emerald-200',
    badge: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
    bar: 'bg-gradient-to-r from-emerald-400 to-lime-300',
  },
};

export function HeroPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const activeItem = PREVIEW_ITEMS[activeIndex];

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % PREVIEW_ITEMS.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [paused]);

  const countdown = activeItem.days === 0
    ? `${activeItem.hours}h left`
    : `${activeItem.days}d ${activeItem.hours}h`;

  return (
    <div
      className="relative mx-auto w-full min-w-0 max-w-[510px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute -inset-10 rounded-full bg-emerald-400/20 blur-[80px]" />
      <div className="absolute -right-8 top-1/3 h-44 w-44 rounded-full bg-lime-300/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30, rotate: 1.5 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        <div className="rounded-[2rem] border border-white/15 bg-white/10 p-2.5 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="overflow-hidden rounded-[1.55rem] border border-white/10 bg-[#081711] shadow-inner">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5 sm:px-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/25">
                  <Leaf className="h-4 w-4 text-[#052e1b]" strokeWidth={2.5} />
                </span>
                <div>
                  <p className="text-xs font-black tracking-tight text-white">Family pantry</p>
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Live · synced just now
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden items-center -space-x-2 sm:flex">
                  {['👩🏽', '👨🏻', '🧑🏾'].map((avatar) => (
                    <span
                      key={avatar}
                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#081711] bg-slate-800 text-[11px]"
                    >
                      {avatar}
                    </span>
                  ))}
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300">
                  <Bell className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Critical', value: '1', className: 'text-rose-300 bg-rose-400/10 border-rose-400/15' },
                  { label: 'Soon', value: '2', className: 'text-amber-200 bg-amber-300/10 border-amber-300/15' },
                  { label: 'Fresh', value: '15', className: 'text-emerald-200 bg-emerald-400/10 border-emerald-400/15' },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-xl border px-2.5 py-2 ${stat.className}`}>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] opacity-70">{stat.label}</p>
                    <p className="mt-0.5 text-lg font-black leading-none">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {PREVIEW_ITEMS.map((item, index) => {
                  const styles = STATUS_STYLES[item.status];
                  const isActive = activeIndex === index;
                  return (
                    <motion.button
                      key={item.name}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      aria-pressed={isActive}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.99 }}
                      className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-300 ${
                        isActive
                          ? 'border-emerald-400/40 bg-emerald-400/[0.11] shadow-lg shadow-emerald-950/20'
                          : 'border-white/[0.07] bg-white/[0.035] hover:border-white/15 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-xl shadow-inner">
                        {item.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-bold text-white">{item.name}</span>
                          <span className={`shrink-0 text-[10px] font-black ${styles.text}`}>{item.label}</span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                          <span>{item.quantity}</span>
                          <span className="text-slate-600">·</span>
                          <span>{item.location}</span>
                        </span>
                        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/[0.07]">
                          <motion.span
                            initial={{ width: 0 }}
                            animate={{ width: `${item.progress}%` }}
                            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                            className={`block h-full rounded-full ${styles.bar}`}
                          />
                        </span>
                      </span>
                      <span className={`h-2 w-2 shrink-0 rounded-full ${styles.dot} ${isActive ? 'animate-pulse' : ''}`} />
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeItem.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-3"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-lime-300/10 text-2xl">
                    {activeItem.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-300">Smart nudge</p>
                    <p className="truncate text-xs font-bold text-white">
                      {activeItem.status === 'urgent'
                        ? `Use ${activeItem.name.toLowerCase()} in tonight's dinner`
                        : `${activeItem.name} is still good to go`}
                    </p>
                  </div>
                  <span className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black ${STATUS_STYLES[activeItem.status].badge}`}>
                    <Clock3 className="h-3 w-3" />
                    {countdown}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="absolute -left-32 top-28 hidden items-center gap-2.5 rounded-2xl border border-white/15 bg-[#0b2117]/90 px-3.5 py-2.5 shadow-xl shadow-black/30 backdrop-blur-xl min-[1360px]:flex"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
            <ScanLine className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-black text-white">Receipt scanned</p>
            <p className="flex items-center gap-1 text-[9px] font-semibold text-emerald-300">
              <CheckCheck className="h-3 w-3" /> 18 items added
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20, y: -10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute -right-16 bottom-32 hidden items-center gap-2.5 rounded-2xl border border-white/15 bg-[#0b2117]/90 px-3.5 py-2.5 shadow-xl shadow-black/30 backdrop-blur-xl min-[1360px]:flex"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lime-300/15 text-lime-300">
            <TrendingDown className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-black text-white">$86 saved</p>
            <p className="text-[9px] font-semibold text-slate-400">this month</p>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-4 -top-4 hidden rounded-2xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 backdrop-blur-md sm:block"
        >
          <p className="flex items-center gap-1.5 text-[10px] font-black text-amber-100">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            AI meal idea ready
          </p>
        </motion.div>
      </motion.div>

      <div className="mt-4 flex items-center justify-center gap-4 text-[10px] font-semibold text-slate-400">
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-emerald-400" /> 4 syncs today
        </span>
        <span className="h-1 w-1 rounded-full bg-slate-600" />
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-300" /> AI organised
        </span>
      </div>
    </div>
  );
}
