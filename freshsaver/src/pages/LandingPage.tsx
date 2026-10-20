import { motion } from 'framer-motion';
import { Leaf, Camera, ChefHat, TrendingDown, ArrowRight, Sparkles, Clock, Utensils, ShoppingCart } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-cream-50">
      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-40 bg-cream-50/80 backdrop-blur-md border-b border-sage-100"
      >
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-sage-500 shadow-sm">
              <Leaf className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">FreshSaver</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={onSignIn} className="text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl px-4 py-2.5 hover:bg-slate-50 active:scale-95 transition-all shadow-sm">
              Sign In
            </button>
            <button onClick={onGetStarted} className="text-sm font-semibold text-white bg-emerald-600 rounded-xl px-4 py-2.5 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm">
              Get Started
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div {...fadeUp} className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-sage-100 px-4 py-1.5 mb-6">
              <Sparkles className="w-4 h-4 text-sage-600" strokeWidth={2.5} />
              <span className="text-xs font-bold text-sage-700">Smart Food Tracking for Families</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Track smarter,
              <br />
              <span className="text-sage-600">waste less.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-500 font-medium mt-6 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              FreshSaver helps your whole family keep tabs on everything in your fridge and pantry.
              Snap a receipt, get instant expiry tracking, discover recipes, and auto-build your grocery list.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center lg:justify-start">
              <button onClick={onGetStarted} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-white font-semibold text-base py-4 px-6 shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all">
                Create Free Account
                <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
              <button onClick={onSignIn} className="flex items-center justify-center gap-2 rounded-2xl bg-white text-slate-800 border border-slate-300 font-semibold text-base py-4 px-6 hover:bg-slate-50 active:scale-[0.98] transition-all">
                I already have one
              </button>
            </div>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden lg:flex justify-center"
          >
            <div className="relative w-full max-w-md">
              <div className="absolute inset-0 bg-sage-200/40 rounded-[2.5rem] blur-3xl" />
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-100 p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-sage-500 flex items-center justify-center">
                      <Leaf className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="font-extrabold text-slate-900">Our Fridge</span>
                  </div>
                  <span className="text-xs font-bold text-sage-600 bg-sage-50 rounded-full px-3 py-1">6 items</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-xl bg-cream-50 border border-cream-200 py-2 text-center">
                    <span className="text-xs font-bold text-coral-600">1 Critical</span>
                  </div>
                  <div className="flex-1 rounded-xl bg-cream-50 border border-cream-200 py-2 text-center">
                    <span className="text-xs font-bold text-amber-600">1 Soon</span>
                  </div>
                  <div className="flex-1 rounded-xl bg-cream-50 border border-cream-200 py-2 text-center">
                    <span className="text-xs font-bold text-sage-600">4 Fresh</span>
                  </div>
                </div>
                {[
                  { emoji: '🥬', name: 'Spinach', qty: '1 bunch', days: '1 day left', color: 'coral' },
                  { emoji: '🍓', name: 'Strawberries', qty: '1 pack', days: '2 days left', color: 'amber' },
                  { emoji: '🥛', name: 'Greek Yogurt', qty: '2 pcs', days: '4 days left', color: 'sage' },
                  { emoji: '🥔', name: 'Potatoes', qty: '1.5 kg', days: '18 days left', color: 'sage' },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-3 rounded-2xl bg-cream-50 border border-cream-200 p-3">
                    <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm">
                      {item.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{item.qty} · {item.days}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${item.color === 'coral' ? 'bg-coral-400' : item.color === 'amber' ? 'bg-amber-400' : 'bg-sage-400'}`} />
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-y border-sage-100 py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything you need to stop wasting food
            </h2>
            <p className="text-base text-slate-500 font-medium mt-4 max-w-2xl mx-auto">
              From the moment you bring groceries home to the last bite, FreshSaver keeps
              your kitchen organized and your food out of the trash.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Camera, title: 'Receipt Scanning', desc: 'Snap a photo of your grocery receipt and our AI instantly detects items, categories, and estimated shelf life.', color: 'sage' },
              { icon: Clock, title: 'Expiry Tracking', desc: 'Color-coded urgency levels show you exactly what needs to be eaten first — critical, soon, or fresh.', color: 'coral' },
              { icon: ChefHat, title: 'Recipe Suggestions', desc: 'Get quick recipe ideas using the ingredients that are about to expire, so nothing goes to waste.', color: 'amber' },
              { icon: ShoppingCart, title: 'Smart Grocery List', desc: 'Automatically generate a shopping list from items you have consumed, wasted, or are running low on.', color: 'sage' },
              { icon: TrendingDown, title: 'Waste Less', desc: 'The average household throws away $1,500 of food yearly. FreshSaver helps you keep that money in your pocket.', color: 'coral' },
              { icon: Utensils, title: 'Family Sharing', desc: 'Your whole family shares one household inventory. Everyone sees what is in the fridge and what is expiring.', color: 'amber' },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="rounded-3xl bg-cream-50 border border-sage-100 p-6 hover:shadow-lg hover:shadow-slateink-900/5 transition-all hover:-translate-y-0.5"
                >
                  <div className={`flex items-center justify-center w-12 h-12 rounded-2xl mb-4 ${feature.color === 'sage' ? 'bg-sage-100' : feature.color === 'coral' ? 'bg-coral-100' : 'bg-amber-100'}`}>
                    <Icon className={`w-6 h-6 ${feature.color === 'sage' ? 'text-sage-600' : feature.color === 'coral' ? 'text-coral-500' : 'text-amber-600'}`} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-5 lg:px-8 py-16 lg:py-24">
        <div className="grid sm:grid-cols-3 gap-8 text-center">
          {[
            { stat: '30%', label: 'of food purchased ends up wasted' },
            { stat: '$1,500', label: 'lost per household every year' },
            { stat: '8%', label: 'of global emissions from food waste' },
          ].map((item, i) => (
            <motion.div key={item.stat} {...fadeUp} transition={{ duration: 0.4, delay: i * 0.1 }}>
              <p className="text-4xl lg:text-5xl font-extrabold text-sage-600 tracking-tight">{item.stat}</p>
              <p className="text-sm text-slate-500 font-medium mt-2 max-w-xs mx-auto">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 lg:px-8 pb-20">
        <motion.div
          {...fadeUp}
          className="rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-12 lg:px-16 lg:py-16 text-center shadow-xl shadow-emerald-500/20"
        >
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">Ready to stop wasting food?</h2>
          <p className="text-base lg:text-lg text-sage-100 font-medium mt-4 max-w-xl mx-auto">
            Join FreshSaver today and take control of your kitchen. It is free, simple, and takes less than a minute to set up.
          </p>
          <button onClick={onGetStarted} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 text-white font-semibold text-base py-4 px-8 mt-8 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm">
            Get Started Free
            <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sage-100 bg-white">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-sage-500">
                <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-slate-900">FreshSaver</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Track smarter, waste less.</p>
        </div>
      </footer>
    </div>
  );
}
