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
    <div className="rounded-2xl border border-ink-100 bg-white p-3 shadow-[0_18px_50px_-40px_rgba(6,78,59,0.35)] sm:p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit(value);
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="relative flex-1">
          <Plus className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Add anything — dish soap, birthday candles, oat milk…"
            className="pl-10"
            aria-label="Quick add a custom item"
            disabled={adding}
          />
        </div>
        <Button type="submit" disabled={adding || !value.trim()} className="sm:w-auto">
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add to list
        </Button>
      </form>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.1em] text-ink-300">
          <Sparkles className="h-2.5 w-2.5" />
          Quick picks
        </span>
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setValue(suggestion)}
            disabled={adding}
            className="rounded-full border border-ink-100 bg-ink-50/60 px-2.5 py-1 text-[10px] font-bold text-ink-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
