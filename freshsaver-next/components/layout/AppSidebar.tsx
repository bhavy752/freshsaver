'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  ChefHat,
  Copy,
  LayoutDashboard,
  Leaf,
  LogOut,
  ScanLine,
  Settings,
  ShoppingBasket,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Household, Profile } from '@/lib/types';
import { initials } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/shopping-list', label: 'Shopping list', icon: ShoppingBasket },
];

const soonItems = [
  { label: 'Meal ideas', icon: ChefHat },
  { label: 'Insights', icon: BarChart3 },
];

interface AppSidebarProps {
  household: Household;
  profile: Profile;
  demo: boolean;
  onSignOut: () => void;
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
  onClose?: () => void;
}

export function AppSidebar({
  household,
  profile,
  demo,
  onSignOut,
  variant = 'desktop',
  onNavigate,
  onClose,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleScan() {
    onNavigate?.();
    if (pathname === '/dashboard') {
      window.dispatchEvent(new CustomEvent('freshsaver:scan-receipt'));
      return;
    }
    router.push('/dashboard?scan=1');
  }

  async function copyJoinCode() {
    try {
      await navigator.clipboard.writeText(household.join_code);
      toast.success('Join code copied.');
    } catch {
      toast.error('Could not copy the join code.');
    }
  }

  return (
    <aside
      className={`${
        variant === 'desktop' ? 'fixed inset-y-0 left-0 z-40 hidden lg:flex' : 'flex'
      } w-[17.5rem] flex-col overflow-hidden bg-ink-950 text-white`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(16,185,129,0.18),transparent_30%)]" />
      <div className="noise absolute inset-0" />

      <div className="relative z-10 flex items-center justify-between px-5 pt-6">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-ink-950 shadow-lg shadow-emerald-500/20">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="text-lg font-black tracking-[-0.04em] text-white">FreshSaver</span>
        </Link>
        {variant === 'mobile' && onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="relative z-10 px-4 pt-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-300 to-emerald-500 text-[10px] font-black text-ink-950">
              {initials(household.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-white">{household.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold text-white/35">
                <Users className="h-2.5 w-2.5" />
                {household.family_members_count} in sync
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={copyJoinCode}
            className="mt-2.5 flex w-full items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/35 transition-colors hover:bg-white/[0.08] hover:text-white/60"
          >
            Join code · {household.join_code}
            <Copy className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>

      <nav className="relative z-10 flex-1 overflow-y-auto px-3 pt-6">
        <p className="px-3 text-[9px] font-black uppercase tracking-[0.18em] text-white/25">
          Kitchen
        </p>
        <div className="mt-2 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                  active
                    ? 'bg-emerald-400/15 text-emerald-200'
                    : 'text-white/45 hover:bg-white/[0.05] hover:text-white/80'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {active ? (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-300" />
                ) : null}
              </Link>
            );
          })}
        </div>

        <p className="mt-6 px-3 text-[9px] font-black uppercase tracking-[0.18em] text-white/25">
          Coming next
        </p>
        <div className="mt-2 space-y-1">
          {soonItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => toast.info(`${item.label} is on the roadmap.`)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/55"
              >
                <Icon className="h-4 w-4" />
                {item.label}
                <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.1em] text-white/30">
                  Soon
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleScan}
          className="mt-6 block w-full rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/15 to-emerald-500/[0.04] p-4 text-left transition-colors hover:border-emerald-400/35"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400 text-ink-950">
            <ScanLine className="h-4 w-4" />
          </span>
          <p className="mt-3 text-xs font-black text-white">Scan a receipt</p>
          <p className="mt-1 text-[10px] font-medium leading-relaxed text-white/35">
            Turn a paper receipt into an organized pantry in seconds.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-300">
            <Sparkles className="h-2.5 w-2.5" />
            AI powered
          </span>
        </button>
      </nav>

      <div className="relative z-10 border-t border-white/[0.08] p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-[9px] font-black text-white">
            {initials(profile.full_name ?? profile.username)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-black text-white">
              {profile.full_name ?? profile.username}
            </p>
            <p className="text-[9px] font-semibold text-white/30">
              {demo ? 'Demo kitchen' : 'Household admin'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toast.info('Settings are coming next.')}
            aria-label="Settings"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/5 hover:text-white/60"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-coral-500/15 hover:text-coral-300"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
