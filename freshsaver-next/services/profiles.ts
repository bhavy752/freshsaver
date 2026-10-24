import type { SupabaseClient } from '@supabase/supabase-js';
import type { Household, Profile } from '@/lib/types';
import { generateId } from '@/lib/utils';

interface ProfileRow {
  id: string;
  username: string;
  full_name: string | null;
  household_id: string | null;
  money_saved?: number | null;
  waste_streak?: number | null;
  created_at: string;
}

interface HouseholdRow {
  id: string;
  name: string;
  family_members_count: number;
  join_code: string;
  dietary_preferences?: string[] | null;
  onboarding_completed?: boolean | null;
  created_at: string;
}

const PROFILE_SELECT =
  'id, username, full_name, household_id, money_saved, waste_streak, created_at';
const HOUSEHOLD_BASE_SELECT = 'id, name, family_members_count, join_code, created_at';
const HOUSEHOLD_FULL_SELECT = `${HOUSEHOLD_BASE_SELECT}, dietary_preferences, onboarding_completed`;

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    full_name: row.full_name,
    household_id: row.household_id,
    money_saved: Number(row.money_saved ?? 0),
    waste_streak: Number(row.waste_streak ?? 0),
    created_at: row.created_at,
  };
}

function rowToHousehold(row: HouseholdRow): Household {
  return {
    id: row.id,
    name: row.name,
    family_members_count: row.family_members_count,
    join_code: row.join_code,
    dietary_preferences: row.dietary_preferences ?? [],
    onboarding_completed: row.onboarding_completed ?? true,
    created_at: row.created_at,
  };
}

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    // Older projects may not have the optional gamification columns yet.
    if (error.message.toLowerCase().includes('column')) {
      const fallback = await supabase
        .from('profiles')
        .select('id, username, full_name, household_id, created_at')
        .eq('id', userId)
        .maybeSingle();
      if (fallback.error) throw new Error(`Failed to load profile: ${fallback.error.message}`);
      return fallback.data ? rowToProfile(fallback.data as ProfileRow) : null;
    }
    throw new Error(`Failed to load profile: ${error.message}`);
  }

  return data ? rowToProfile(data as ProfileRow) : null;
}

export async function upsertProfile(
  supabase: SupabaseClient,
  userId: string,
  username: string,
  fullName: string | null
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      { id: userId, username, full_name: fullName || null },
      { onConflict: 'id' }
    )
    .select(PROFILE_SELECT)
    .maybeSingle();

  if (error) throw new Error(`Failed to save profile: ${error.message}`);
  if (!data) throw new Error('Failed to save profile: no data returned');
  return rowToProfile(data as ProfileRow);
}

export async function fetchHousehold(
  supabase: SupabaseClient,
  householdId: string
): Promise<Household | null> {
  const { data, error } = await supabase
    .from('households')
    .select(HOUSEHOLD_FULL_SELECT)
    .eq('id', householdId)
    .maybeSingle();

  if (error) {
    if (error.message.toLowerCase().includes('column')) {
      const fallback = await supabase
        .from('households')
        .select(HOUSEHOLD_BASE_SELECT)
        .eq('id', householdId)
        .maybeSingle();
      if (fallback.error) throw new Error(`Failed to load household: ${fallback.error.message}`);
      return fallback.data ? rowToHousehold(fallback.data as HouseholdRow) : null;
    }
    throw new Error(`Failed to load household: ${error.message}`);
  }

  return data ? rowToHousehold(data as HouseholdRow) : null;
}

export async function createHousehold(
  supabase: SupabaseClient,
  input: {
    name: string;
    familyMembersCount: number;
    dietaryPreferences?: string[];
  }
): Promise<Household> {
  const household: Household = {
    id: generateId(),
    name: input.name.trim() || 'Personal Pantry',
    family_members_count: Math.max(1, input.familyMembersCount || 1),
    join_code: generateJoinCode(),
    dietary_preferences: input.dietaryPreferences ?? [],
    onboarding_completed: true,
    created_at: new Date().toISOString(),
  };

  const fullPayload = {
    id: household.id,
    name: household.name,
    family_members_count: household.family_members_count,
    join_code: household.join_code,
    dietary_preferences: household.dietary_preferences,
    onboarding_completed: household.onboarding_completed,
    created_at: household.created_at,
  };

  let { error } = await supabase.from('households').insert(fullPayload);

  if (error && error.message.toLowerCase().includes('column')) {
    const fallbackPayload = {
      id: household.id,
      name: household.name,
      family_members_count: household.family_members_count,
      join_code: household.join_code,
      created_at: household.created_at,
    };
    const fallback = await supabase.from('households').insert(fallbackPayload);
    error = fallback.error;
  }

  if (error) throw new Error(`Failed to create household: ${error.message}`);
  return household;
}

export async function updateProfileHousehold(
  supabase: SupabaseClient,
  userId: string,
  householdId: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ household_id: householdId })
    .eq('id', userId);

  if (error) throw new Error(`Failed to link household: ${error.message}`);
}

export async function updateHouseholdPreferences(
  supabase: SupabaseClient,
  householdId: string,
  preferences: string[]
): Promise<void> {
  const { error } = await supabase
    .from('households')
    .update({ dietary_preferences: preferences, onboarding_completed: true })
    .eq('id', householdId);

  if (error && !error.message.toLowerCase().includes('column')) {
    throw new Error(`Failed to save household preferences: ${error.message}`);
  }
}

export async function updateHouseholdDetails(
  supabase: SupabaseClient,
  householdId: string,
  input: {
    name: string;
    familyMembersCount: number;
    dietaryPreferences: string[];
  }
): Promise<void> {
  const payload = {
    name: input.name.trim() || 'Personal Pantry',
    family_members_count: Math.max(1, input.familyMembersCount || 1),
    dietary_preferences: input.dietaryPreferences,
    onboarding_completed: true,
  };

  let { error } = await supabase.from('households').update(payload).eq('id', householdId);

  if (error && error.message.toLowerCase().includes('column')) {
    const fallback = await supabase
      .from('households')
      .update({
        name: payload.name,
        family_members_count: payload.family_members_count,
      })
      .eq('id', householdId);
    error = fallback.error;
  }

  if (error) throw new Error(`Failed to save household: ${error.message}`);
}

export async function ensureHouseholdForUser(
  supabase: SupabaseClient,
  userId: string,
  fullName?: string | null
): Promise<Household> {
  let profile = await fetchProfile(supabase, userId);

  if (!profile) {
    profile = await upsertProfile(
      supabase,
      userId,
      `user_${userId.replace(/-/g, '').slice(0, 10)}`,
      fullName ?? null
    );
  }

  if (profile.household_id) {
    const household = await fetchHousehold(supabase, profile.household_id);
    if (household) return household;
  }

  const household = await createHousehold(supabase, {
    name: 'Personal Pantry',
    familyMembersCount: 1,
  });
  await updateProfileHousehold(supabase, userId, household.id);
  return household;
}

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let index = 0; index < 6; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
