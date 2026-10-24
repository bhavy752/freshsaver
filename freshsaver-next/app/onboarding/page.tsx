import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchHousehold, fetchProfile } from '@/services/profiles';
import { DEMO_HOUSEHOLD, DEMO_USER } from '@/lib/demo-data';
import { isSupabaseConfigured } from '@/lib/env';
import { OnboardingWizard } from '@/components/auth/OnboardingWizard';

export const metadata: Metadata = {
  title: 'Set up your kitchen',
  description: 'Name your household and set your dietary preferences.',
};

export default async function OnboardingPage() {
  if (!isSupabaseConfigured()) {
    return (
      <OnboardingWizard
        demo
        userId={DEMO_USER.id}
        fullName={DEMO_USER.fullName}
        existingHousehold={DEMO_HOUSEHOLD}
        initialPreferences={DEMO_HOUSEHOLD.dietary_preferences}
      />
    );
  }

  const supabase = await createClient();
  if (!supabase) redirect('/login');

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  let household = null;
  try {
    const profile = await fetchProfile(supabase, user.id);
    if (profile?.household_id) {
      household = await fetchHousehold(supabase, profile.household_id);
    }
  } catch {
    // A profile trigger may still be catching up. The wizard can create the
    // household after the user finishes onboarding.
  }

  const fullName =
    (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
    user.email?.split('@')[0] ||
    'Friend';

  return (
    <OnboardingWizard
      demo={false}
      userId={user.id}
      fullName={fullName}
      existingHousehold={household}
      initialPreferences={household?.dietary_preferences ?? []}
    />
  );
}
