'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { AppUser, Household, Profile } from '@/lib/types';

interface AppContextValue {
  demo: boolean;
  user: AppUser;
  profile: Profile;
  household: Household;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  value,
  children,
}: {
  value: AppContextValue;
  children: ReactNode;
}) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside <AppProvider>');
  return value;
}
