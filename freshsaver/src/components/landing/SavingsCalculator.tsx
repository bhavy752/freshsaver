import { useId, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Apple,
  ArrowRight,
  Check,
  Cloud,
  DollarSign,
  Sparkles,
  Users,
} from 'lucide-react';
import { SectionHeading } from '@/components/landing/SectionHeading';
import { fadeUp, staggerContainer } from '@/components/landing/motion';

interface SavingsCalculatorProps {
  onGetStarted: () => void;
}

const numberFormatter = new Intl.NumberFormat('en-US');

export function SavingsCalculator({ onGetStarted }: SavingsCalculatorProps) {
  const sliderId = useId();
  const [householdSize, setHouseholdSize] = useState(4);

  const annualSavings = Math.round(householdSize * 468);
  const poundsSaved = Math.round(householdSize * 128);
  const co2Saved = Math.round(poundsSaved * 1.9);
  const sliderProgress = ((householdSize - 1) / 5) * 100;
  const sizeLabel = householdSize === 6 ? '6+' : String(householdSize);

  return (
    <section id="savings" className="scroll-mt-28 relative overflow-hidden bg-[#f8faf5] py-20 sm:py-24 lg:py-28">
      <div className="pointer-events-none absolute -left-40 top-24 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-amber-200/35 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Your waste-free upside"
              title={<>The average family throws away <span className="text-emerald-600">$1,500 a year.</span> Let&apos;s fix that.</>}
              description="Move the slider to see what better inventory habits could put back in your pocket — and keep out of landfill."
            />

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              className="mt-8 space-y-3"
            >
              {[
                'Know what you already have before you shop',
                'Use what is about to expire with smart meal ideas',
                'Share one live pantry with everyone in your home',
              ].map((item) => (
                <motion.div key={item} variants={fadeUp} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <p className="text-sm font-semibold leading-relaxed text-slate-600">{item}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-3 rounded-[2.4rem] bg-gradient-to-br from-emerald-300/35 via-lime-200/30 to-amber-200/35 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-2xl shadow-emerald-950/[0.08] backdrop-blur-xl sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Interactive ROI</p>
                  <h3 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950 sm:text-2xl">Your savings forecast</h3>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/25">
                  <Sparkles className="h-5 w-5" strokeWidth={2.5} />
                </span>
              </div>

              <div className="mt-7 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-end justify-between gap-4">
                  <label htmlFor={sliderId} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Users className="h-4 w-4 text-emerald-600" />
                    Household size
                  </label>
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white shadow-sm">
                    {sizeLabel} {householdSize === 1 ? 'person' : 'people'}
                  </span>
                </div>

                <input
                  id={sliderId}
                  type="range"
                  min={1}
                  max={6}
                  step={1}
                  value={householdSize}
                  onChange={(event) => setHouseholdSize(Number(event.target.value))}
                  aria-valuetext={`${sizeLabel} ${householdSize === 1 ? 'person' : 'people'}`}
                  className="fresh-range mt-5 w-full cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${sliderProgress}%, #e2e8f0 ${sliderProgress}%, #e2e8f0 100%)`,
                  }}
                />
                <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-400" aria-hidden="true">
                  <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6+</span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white shadow-xl shadow-emerald-700/20">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100/80">
                    <DollarSign className="h-3.5 w-3.5" />
                    Estimated annual savings
                  </p>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em]">ROI</span>
                </div>
                <motion.p
                  key={annualSavings}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-1 text-4xl font-black tracking-[-0.05em] sm:text-5xl"
                >
                  ${numberFormatter.format(annualSavings)}
                </motion.p>
                <p className="mt-1 text-xs font-semibold text-emerald-100/75">
                  That is ${numberFormatter.format(Math.round(annualSavings / 12))} back in your pocket every month.
                </p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <motion.div
                  key={`pounds-${poundsSaved}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-amber-200/70 bg-amber-50 p-4"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-200/70 text-amber-800">
                    <Apple className="h-4 w-4" />
                  </span>
                  <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{numberFormatter.format(poundsSaved)} lbs</p>
                  <p className="text-[11px] font-bold text-amber-800/80">food saved per year</p>
                </motion.div>

                <motion.div
                  key={`co2-${co2Saved}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-sky-200/70 bg-sky-50 p-4"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-200/70 text-sky-800">
                    <Cloud className="h-4 w-4" />
                  </span>
                  <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{numberFormatter.format(co2Saved)} kg</p>
                  <p className="text-[11px] font-bold text-sky-800/80">CO₂e avoided per year</p>
                </motion.div>
              </div>

              <motion.button
                type="button"
                onClick={onGetStarted}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Start saving with FreshSaver
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
              </motion.button>

              <p className="mt-3 text-center text-[10px] font-medium leading-relaxed text-slate-400">
                Estimates based on national food-waste averages. Actual savings vary by household.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
