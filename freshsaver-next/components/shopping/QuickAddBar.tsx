'use client';

import { useState } from 'react';
import { Loader2, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SUGGESTIONS = ['Oat milk', 'Eggs', 'Coffee beans', 'Lemons'];

export function QuickAddBar({ onAdd }: { onAdd: (name: string) => Promise<void> }) {
  const [value, setValue] = useState('');
  const [adding, setAdding] = useState(false);

  async function submit(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setAdding(true);
    try {
      await onAdd(trimmed);
      setValue('');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not add the item to your list.'
      );
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-3 shadow-lg shadow-emerald-950/10 backdrop-blur-sm sm:p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit(value);
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="relative flex-1">
          <Plus className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Add anything — dish soap, birthday candles, oat milk…"
            className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-400 focus:ring-emerald-500/30"
            aria-label="Quick add a custom item"
            disabled={adding}
          />
        </div>
        <Button type="submit" disabled={adding || !value.trim()} className="sm:w-auto bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-300 disabled:opacity-60">
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add to list
        </Button>
      </form>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
          <Sparkles className="h-2.5 w-2.5 text-emerald-400" />
          Quick picks
        </span>
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setValue(suggestion)}
            disabled={adding}
            className="rounded-full border border-slate-700 bg-slate-900/50 px-2.5 py-1 text-[10px] font-bold text-slate-300 transition-colors hover:border-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}