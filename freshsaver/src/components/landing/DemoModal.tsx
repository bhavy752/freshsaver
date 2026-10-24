import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BellRing,
  Check,
  ChefHat,
  Clock3,
  Leaf,
  ScanLine,
  Sparkles,
  X,
} from 'lucide-react';

interface DemoModalProps {
  onClose: () => void;
  onGetStarted: () => void;
}

const DEMO_STEPS = [
  {
    icon: ScanLine,
    title: 'Scan any receipt',
    description: 'One photo turns every grocery line item into an organised pantry card.',
    accent: 'text-emerald-300',
    bg: 'bg-emerald-400/10',
  },
  {
    icon: BellRing,
    title: 'Get the right nudge',
    description: 'Fresh, soon, and urgent badges make it obvious what to eat first.',
    accent: 'text-amber-300',
    bg: 'bg-amber-300/10',
  },
  {
    icon: ChefHat,
    title: 'Cook what you have',
    description: 'AI recipes use the ingredients already in your kitchen before they expire.',
    accent: 'text-lime-300',
    bg: 'bg-lime-300/10',
  },
];

function DemoScene({ activeStep }: { activeStep: number }) {
  if (activeStep === 0) {
    return (
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200">
            <ScanLine className="h-3.5 w-3.5" /> AI receipt scan
          </span>
          <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[9px] font-black text-emerald-200">1.8s</span>
        </div>

        <div className="relative mx-auto my-2 w-full max-w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-[#fffdf7] p-4 text-slate-800 shadow-2xl">
          <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-2">
            <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">Green Market</span>
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
          <div className="mt-3 border-t border-dashed border-slate-300 pt-2 text-[10px] font-black text-slate-800">
            <div className="flex items-center justify-between"><span>Total</span><span>$18.70</span></div>
          </div>
          <motion.div
            animate={{ top: ['10%', '88%', '10%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="pointer-events-none absolute inset-x-3 h-px bg-emerald-500 shadow-[0_0_14px_3px_rgba(16,185,129,0.7)]"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-1.5">
          {['🥬 Spinach', '🥑 Avocados', '🥛 Oat milk'].map((item) => (
            <span key={item} className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-bold text-emerald-100">
              {item} ✓
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (activeStep === 1) {
    return (
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-200">
            <BellRing className="h-3.5 w-3.5" /> Expiry alerts
          </span>
          <span className="flex items-center gap-1 rounded-full bg-rose-400/15 px-2 py-1 text-[9px] font-black text-rose-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-300" /> 1 urgent
          </span>
        </div>

        <div className="my-3 space-y-2.5">
          {[
            { emoji: '🥑', name: 'Avocados', detail: 'Eat today', tone: 'rose', bar: 'w-[94%] bg-rose-400', badge: 'text-rose-200' },
            { emoji: '🥛', name: 'Oat milk', detail: '2 days left', tone: 'amber', bar: 'w-[68%] bg-amber-300', badge: 'text-amber-200' },
            { emoji: '🥦', name: 'Broccoli', detail: '6 days left', tone: 'emerald', bar: 'w-[32%] bg-emerald-400', badge: 'text-emerald-200' },
          ].map((item) => (
            <div key={item.name} className="rounded-xl border border-white/10 bg-white/[0.055] p-2.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-lg">{item.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[11px] font-bold text-white">{item.name}</p>
                    <span className={`text-[9px] font-black ${item.badge}`}>{item.detail}</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: item.bar.split(' ')[0].replace('w-[', '').replace('%]', '%') }}
                      transition={{ duration: 0.7 }}
                      className={`h-full rounded-full ${item.tone === 'rose' ? 'bg-rose-400' : item.tone === 'amber' ? 'bg-amber-300' : 'bg-emerald-400'}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-[10px] font-bold text-amber-100">
          <Clock3 className="h-3.5 w-3.5 text-amber-300" />
          Tonight: creamy avocado toast?
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-lime-200">
          <ChefHat className="h-3.5 w-3.5" /> Zero-waste recipe
        </span>
        <span className="rounded-full bg-lime-300/15 px-2 py-1 text-[9px] font-black text-lime-200">92% match</span>
      </div>

      <div className="my-auto rounded-2xl border border-lime-300/15 bg-gradient-to-br from-lime-300/10 to-white/[0.03] p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl">🥑</span>
          <div>
            <p className="text-sm font-black text-white">Creamy avocado toast</p>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
              <Clock3 className="h-3 w-3" /> 8 min · uses 4 expiring items
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {['🥑 Avocado', '🍞 Sourdough', '🌶️ Chilli', '🧄 Garlic'].map((ingredient) => (
            <span key={ingredient} className="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[9px] font-bold text-slate-200">
              {ingredient}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-white/[0.055] px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
          <Sparkles className="h-3.5 w-3.5 text-lime-300" /> No extra shopping needed
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime-300 text-[#052e1b]">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      </div>
    </div>
  );
}

export function DemoModal({ onClose, onGetStarted }: DemoModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[#020806]/80 px-4 py-6 backdrop-blur-md sm:items-center"
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-modal-title"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(event) => event.stopPropagation()}
        tabIndex={-1}
        className="relative my-auto w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#07130f] p-2.5 shadow-2xl shadow-black/50 outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close demo"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/20 text-slate-300 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:right-5 sm:top-5"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid gap-2.5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative flex min-h-[430px] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-[#0a1f16] to-[#06120d] p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl" />
            <div className="relative z-10 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400 text-[#052e1b]">
                  <Leaf className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <span className="text-[11px] font-black text-white">FreshSaver tour</span>
              </span>
              <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-slate-300 sm:flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
                Live preview
              </span>
            </div>

            <div className="relative z-10 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="h-full min-h-[330px]"
                >
                  <DemoScene activeStep={activeStep} />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative z-10 mt-4 flex items-center justify-between gap-2">
              <div className="flex gap-1.5">
                {DEMO_STEPS.map((step, index) => (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => setActiveStep(index)}
                    aria-label={`Show demo step ${index + 1}: ${step.title}`}
                    aria-current={activeStep === index ? 'step' : undefined}
                    className={`h-1.5 rounded-full transition-all ${
                      activeStep === index ? 'w-7 bg-emerald-400' : 'w-2 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[9px] font-bold text-slate-500">Click a dot to explore</p>
            </div>
          </div>

          <div className="flex flex-col justify-center p-5 sm:p-7">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">45-second product tour</span>
            <h2 id="demo-modal-title" className="mt-3 text-2xl font-black leading-tight tracking-[-0.04em] text-white sm:text-3xl">
              See how FreshSaver turns a receipt into dinner.
            </h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-400">
              No sign-up. No fluff. Just the three moments that make the biggest difference in a real kitchen.
            </p>

            <div className="mt-5 space-y-2">
              {DEMO_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStep === index;
                return (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => setActiveStep(index)}
                    aria-pressed={isActive}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all ${
                      isActive
                        ? 'border-emerald-400/30 bg-emerald-400/[0.08]'
                        : 'border-white/[0.07] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${step.bg} ${step.accent}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-xs font-black ${isActive ? 'text-white' : 'text-slate-200'}`}>{step.title}</span>
                      <span className="mt-0.5 block text-[10px] font-medium leading-relaxed text-slate-500">{step.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <motion.button
              type="button"
              onClick={onGetStarted}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3.5 text-sm font-black text-[#052e1b] shadow-lg shadow-emerald-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07130f]"
            >
              Start free — no card needed
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
