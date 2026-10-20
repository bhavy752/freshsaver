import { motion } from 'framer-motion';
import { Package } from 'lucide-react';

/**
 * Shared skeleton card component that matches the layout of inventory/recipe/grocery items
 * during loading states. Uses framer-motion for micro-animations.
 */
interface SkeletonCardProps {
  className?: string;
  height?: string;
}

export function SkeletonCard({
  className,
  height = 'auto',
}: SkeletonCardProps) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-amber-50 border border-slate-100 p-4 ${className ?? ''}`}
      style={{ height: height === 'auto' ? '100%' : height }}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded-md bg-slate-200/70 animate-pulse" />
          <div className="h-3 w-1/2 rounded-md bg-slate-200/60 animate-pulse" />
          <div className="h-3 w-1/3 rounded-md bg-amber-100 animate-pulse" />
        </div>
      </div>
      <div className="h-2 rounded-full bg-slate-100 mt-4 overflow-hidden">
        <div className="h-full w-1/2 bg-gradient-to-r from-emerald-300 to-amber-300 animate-pulse" />
      </div>
    </motion.div>
  );
}

/**
 * Skeleton header component matching the inventory card header layout
 */
export function SkeletonHeader({
  className,
}: {
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-3 rounded-2xl bg-slate-100/50 p-3.5 ${className ?? ''}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 animate-pulse shrink-0" />
      <div className="flex-1 animate-pulse" />
    </motion.div>
  );
}

/**
 * Enhanced empty state placeholder for views (Inventory, Recipes, Grocery).
 * Uses a colourful food illustration built from emoji tiles so no external
 * image assets are required.
 */
export function SkeletonEmptyState({
  title,
  description,
  ctaLabel,
  ctaOnClick,
  icon: Icon = Package,
  emojis = ['🍎', '🥛', '🥩', '🍞', '🥦'],
}: {
  title: string;
  description: string;
  ctaLabel: string;
  ctaOnClick: () => void;
  icon?: React.ElementType;
  emojis?: string[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-12 lg:py-16 text-center"
    >
      {/* Colourful floating food illustration */}
      <div className="relative mb-6 w-44 h-32">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-200/60 via-amber-200/50 to-rose-200/60 blur-2xl" />
        {emojis.slice(0, 5).map((emoji, index) => {
          const positions = [
            'left-2 top-6',
            'left-14 top-0',
            'right-8 top-4',
            'left-8 bottom-0',
            'right-2 bottom-2',
          ];
          return (
            <motion.span
              key={`${emoji}-${index}`}
              className={`absolute ${positions[index]} flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-md shadow-emerald-100 border border-emerald-100 text-2xl`}
              animate={{ y: [0, index % 2 === 0 ? -7 : 7, 0] }}
              transition={{ duration: 3 + index * 0.35, repeat: Infinity, ease: 'easeInOut' }}
            >
              {emoji}
            </motion.span>
          );
        })}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-200">
          <Icon className="w-7 h-7" strokeWidth={2.2} />
        </div>
      </div>

      <h3 className="text-xl font-extrabold text-slate-900 mb-2">
        {title || 'No items found'}
      </h3>
      <p className="text-sm text-slate-500 mt-1 text-center max-w-xs leading-relaxed">
        {description || 'Add items to get started'}
      </p>
      {ctaLabel && ctaOnClick && (
        <button
          onClick={ctaOnClick}
          className="mt-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold py-3 px-7 hover:from-emerald-600 hover:to-emerald-700 hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-lg shadow-emerald-200"
        >
          {ctaLabel}
        </button>
      )}
    </motion.div>
  );
}
