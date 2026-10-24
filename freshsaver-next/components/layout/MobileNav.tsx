'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Plus, ScanLine, ShoppingBasket } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  function openOnDashboard(eventName: string, query: string) {
    if (pathname === '/dashboard') {
      window.dispatchEvent(new CustomEvent(eventName));
      return;
    }
    router.push(`/dashboard?${query}=1`);
  }

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_-24px_rgba(6,78,59,0.35)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-4 items-center px-2">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] font-black transition-colors ${
            pathname === '/dashboard' ? 'text-emerald-600' : 'text-ink-400'
          }`}
        >
          <LayoutDashboard className="h-[18px] w-[18px]" />
          Kitchen
        </Link>

        <Link
          href="/shopping-list"
          className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] font-black transition-colors ${
            pathname === '/shopping-list' ? 'text-emerald-600' : 'text-ink-400'
          }`}
        >
          <ShoppingBasket className="h-[18px] w-[18px]" />
          Shopping
        </Link>

        <button
          type="button"
          onClick={() => openOnDashboard('freshsaver:add-item', 'add')}
          className="flex flex-col items-center gap-1 py-1.5 text-[9px] font-black text-ink-400"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
            <Plus className="h-5 w-5" />
          </span>
          Add
        </button>

        <button
          type="button"
          onClick={() => openOnDashboard('freshsaver:scan-receipt', 'scan')}
          className="flex flex-col items-center gap-1 py-1.5 text-[9px] font-black text-ink-400"
        >
          <ScanLine className="h-[18px] w-[18px]" />
          Scan
        </button>
      </div>
    </nav>
  );
}
