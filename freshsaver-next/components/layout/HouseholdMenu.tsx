'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  ChefHat,
  ChevronDown,
  Copy,
  LayoutDashboard,
  Leaf,
  LogOut,
  Settings,
  ShoppingBasket,
  Sparkles,
  Users,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Household, Profile } from '@/lib/types';
import { initials } from '@/lib/utils';

interface HouseholdMenuProps {
  household: Household;
  profile: Profile;
  demo: boolean;
  onSignOut: () => void;
}

export function HouseholdMenu({ household, profile, demo, onSignOut }: HouseholdMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  async function copyJoinCode() {
    try {
      await navigator.clipboard.writeText(household.join_code);
      toast.success('Join code copied. Send it to your household.');
      setOpen(false);
    } catch {
      toast.error('Could not copy the join code.');
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-xl border border-ink-100 bg-white/80 px-2.5 py-1.5 text-left shadow-sm transition-colors hover:border-emerald-200 hover:bg-white"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-[10px] font-black text-white shadow-sm">
          {initials(household.name)}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[9rem] truncate text-xs font-black text-ink-900">
            {household.name}
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold text-ink-400">
            <Users className="h-2.5 w-2.5" />
            {household.family_members_count} in sync
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            role="menu"
            className="absolute right-0 top-[calc(100%+0.55rem)] z-50 w-72 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-2xl shadow-ink-950/15"
          >
            <div className="border-b border-ink-100 bg-gradient-to-br from-emerald-50/80 to-cream-50 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-black text-white shadow-sm">
                  {initials(household.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-ink-950">{household.name}</p>
                  <p className="mt-0.5 truncate text-[10px] font-semibold text-ink-400">
                    {profile.full_name ?? profile.username} · Household admin
                  </p>
                </div>
              </div>
              {demo ? (
                <span className="mt-2.5 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-amber-700">
                  <Sparkles className="h-2.5 w-2.5" />
                  Demo household
                </span>
              ) : null}
            </div>

            <div className="p-2">
              <button
                type="button"
                onClick={copyJoinCode}
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <UserPlus className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1">Invite a member</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-ink-100 px-1.5 py-1 text-[9px] font-black tracking-[0.08em] text-ink-500">
                  {household.join_code}
                  <Copy className="h-2.5 w-2.5" />
                </span>
              </button>

              <div className="my-1 h-px bg-ink-100" />

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  toast.info('Household settings are coming next.');
                }}
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
                  <Settings className="h-3.5 w-3.5" />
                </span>
                Household settings
              </button>

              <button
                type="button"
                onClick={onSignOut}
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-coral-600 transition-colors hover:bg-coral-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-coral-50 text-coral-500">
                  <LogOut className="h-3.5 w-3.5" />
                </span>
                Sign out
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const quickNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/shopping-list', label: 'Shopping list', icon: ShoppingBasket },
];

const comingSoon = [
  { label: 'Meal ideas', icon: ChefHat },
  { label: 'Insights', icon: BarChart3 },
];

export function MobileHouseholdSummary({ household }: { household: Household }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-[10px] font-black text-ink-950">
        {initials(household.name)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-black text-white">{household.name}</p>
        <p className="text-[9px] font-semibold text-white/35">
          {household.family_members_count} in sync
        </p>
      </div>
      <Leaf className="ml-auto h-4 w-4 text-emerald-300/50" />
    </div>
  );
}

export { quickNav, comingSoon };
