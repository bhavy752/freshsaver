'use client';

import { usePathname } from 'next/navigation';
import { Bell, Menu, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { Household, Profile } from '@/lib/types';
import { HouseholdMenu } from '@/components/layout/HouseholdMenu';
import { SyncStatus } from '@/components/layout/SyncStatus';

const pageCopy: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Kitchen overview',
    subtitle: 'Everything fresh, everything accounted for.',
  },
  '/shopping-list': {
    title: 'Smart shopping list',
    subtitle: 'Auto-built from what your pantry is missing.',
  },
};

interface AppTopbarProps {
  household: Household;
  profile: Profile;
  demo: boolean;
  onMenu: () => void;
  onSignOut: () => void;
}

export function AppTopbar({ household, profile, demo, onMenu, onSignOut }: AppTopbarProps) {
  const pathname = usePathname();
  const copy = pageCopy[pathname] ?? pageCopy['/dashboard'];

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100/80 bg-cream-50/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[100rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open navigation"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ink-100 bg-white/80 text-ink-600 shadow-sm lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black tracking-[-0.02em] text-ink-950">
            {copy.title}
          </p>
          <p className="hidden truncate text-[10px] font-semibold text-ink-400 sm:block">
            {copy.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {demo ? (
            <span className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-amber-700 md:inline-flex">
              <Sparkles className="h-2.5 w-2.5" />
              Demo mode
            </span>
          ) : null}

          <div className="hidden sm:block">
            <SyncStatus />
          </div>

          <button
            type="button"
            onClick={() => toast.info('You’re all caught up. No new alerts.')}
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-ink-100 bg-white/80 text-ink-500 shadow-sm transition-colors hover:bg-white hover:text-ink-800"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-400 ring-2 ring-white" />
          </button>

          <HouseholdMenu
            household={household}
            profile={profile}
            demo={demo}
            onSignOut={onSignOut}
          />
        </div>
      </div>
    </header>
  );
}
