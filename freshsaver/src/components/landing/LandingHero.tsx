import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import { HeroPreview } from '@/components/landing/HeroPreview';
import { staggerContainer, fadeUp } from '@/components/landing/motion';

interface LandingHeroProps {
  onGetStarted: () => void;
  onWatchDemo: () => void;
}

const TRUST_POINTS = [
  'Free forever plan',
  'No credit card',
  'Set up in 60 seconds',
];

export function LandingHero({ onGetStarted, onWatchDemo }: LandingHeroProps) {
  return (
    <section id="top" className="relative overflow-hidden bg-[#06120d] pb-20 pt-28 text-white sm:pt-32 lg:pb-28 lg:pt-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_78%)]"
      />
      <motion.div
        aria-hidden="true"
        animate={{ x: [0, 26, 0], y: [0, -18, 0], opacity: [0.22, 0.35, 0.22] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full bg-emerald-500/40 blur-[120px]"
      />
      <motion.div
        aria-hidden="true"
        animate={{ x: [0, -30, 0], y: [0, 24, 0], opacity: [0.16, 0.3, 0.16] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -right-20 top-1/4 h-[30rem] w-[30rem] rounded-full bg-lime-300/25 blur-[130px]"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#f8faf5]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="relative z-10 min-w-0 text-center lg:text-left"
        >
          <motion.div variants={fadeUp} className="flex justify-center lg:justify-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-200 shadow-lg shadow-emerald-950/20 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
              </span>
              AI-powered kitchen OS · 2026
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-6 text-balance text-[2.8rem] font-black leading-[0.99] tracking-[-0.055em] sm:text-6xl lg:text-[4.65rem]"
          >
            Stop throwing away
            <span className="relative mt-1 block bg-gradient-to-r from-emerald-300 via-lime-200 to-amber-200 bg-clip-text text-transparent">
              your grocery budget.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-xl text-pretty text-base font-medium leading-relaxed text-slate-300 sm:text-lg lg:mx-0"
          >
            FreshSaver turns a photo of your receipt into an organised pantry, warns you before food expires,
            and plans zero-waste meals your whole household will actually eat.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <motion.button
              type="button"
              onClick={onGetStarted}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-emerald-400 px-6 py-4 text-base font-black text-[#052e1b] shadow-[0_0_40px_-8px_rgba(52,211,153,0.8)] transition-shadow hover:shadow-[0_0_55px_-6px_rgba(52,211,153,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06120d] sm:w-auto"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started Free
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.5} />
              </span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </motion.button>

            <motion.button
              type="button"
              onClick={onWatchDemo}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group inline-flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/15 bg-white/[0.07] px-6 py-4 text-base font-bold text-white backdrop-blur-md transition-colors hover:border-white/25 hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:w-auto"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:scale-110">
                <Play className="ml-0.5 h-3.5 w-3.5 fill-white text-white" />
              </span>
              Watch Live Demo
            </motion.button>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-semibold text-slate-400 lg:justify-start">
            {TRUST_POINTS.map((point) => (
              <span key={point} className="flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
                {point}
              </span>
            ))}
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-3.5 backdrop-blur-md sm:flex-row sm:gap-4 lg:justify-start"
          >
            <div className="flex -space-x-2.5">
              {['👩🏽‍🍳', '🧑🏻‍💻', '👨🏿‍🌾', '👩🏼‍👧'].map((avatar) => (
                <span
                  key={avatar}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0b1a12] bg-slate-800 text-lg"
                >
                  {avatar}
                </span>
              ))}
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center gap-1 sm:justify-start" aria-label="Rated 4.9 out of 5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                ))}
                <span className="ml-1.5 text-[11px] font-black text-white">4.9/5</span>
              </div>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                <span className="font-black text-white">25,000+</span> kitchens saving together
              </p>
            </div>
            <span className="hidden h-8 w-px bg-white/10 sm:block" />
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-200">
              <Zap className="h-3.5 w-3.5 fill-emerald-300 text-emerald-300" />
              $1.2M+ saved
            </p>
          </motion.div>
        </motion.div>

        <div className="relative z-10 min-w-0">
          <HeroPreview />
        </div>
      </div>

      <div className="relative mx-auto mt-14 flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 text-[10px] font-black uppercase tracking-[0.19em] text-slate-500 lg:mt-20 lg:px-8">
        <span className="flex items-center gap-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 px-4 py-1.5 shadow-lg text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Bank-grade privacy
        </span>
        <span className="h-1 w-1 rounded-full bg-slate-700" />
        <span className="flex items-center gap-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 px-4 py-1.5 shadow-lg text-emerald-300">
          <Sparkles className="h-3.5 w-3.5 text-amber-300" /> AI receipt parsing
        </span>
        <span className="h-1 w-1 rounded-full bg-slate-700" />
        <span className="flex items-center gap-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 px-4 py-1.5 shadow-lg text-emerald-300">
          <Check className="h-3.5 w-3.5 text-emerald-400" /> Real-time family sync
        </span>
      </div>
    </section>
  );
}
