'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { useSyncStatus } from '@/components/providers/sync-provider';

export function SyncStatus() {
  const { syncing, lastSyncedAt } = useSyncStatus();

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white/75 px-2.5 py-1.5 shadow-sm backdrop-blur"
      title={
        lastSyncedAt
          ? `Last synced at ${lastSyncedAt.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : 'Live sync is ready'
      }
    >
      {syncing ? (
        <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
      ) : (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      )}
      <span className="hidden text-[9px] font-black uppercase tracking-[0.1em] text-ink-500 sm:inline">
        {syncing ? 'Syncing' : 'Live sync'}
      </span>
      <RefreshCw className={`hidden h-2.5 w-2.5 text-ink-300 sm:block ${syncing ? 'animate-spin' : ''}`} />
    </div>
  );
}
