import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { hashPin } from '@/lib/pin';
import {
  fetchProfile,
  createProfile,
  createHousehold,
  updateProfileHousehold,
  fetchHouseholdByJoinCode,
  fetchHousehold,
  setProfilePin,
  clearProfilePin,
} from '@/services/profiles';
import type { Profile, Household } from '@/types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  household: Household | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, fullName: string, householdName: string, familyMembersCount: number, joinCode: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  joinHousehold: (joinCode: string) => Promise<{ error: string | null }>;
  setupPin: (pin: string) => Promise<{ error: string | null }>;
  removePin: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfileAndHousehold = useCallback(async (userId: string) => {
    const p = await fetchProfile(userId);
    setProfile(p);
    if (p?.household_id) {
      const h = await fetchHousehold(p.household_id);
      setHousehold(h);
    } else {
      setHousehold(null);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data } = await supabase?.auth?.getSession?.() || { data: { session: null } };
        setSession(data.session);
        
        if (data.session?.user) {
          await loadProfileAndHousehold(data.session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: listener } = supabase?.auth?.onAuthStateChange?.((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfileAndHousehold(newSession.user.id).catch(() => {});
      } else {
        setProfile(null);
        setHousehold(null);
      }
    }) || { data: { subscription: null } };

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [loadProfileAndHousehold]);

  const signUp = async (
    email: string,
    password: string,
    username: string,
    fullName: string,
    householdName: string,
    familyMembersCount: number,
    joinCode: string
  ): Promise<{ error: string | null }> => {
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) return { error: authError.message };
    if (!authData.user) return { error: 'Failed to create account' };

    try {
      await createProfile(authData.user.id, username, fullName);

      if (joinCode.trim()) {
        const existingHousehold = await fetchHouseholdByJoinCode(joinCode.trim());
        if (!existingHousehold) return { error: 'Invalid join code' };
        await updateProfileHousehold(authData.user.id, existingHousehold.id);
        setProfile(await fetchProfile(authData.user.id));
        setHousehold(existingHousehold);
      } else {
        const newHousehold = await createHousehold(householdName, familyMembersCount);
        await updateProfileHousehold(authData.user.id, newHousehold.id);
        setProfile(await fetchProfile(authData.user.id));
        setHousehold(newHousehold);
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to set up profile' };
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) return { error: authError.message };
    return { error: null };
  };

  const joinHousehold = async (joinCode: string): Promise<{ error: string | null }> => {
    if (!session?.user) return { error: 'Not signed in' };
    try {
      const existingProfile = await fetchProfile(session.user.id);
      if (!existingProfile) return { error: 'Profile not found' };

      const targetHousehold = await fetchHouseholdByJoinCode(joinCode);
      if (!targetHousehold) return { error: 'Invalid join code' };

      await updateProfileHousehold(session.user.id, targetHousehold.id);
      setProfile(await fetchProfile(session.user.id));
      setHousehold(targetHousehold);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to join household' };
    }
  };

  const setupPin = async (pin: string): Promise<{ error: string | null }> => {
    if (!session?.user) return { error: 'Not signed in' };
    try {
      const hash = await hashPin(pin, session.user.id);
      await setProfilePin(session.user.id, hash);
      setProfile(await fetchProfile(session.user.id));
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to set PIN' };
    }
  };

  const removePin = async (): Promise<{ error: string | null }> => {
    if (!session?.user) return { error: 'Not signed in' };
    try {
      await clearProfilePin(session.user.id);
      setProfile(await fetchProfile(session.user.id));
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to remove PIN' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setHousehold(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        household,
        loading,
        signUp,
        signIn,
        joinHousehold,
        setupPin,
        removePin,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
