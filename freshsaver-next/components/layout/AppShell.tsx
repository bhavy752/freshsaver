'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import type { AppUser, Household, Profile } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { AppProvider } from '@/components/providers/app-provider';
import { SyncProvider } from '@/components/providers/sync-provider';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppTopbar } from '@/components/layout/AppTopbar';
import { MobileNav } from '@/components/layout/MobileNav';

interface AppShellProps {
  demo: boolean;
  user: AppUser;
  profile: Profile;
  household: Household;
  children: ReactNode;
}

export function AppShell({ demo, user, profile, household, children }: AppShellProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    if (demo) {
      toast.success('Signed out of the demo kitchen.');
      router.push('/login');
      return;
    }

    const supabase = getSupabaseBrowserClient();
    await supabase?.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <AppProvider value={{ demo, user, profile, household }}>
      <SyncProvider>
        <div className="min-h-screen bg-cream-50">
          <AppSidebar
            household={household}
            profile={profile}
            demo={demo}
            onSignOut={handleSignOut}
          />

          <AnimatePresence>
            {mobileOpen ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[90] lg:hidden"
              >
                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={() => setMobileOpen(false)}
                  className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="relative h-full w-[17.5rem] shadow-2xl"
                >
                  <AppSidebar
                    variant="mobile"
                    household={household}
                    profile={profile}
                    demo={demo}
                    onSignOut={handleSignOut}
                    onNavigate={() => setMobileOpen(false)}
                    onClose={() => setMobileOpen(false)}
                  />
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="lg:pl-[17.5rem]">
            <AppTopbar
              household={household}
              profile={profile}
              demo={demo}
              onMenu={() => setMobileOpen(true)}
              onSignOut={handleSignOut}
            />
            <main className="mx-auto w-full max-w-[100rem] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10">
              {children}
            </main>
          </div>

          <MobileNav />
        </div>
      </SyncProvider>
    </AppProvider>
  );
}
