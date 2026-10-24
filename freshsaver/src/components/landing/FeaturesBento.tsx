import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BellRing,
  ChefHat,
  Check,
  Clock3,
  Leaf,
  ReceiptText,
  RefreshCw,
  ScanLine,
  Sparkles,
  Users,
} from 'lucide-react';
import { SectionHeading } from '@/components/landing/SectionHeading';
import { fadeUp, staggerContainer } from '@/components/landing/motion';

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

function BentoCard({ children, className = '', delay = 0 }: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-emerald-950/[0.06] sm:p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface FeatureTitleProps {
  emoji: string;
  icon: typeof ScanLine;
  title: string;
  description: string;
  accent?: 'emerald' | 'amber' | 'sky' | 'violet';
}

const ACCENTS = {
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  sky: 'bg-sky-100 text-sky-700',
  violet: 'bg-violet-100 text-violet-700',
};

function FeatureTitle({ emoji, icon: Icon, title, description, accent = 'emerald' }: FeatureTitleProps) {
  return (
    <div className="relative z-10">
      <div className="flex items-center justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${ACCENTS[accent]}`}>
          <Icon className="h-5 w-5" strokeWidth={2.4} />
        </span>
        <span className="text-lg" aria-hidden="true">{emoji}</span>
      </div>
      <h3 className="mt-4 text-xl font-black tracking-[-0.03em] text-slate-950">{title}</h3>
      <p className="mt-1.5 max-w-lg text-sm font-medium leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

const RECIPES = [
  {
    emoji: '🥑',
    title: 'Creamy avocado toast',
    time: '8 min',
    tag: 'Uses 4 expiring items',
    missing: 'Add sourdough',
  },
  {
    emoji: '🍓',
    title: 'Berry yogurt bowl',
    time: '5 min',
    tag: 'Uses 3 expiring items',
    missing: 'Add honey',
  },
  {
    emoji: '🥦',
    title: 'Charred broccoli pasta',
    time: '18 min',
    tag: 'Uses 5 expiring items',
    missing: 'Add parmesan',
  },
];

export function FeaturesBento() {
  const [recipeIndex, setRecipeIndex] = useState(0);
  const recipe = RECIPES[recipeIndex];

  const nextRecipe = () => setRecipeIndex((index) => (index + 1) % RECIPES.length);

  return (
    <section id="features" className="scroll-mt-28 relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28">
      <div className="pointer-events-none absolute left-1/2 top-12 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-emerald-100/50 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Built for real kitchens"
          title={<>A calmer kitchen, <span className="text-emerald-600">from receipt to plate.</span></>}
          description="Four thoughtful tools working together so food gets eaten, money stays saved, and nobody has to ask what is for dinner."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.12 }}
          className="mt-12 grid grid-cols-1 gap-4 sm:mt-14 sm:gap-5 lg:grid-cols-6"
        >
          {/* AI receipt scanner */}
          <BentoCard className="lg:col-span-4" delay={0}>
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-100/80 blur-2xl" />
            <FeatureTitle
              emoji="🧾"
              icon={ScanLine}
              title="AI Instant Receipt Scanner"
              description="Snap once. FreshSaver reads every line item, categorises it, and builds your pantry in seconds."
            />

            <div className="relative z-10 mt-6 grid gap-4 sm:grid-cols-[0.92fr_1.08fr] sm:items-center">
              <div className="relative mx-auto w-full max-w-[230px]">
                <div className="absolute -inset-3 rounded-3xl bg-emerald-200/50 blur-xl" />
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[#fffdf7] p-4 shadow-xl shadow-slate-950/10"
                >
                  <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-2">
                    <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                      <ReceiptText className="h-3.5 w-3.5" /> Green Market
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">#0812</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {[
                      ['🥬', 'Baby spinach', '$3.20'],
                      ['🥑', 'Avocados ×3', '$5.40'],
                      ['🥛', 'Oat milk', '$4.10'],
                      ['🍞', 'Sourdough', '$6.00'],
                    ].map(([emoji, item, price]) => (
                      <div key={item} className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                          <span>{emoji}</span> {item}
                        </span>
                        <span className="font-bold text-slate-500">{price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-dashed border-slate-300 pt-2">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-800">
                      <span>Total</span><span>$18.70</span>
                    </div>
                  </div>

                  <motion.div
                    animate={{ top: ['11%', '86%', '11%'] }}
                    transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="pointer-events-none absolute inset-x-3 h-px bg-emerald-400 shadow-[0_0_16px_4px_rgba(52,211,153,0.65)]"
                  >
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-300" />
                  </motion.div>
                </motion.div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[9px] font-black text-emerald-700 shadow-sm">
                  ⚡ Parsed in 1.8s
                </span>
              </div>

              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                  <Sparkles className="h-3.5 w-3.5" /> Auto-added to pantry
                </p>
                {[
                  { emoji: '🥬', name: 'Baby spinach', meta: 'Produce · 4 days', delay: 0 },
                  { emoji: '🥑', name: 'Avocados', meta: 'Produce · 3 days', delay: 0.1 },
                  { emoji: '🥛', name: 'Oat milk', meta: 'Dairy alt · 7 days', delay: 0.2 },
                ].map((item) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: item.delay, duration: 0.35 }}
                    className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg shadow-sm">{item.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-bold text-slate-800">{item.name}</span>
                      <span className="block text-[9px] font-medium text-slate-400">{item.meta}</span>
                    </span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* Expiry alerts */}
          <BentoCard className="lg:col-span-2" delay={0.08}>
            <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-amber-100/70 blur-2xl" />
            <FeatureTitle
              emoji="⏰"
              icon={BellRing}
              title="Smart Expiry Alerts"
              description="A traffic-light system that tells you what to eat first, without the guesswork."
              accent="amber"
            />

            <div className="relative z-10 mt-6 space-y-3">
              {[
                { label: 'Fresh', detail: 'Broccoli · 6 days', color: 'emerald', width: '32%', dot: 'bg-emerald-400', bar: 'bg-emerald-400' },
                { label: 'Expiring soon', detail: 'Oat milk · 2 days', color: 'amber', width: '68%', dot: 'bg-amber-400', bar: 'bg-amber-400' },
                { label: 'Urgent', detail: 'Avocados · today', color: 'rose', width: '94%', dot: 'bg-rose-400', bar: 'bg-rose-400' },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + index * 0.1 }}
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-[11px] font-black text-slate-700">
                      <span className={`relative flex h-2.5 w-2.5 ${item.color === 'rose' ? 'animate-pulse' : ''}`}>
                        <span className={`absolute inline-flex h-full w-full rounded-full ${item.dot} opacity-30 ${item.color === 'rose' ? 'animate-ping' : ''}`} />
                        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${item.dot}`} />
                      </span>
                      {item.label}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400">{item.detail}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: item.width }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: 0.25 + index * 0.1 }}
                      className={`h-full rounded-full ${item.bar}`}
                    />
                  </div>
                </motion.div>
              ))}
              <div className="flex items-center gap-2 rounded-xl border border-amber-200/70 bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-800">
                <Clock3 className="h-3.5 w-3.5" />
                Dinner nudge sent at 5:30 PM
              </div>
            </div>
          </BentoCard>

          {/* AI recipe builder */}
          <BentoCard className="lg:col-span-2" delay={0.16}>
            <div className="absolute -bottom-16 -right-12 h-44 w-44 rounded-full bg-violet-100/75 blur-2xl" />
            <FeatureTitle
              emoji="🍳"
              icon={ChefHat}
              title="Zero-Waste AI Recipes"
              description="Turn the ingredients you already have into a meal worth making tonight."
              accent="violet"
            />

            <div className="relative z-10 mt-5">
              <div className="flex flex-wrap gap-1.5">
                {['🥑 Avocado', '🍓 Berries', '🥬 Spinach', '🥛 Oat milk'].map((ingredient) => (
                  <motion.span
                    key={ingredient}
                    whileHover={{ y: -2 }}
                    className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700"
                  >
                    {ingredient}
                  </motion.span>
                ))}
              </div>

              <div className="mt-3 min-h-[128px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={recipe.title}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50 to-white p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">{recipe.emoji}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900">{recipe.title}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                          <Clock3 className="h-3 w-3" /> {recipe.time} · {recipe.tag}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black text-emerald-700">92% match</span>
                      <span className="text-[9px] font-semibold text-slate-400">{recipe.missing}</span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={nextRecipe}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-[11px] font-black text-violet-700 transition-colors hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Shuffle meal idea
              </button>
            </div>
          </BentoCard>

          {/* Family sync */}
          <BentoCard className="lg:col-span-4" delay={0.24}>
            <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-sky-100/70 blur-2xl" />
            <FeatureTitle
              emoji="👨‍👩‍👧‍👦"
              icon={Users}
              title="Real-time Family Sync"
              description="One living pantry for the whole household. Everyone sees the same list, in real time."
              accent="sky"
            />

            <div className="relative z-10 mt-6 grid gap-4 sm:grid-cols-[0.9fr_1.1fr] sm:items-center">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">In the kitchen</p>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
                  </span>
                </div>
                <div className="mt-3 flex -space-x-3">
                  {[
                    ['👩🏽‍🦱', 'Maya'],
                    ['👨🏻', 'Sam'],
                    ['🧑🏾', 'Noah'],
                    ['👧🏼', 'Ava'],
                  ].map(([avatar, name]) => (
                    <span
                      key={name}
                      title={name}
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-lg shadow-sm"
                    >
                      {avatar}
                    </span>
                  ))}
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-emerald-100 text-xs font-black text-emerald-700 shadow-sm">+2</span>
                </div>
                <p className="mt-3 text-[10px] font-semibold leading-relaxed text-slate-400">
                  Everyone is looking at the same pantry. No more “do we have milk?” texts.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { icon: '🥛', text: 'Maya added Oat milk', meta: 'just now', tone: 'emerald' },
                  { icon: '✅', text: 'Sam checked off eggs', meta: '1 min ago', tone: 'sky' },
                  { icon: '💰', text: 'You saved $12.40', meta: 'today', tone: 'amber' },
                ].map((activity, index) => (
                  <motion.div
                    key={activity.text}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + index * 0.08 }}
                    className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-base">{activity.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-bold text-slate-800">{activity.text}</span>
                      <span className="block text-[9px] font-medium text-slate-400">{activity.meta}</span>
                    </span>
                    <span className={`h-1.5 w-1.5 rounded-full ${activity.tone === 'emerald' ? 'bg-emerald-400' : activity.tone === 'sky' ? 'bg-sky-400' : 'bg-amber-400'}`} />
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-4 flex items-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2.5 text-white">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              <p className="text-[10px] font-bold text-slate-200">Household tip: buy only what is missing from tonight&apos;s recipe.</p>
              <ArrowRight className="ml-auto h-3.5 w-3.5 text-emerald-300" />
            </div>
          </BentoCard>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-bold text-slate-400"
        >
          <span className="flex items-center gap-1.5"><Leaf className="h-3.5 w-3.5 text-emerald-500" /> Works with any grocery receipt</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> Private by default</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-amber-400" /> Smarter with every scan</span>
        </motion.div>
      </div>
    </section>
  );
}
