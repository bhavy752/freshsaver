import { supabase } from '@/lib/supabase';
import type { Profile, Household } from '@/types';

interface ProfileRow {
  id: string;
  username: string;
  full_name: string | null;
  household_id: string | null;
  pin_code_hash: string | null;
  waste_streak: number;
  money_saved: number;
  last_waste_check_date: string | null;
  created_at: string;
  updated_at?: string;
}

const PROFILE_SELECT = 'id, username, full_name, household_id, pin_code_hash, waste_streak, money_saved, last_waste_check_date, created_at, updated_at';

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    full_name: row.full_name,
    household_id: row.household_id,
    pin_code_hash: row.pin_code_hash,
    waste_streak: row.waste_streak ?? 0,
    money_saved: row.money_saved ?? 0,
    last_waste_check_date: row.last_waste_check_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  return data ? rowToProfile(data as ProfileRow) : null;
}

export async function createProfile(
  userId: string,
  username: string,
  fullName: string
): Promise<Profile> {
  // Upsert because the database trigger auto-creates a minimal profile row
  // on signup. This updates the chosen username / full_name on conflict.
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      { id: userId, username, full_name: fullName || null },
      { onConflict: 'id' }
    )
    .select(PROFILE_SELECT)
    .maybeSingle();

  if (error) throw new Error(`Failed to create profile: ${error.message}`);
  if (!data) throw new Error('Failed to create profile: no data returned');
  return rowToProfile(data as ProfileRow);
}

export async function updateProfileHousehold(
  userId: string,
  householdId: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ household_id: householdId })
    .eq('id', userId);

  if (error) throw new Error(`Failed to update profile: ${error.message}`);
}

export async function setProfilePin(
  userId: string,
  pinCodeHash: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ pin_code_hash: pinCodeHash })
    .eq('id', userId);

  if (error) throw new Error(`Failed to set PIN: ${error.message}`);
}

export async function clearProfilePin(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ pin_code_hash: null })
    .eq('id', userId);

  if (error) throw new Error(`Failed to clear PIN: ${error.message}`);
}

export async function updateProfileMoneySaved(
  userId: string,
  amount: number
): Promise<void> {
  const { error } = await supabase.rpc('increment_money_saved', { user_id: userId, amount });
  if (error) throw new Error(`Failed to update money saved: ${error.message}`);
}

export async function updateWasteStreak(
  userId: string,
  streak: number,
  checkDate: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ waste_streak: streak, last_waste_check_date: checkDate })
    .eq('id', userId);

  if (error) throw new Error(`Failed to update streak: ${error.message}`);
}

export async function createHousehold(
  name: string,
  familyMembersCount: number
): Promise<Household> {
  const joinCode = generateJoinCode();
  const { data, error } = await supabase
    .from('households')
    .insert({ name, family_members_count: familyMembersCount, join_code: joinCode })
    .select('id, name, family_members_count, join_code, created_at')
    .maybeSingle();

  if (error) throw new Error(`Failed to create household: ${error.message}`);
  if (!data) throw new Error('Failed to create household: no data returned');
  return data as Household;
}

export async function fetchHouseholdByJoinCode(joinCode: string): Promise<Household | null> {
  const { data, error } = await supabase
    .from('households')
    .select('id, name, family_members_count, join_code, created_at')
    .eq('join_code', joinCode.toUpperCase())
    .maybeSingle();

  if (error) throw new Error(`Failed to find household: ${error.message}`);
  return data as Household | null;
}

export async function fetchHousehold(householdId: string): Promise<Household | null> {
  const { data, error } = await supabase
    .from('households')
    .select('id, name, family_members_count, join_code, created_at')
    .eq('id', householdId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load household: ${error.message}`);
  return data as Household | null;
}

export async function updateHouseholdMemberCount(
  householdId: string,
  count: number
): Promise<void> {
  const { error } = await supabase
    .from('households')
    .update({ family_members_count: count })
    .eq('id', householdId);

  if (error) throw new Error(`Failed to update household: ${error.message}`);
}

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
