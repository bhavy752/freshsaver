import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { fadeUp } from '@/components/landing/motion';

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  theme?: 'light' | 'dark';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  theme = 'light',
  className = '',
}: SectionHeadingProps) {
  const isDark = theme === 'dark';

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      className={`${align === 'center' ? 'mx-auto text-center' : 'text-left'} max-w-3xl ${className}`}
    >
      {eyebrow && (
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] ${
            isDark
              ? 'border-white/15 bg-white/10 text-emerald-200'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
          {eyebrow}
        </span>
      )}

      <h2
        className={`mt-4 text-balance text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-[2.9rem] lg:leading-[1.05] ${
          isDark ? 'text-white' : 'text-slate-950'
        }`}
      >
        {title}
      </h2>

      {description && (
        <p
          className={`mt-4 text-pretty text-base font-medium leading-relaxed sm:text-lg ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          } ${align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl'}`}
        >
          {description}
        </p>
      )}
    </motion.div>
  );
}
