import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { SavingsCalculator } from '@/components/landing/SavingsCalculator';
import { FeaturesBento } from '@/components/landing/FeaturesBento';
import { Testimonials } from '@/components/landing/Testimonials';
import { Pricing } from '@/components/landing/Pricing';
import { FAQ } from '@/components/landing/FAQ';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { DemoModal } from '@/components/landing/DemoModal';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const [demoOpen, setDemoOpen] = useState(false);

  const handleDemoGetStarted = () => {
    setDemoOpen(false);
    onGetStarted();
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f8faf5] text-slate-950 selection:bg-emerald-200 selection:text-emerald-950">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[110] -translate-y-20 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-black text-[#052e1b] transition-transform focus:translate-y-0 focus:outline-none"
      >
        Skip to content
      </a>

      <LandingNav onGetStarted={onGetStarted} onSignIn={onSignIn} />

      <main id="main-content">
        <LandingHero onGetStarted={onGetStarted} onWatchDemo={() => setDemoOpen(true)} />
        <SavingsCalculator onGetStarted={onGetStarted} />
        <FeaturesBento />
        <Testimonials />
        <Pricing onGetStarted={onGetStarted} />
        <FAQ />
        <FinalCTA onGetStarted={onGetStarted} />
      </main>

      <LandingFooter onGetStarted={onGetStarted} onSignIn={onSignIn} />

      <AnimatePresence>
        {demoOpen && (
          <DemoModal
            onClose={() => setDemoOpen(false)}
            onGetStarted={handleDemoGetStarted}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
