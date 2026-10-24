import Link from 'next/link';
import type { ReactNode } from 'react';
import { Leaf, ShieldCheck } from 'lucide-react';
import { AuthShowcase } from '@/components/auth/AuthShowcase';

export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr] bg-slate-950">
      <AuthShowcase />

      <section className="relative flex min-h-screen flex-col overflow-hidden px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-emerald-950/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-amber-950/25 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between lg:justify-end">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="text-base font-black tracking-[-0.04em] text-white">
              FreshSaver
            </span>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-slate-900/70 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-400 backdrop-blur-md">
            <ShieldCheck className="h-3 w-3" />
            Private by default
          </span>
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center py-8">
          <div className="relative w-full max-w-[28rem]">
            <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-br from-emerald-500/20 via-slate-900/30 to-amber-500/20 blur-[2px]" />
            <div className="relative rounded-[2rem] border border-emerald-500/20 bg-slate-900/60 p-6 shadow-[0_40px_100px_-50px_rgba(6,78,59,0.55)] backdrop-blur-2xl sm:p-8">
              {children}
            </div>
          </div>
        </div>

        <p className="relative z-10 text-center text-[10px] font-semibold text-slate-400">
          FreshSaver © {new Date().getFullYear()} · Made for kitchens that hate waste
        </p>
      </section>
    </main>
  );
}