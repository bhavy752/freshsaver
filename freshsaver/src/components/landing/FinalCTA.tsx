import { motion } from 'framer-motion';
import { ArrowRight, Check, ShieldCheck, Sparkles, Star } from 'lucide-react';

interface FinalCTAProps {
  onGetStarted: () => void;
}

export function FinalCTA({ onGetStarted }: FinalCTAProps) {
  return (
    <section className="relative overflow-hidden bg-[#06120d] px-5 py-20 text-white sm:py-24 lg:px-8 lg:py-28">
      <motion.div
        aria-hidden="true"
        animate={{ scale: [1, 1.16, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-[110px]"
      />
      <motion.div
        aria-hidden="true"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.38, 0.2] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-amber-400/20 blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.055] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_72%)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-4xl text-center"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5" />
          Your next grocery run can cost less
        </span>

        <h2 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-black leading-[1.02] tracking-[-0.055em] sm:text-5xl lg:text-[4rem]">
          Your fridge is full.
          <span className="mt-1 block bg-gradient-to-r from-emerald-300 via-lime-200 to-amber-200 bg-clip-text text-transparent">
            Your wallet can be, too.
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-base font-medium leading-relaxed text-slate-300 sm:text-lg">
          Join 25,000+ households saving money, rescuing food, and making dinner feel easy again.
          Start free in less than a minute.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <motion.button
            type="button"
            onClick={onGetStarted}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-emerald-400 px-7 py-4 text-base font-black text-[#052e1b] shadow-[0_0_45px_-8px_rgba(52,211,153,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06120d] sm:w-auto"
          >
            <span className="relative z-10 flex items-center gap-2">
              Get Started Free
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.5} />
            </span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </motion.button>

          <a
            href="#pricing"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-7 py-4 text-base font-bold text-white backdrop-blur-md transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:w-auto"
          >
            Compare plans
          </a>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-semibold text-slate-400">
          {['No credit card required', 'Free forever plan', 'Cancel anytime'].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={3} />
              {item}
            </span>
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-xl flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-4 backdrop-blur-md sm:flex-row">
          <div className="flex items-center gap-1" aria-label="Rated 4.9 out of 5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="h-4 w-4 fill-amber-300 text-amber-300" />
            ))}
            <span className="ml-1.5 text-xs font-black text-white">4.9/5</span>
          </div>
          <span className="h-px w-12 bg-white/10 sm:h-8 sm:w-px" />
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            30-day money-back guarantee
          </p>
          <span className="h-px w-12 bg-white/10 sm:h-8 sm:w-px" />
          <p className="text-[11px] font-bold text-slate-300">25,000+ happy kitchens</p>
        </div>
      </motion.div>
    </section>
  );
}
