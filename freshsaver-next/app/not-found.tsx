import Link from 'next/link';
import { Leaf } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-50 px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
          <Leaf className="h-7 w-7" />
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-emerald-600">
          404 · Lost in the pantry
        </p>
        <h1 className="mt-2 text-4xl font-black text-ink-950">This shelf is empty.</h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-ink-500">
          The page you were looking for has been eaten, moved, or never existed.
        </p>
        <Link
          href="/dashboard"
          className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-500 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-600"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
