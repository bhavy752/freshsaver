'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface SyncContextValue {
  syncing: boolean;
  lastSyncedAt: Date | null;
  beginSync: () => void;
  endSync: () => void;
  markSynced: () => void;
}

const SyncContext = createContext<SyncContextValue>({
  syncing: false,
  lastSyncedAt: null,
  beginSync: () => undefined,
  endSync: () => undefined,
  markSynced: () => undefined,
});

export function SyncProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const beginSync = useCallback(() => setPending((count) => count + 1), []);
  const endSync = useCallback(() => setPending((count) => Math.max(0, count - 1)), []);
  const markSynced = useCallback(() => setLastSyncedAt(new Date()), []);

  const value = useMemo(
    () => ({
      syncing: pending > 0,
      lastSyncedAt,
      beginSync,
      endSync,
      markSynced,
    }),
    [pending, lastSyncedAt, beginSync, endSync, markSynced]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSyncStatus() {
  return useContext(SyncContext);
}
