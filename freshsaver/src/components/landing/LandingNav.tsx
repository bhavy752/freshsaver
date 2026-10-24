import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Leaf, Menu, Sparkles, X } from 'lucide-react';

interface LandingNavProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Savings', href: '#savings' },
  { label: 'Stories', href: '#stories' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export function LandingNav({ onGetStarted, onSignIn }: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-white/10 bg-[#06120d]/90 shadow-2xl shadow-black/20'
          : 'border-transparent bg-[#06120d]/55'
      } backdrop-blur-xl`}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 lg:px-8">
        <a
          href="#top"
          className="group flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          aria-label="FreshSaver home"
        >
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/25 transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105">
            <Leaf className="h-5 w-5 text-white" strokeWidth={2.5} />
            <span className="absolute inset-x-0 top-0 h-1/2 bg-white/15" />
          </span>
          <span className="flex items-center gap-2">
            <span className="text-lg font-black tracking-[-0.04em] text-white">FreshSaver</span>
            <span className="hidden rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-200 sm:inline">
              Beta
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 backdrop-blur-md lg:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-[13px] font-bold text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={onSignIn}
            className="rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            Sign in
          </button>
          <motion.button
            type="button"
            onClick={onGetStarted}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group relative overflow-hidden rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-black text-[#052e1b] shadow-lg shadow-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06120d]"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              Get started
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.5} />
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-emerald-300 via-white/50 to-emerald-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </motion.button>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-navigation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-white/10 bg-[#06120d]/95 sm:hidden"
          >
            <nav className="space-y-1 px-5 py-4" aria-label="Mobile navigation">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-3 py-3 text-sm font-bold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-3">
                <button
                  type="button"
                  onClick={onSignIn}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-[#052e1b]"
                >
                  Get started
                  <Sparkles className="h-4 w-4" />
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
