import { redirect } from 'next/navigation';
import type { AppUser, Household, Profile } from '@/lib/types';
import { DEMO_HOUSEHOLD, DEMO_PROFILE, DEMO_USER } from '@/lib/demo-data';
import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { fetchHousehold, fetchProfile, upsertProfile } from '@/services/profiles';
import { AppShell } from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const demo = !isSupabaseConfigured();

  if (demo) {
    return (
      <AppShell
        demo
        user={DEMO_USER}
        profile={DEMO_PROFILE}
        household={DEMO_HOUSEHOLD}
      >
        {children}
      </AppShell>
    );
  }

  const supabase = await createClient();
  if (!supabase) redirect('/login');

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect('/login');

  let profile = await fetchProfile(supabase, authUser.id);
  const fallbackName =
    (typeof authUser.user_metadata?.full_name === 'string' &&
      authUser.user_metadata.full_name) ||
    authUser.email?.split('@')[0] ||
    'Friend';

  if (!profile) {
    try {
      profile = await upsertProfile(
        supabase,
        authUser.id,
        (authUser.email?.split('@')[0] ?? 'user').replace(/[^a-z0-9_]/gi, '').slice(0, 24) ||
          `user_${authUser.id.slice(0, 8)}`,
        fallbackName
      );
    } catch {
      redirect('/onboarding');
    }
  }

  if (!profile?.household_id) redirect('/onboarding');

  const household = await fetchHousehold(supabase, profile.household_id);
  if (!household) redirect('/onboarding');

  const user: AppUser = {
    id: authUser.id,
    email: authUser.email ?? '',
    fullName: profile.full_name ?? fallbackName,
  };

  return (
    <AppShell demo={false} user={user} profile={profile} household={household}>
      {children}
    </AppShell>
  );
}
