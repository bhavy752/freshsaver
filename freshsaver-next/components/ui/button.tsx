'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600',
        secondary:
          'bg-ink-900 text-white shadow-lg shadow-ink-950/10 hover:bg-ink-800',
        outline:
          'border border-ink-200 bg-white text-ink-800 hover:border-emerald-300 hover:bg-emerald-50/60',
        ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
        soft: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
        destructive: 'bg-coral-500 text-white shadow-lg shadow-coral-500/20 hover:bg-coral-600',
        amber: 'bg-amber-400 text-ink-950 shadow-lg shadow-amber-400/20 hover:bg-amber-300',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 rounded-lg px-3.5 text-xs',
        lg: 'h-12 rounded-2xl px-6 text-sm',
        icon: 'h-10 w-10 rounded-xl',
        'icon-sm': 'h-8 w-8 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };
