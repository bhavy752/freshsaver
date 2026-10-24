import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Crown, ShieldCheck, Sparkles } from 'lucide-react';
import { SectionHeading } from '@/components/landing/SectionHeading';
import { fadeUp } from '@/components/landing/motion';

interface PricingProps {
  onGetStarted: () => void;
}

type BillingCycle = 'monthly' | 'annual';

const FREE_FEATURES = [
  '1 household, up to 2 members',
  '10 AI receipt scans per month',
  'Smart expiry alerts',
  'Zero-waste recipe ideas',
  'Shared pantry list',
];

const PRO_FEATURES = [
  'Everything in Free, plus:',
  'Unlimited AI receipt scans',
  'Up to 8 household members',
  'Real-time family sync',
  'AI meal planner & grocery gaps',
  'Savings and waste analytics',
  'Priority support',
];

export function Pricing({ onGetStarted }: PricingProps) {
  const [billing, setBilling] = useState<BillingCycle>('annual');
  const isAnnual = billing === 'annual';
  const proMonthlyPrice = isAnnual ? 7.99 : 9.99;
  const annualTotal = (7.99 * 12).toFixed(2);

  return (
    <section id="pricing" className="scroll-mt-28 relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-emerald-100/55 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Simple, honest pricing"
          title={<>Start free. <span className="text-emerald-600">Upgrade when your household does.</span></>}
          description="No surprise fees, no lock-in. FreshSaver pays for itself in the first rescued grocery bag."
        />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-8 flex justify-center"
        >
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100/80 p-1">
            {(['monthly', 'annual'] as const).map((cycle) => {
              const isActive = billing === cycle;
              return (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBilling(cycle)}
                  aria-pressed={isActive}
                  className={`relative rounded-full px-4 py-2 text-xs font-black capitalize transition-colors ${
                    isActive ? 'text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="pricing-toggle"
                      className="absolute inset-0 rounded-full bg-slate-950 shadow-sm"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {cycle}
                    {cycle === 'annual' && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.08em] ${
                        isActive ? 'bg-emerald-400 text-emerald-950' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        Save 20%
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        <div className="mx-auto mt-8 grid max-w-4xl gap-5 lg:grid-cols-2">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="flex flex-col rounded-[2rem] border border-slate-200 bg-slate-50/60 p-6 sm:p-8"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                Always free
              </span>
            </div>
            <h3 className="mt-5 text-2xl font-black tracking-[-0.03em] text-slate-950">Fresh Start</h3>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-500">
              The essentials for one small household ready to waste less.
            </p>
            <div className="mt-6 flex items-end gap-1">
              <span className="text-5xl font-black tracking-[-0.06em] text-slate-950">$0</span>
              <span className="pb-1.5 text-sm font-bold text-slate-400">/ forever</span>
            </div>
            <motion.button
              type="button"
              onClick={onGetStarted}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-black text-slate-900 transition-colors hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              Create free account
              <ArrowRight className="h-4 w-4" />
            </motion.button>
            <ul className="mt-6 space-y-3">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm font-semibold text-slate-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-2 rounded-[2.3rem] bg-gradient-to-br from-emerald-400/35 via-lime-300/20 to-amber-300/25 blur-2xl" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-[#071711] p-6 text-white shadow-2xl shadow-emerald-950/25 sm:p-8">
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-amber-300/10 blur-3xl" />

              <div className="relative z-10 flex items-center justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-[#052e1b] shadow-lg shadow-emerald-400/25">
                  <Crown className="h-5 w-5" strokeWidth={2.5} />
                </span>
                <span className="rounded-full bg-emerald-400 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-950">
                  Most popular
                </span>
              </div>

              <h3 className="relative z-10 mt-5 text-2xl font-black tracking-[-0.03em] text-white">Pro Household</h3>
              <p className="relative z-10 mt-1.5 text-sm font-medium leading-relaxed text-slate-300">
                Unlimited scans, family sync, and the full zero-waste meal planner.
              </p>

              <div className="relative z-10 mt-6 flex items-end gap-1">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={`${billing}-${proMonthlyPrice}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="text-5xl font-black tracking-[-0.06em] text-white"
                  >
                    ${proMonthlyPrice}
                  </motion.span>
                </AnimatePresence>
                <span className="pb-1.5 text-sm font-bold text-slate-400">/ month</span>
              </div>
              <p className="relative z-10 mt-1 text-[11px] font-semibold text-emerald-300">
                {isAnnual ? `Billed $${annualTotal}/year · save $24.00` : 'Billed monthly · cancel anytime'}
              </p>

              <motion.button
                type="button"
                onClick={onGetStarted}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative z-10 mt-6 flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-emerald-400 px-5 py-3.5 text-sm font-black text-[#052e1b] shadow-lg shadow-emerald-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071711]"
              >
                Start 14-day free trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
              </motion.button>

              <ul className="relative z-10 mt-6 space-y-3">
                {PRO_FEATURES.map((feature, index) => (
                  <li
                    key={feature}
                    className={`flex items-start gap-2.5 text-sm font-semibold ${
                      index === 0 ? 'text-emerald-200' : 'text-slate-300'
                    }`}
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="relative z-10 mt-auto flex items-center gap-2 pt-6 text-[10px] font-bold text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                30-day money-back guarantee
              </div>
            </div>
          </motion.div>
        </div>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-6 text-center text-[11px] font-medium text-slate-400"
        >
          Prices in USD. Cancel anytime. Your data stays yours — always.
        </motion.p>
      </div>
    </section>
  );
}
