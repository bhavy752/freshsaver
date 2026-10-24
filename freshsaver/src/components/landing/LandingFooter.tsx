import { ArrowUpRight, Github, Instagram, Leaf, Linkedin, Twitter } from 'lucide-react';

interface LandingFooterProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const PRODUCT_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Savings calculator', href: '#savings' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

const COMPANY_LINKS = [
  { label: 'Customer stories', href: '#stories' },
  { label: 'Our impact', href: '#savings' },
  { label: 'Contact', href: 'mailto:hello@freshsaver.app' },
  { label: 'Press kit', href: 'mailto:press@freshsaver.app' },
];

export function LandingFooter({ onGetStarted, onSignIn }: LandingFooterProps) {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#040d09] text-slate-300">
      <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 pb-8 pt-14 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.7fr_0.7fr_0.9fr]">
          <div>
            <a href="#top" className="inline-flex items-center gap-2.5" aria-label="FreshSaver home">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
                <Leaf className="h-5 w-5 text-[#052e1b]" strokeWidth={2.5} />
              </span>
              <span className="text-lg font-black tracking-[-0.04em] text-white">FreshSaver</span>
            </a>
            <p className="mt-4 max-w-xs text-sm font-medium leading-relaxed text-slate-400">
              The AI-powered kitchen companion that helps your household buy less, use more, and waste nothing.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { icon: Twitter, label: 'FreshSaver on X', href: 'https://x.com' },
                { icon: Instagram, label: 'FreshSaver on Instagram', href: 'https://instagram.com' },
                { icon: Linkedin, label: 'FreshSaver on LinkedIn', href: 'https://linkedin.com' },
                { icon: Github, label: 'FreshSaver on GitHub', href: 'https://github.com' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Product</h3>
            <ul className="mt-4 space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm font-semibold text-slate-400 transition-colors hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Company</h3>
            <ul className="mt-4 space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm font-semibold text-slate-400 transition-colors hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Start saving</h3>
            <p className="mt-4 text-sm font-medium leading-relaxed text-slate-400">
              Your first rescued meal is one scan away.
            </p>
            <button
              type="button"
              onClick={onGetStarted}
              className="group mt-4 flex w-full items-center justify-between gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-[#052e1b] transition-colors hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
            >
              Create free account
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={onSignIn}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Sign in
            </button>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-[11px] font-medium text-slate-500">
            © {new Date().getFullYear()} FreshSaver. Made for kitchens that care.
          </p>
          <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
            <a href="#top" className="transition-colors hover:text-slate-300">Privacy</a>
            <a href="#top" className="transition-colors hover:text-slate-300">Terms</a>
            <a href="#top" className="transition-colors hover:text-slate-300">Back to top ↑</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
