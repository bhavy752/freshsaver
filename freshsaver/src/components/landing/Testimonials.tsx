import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Quote,
  Sparkles,
  Star,
  TrendingDown,
} from 'lucide-react';
import { SectionHeading } from '@/components/landing/SectionHeading';
import { fadeUp } from '@/components/landing/motion';

type Persona = 'all' | 'parents' | 'roommates' | 'planners';

interface Testimonial {
  id: string;
  persona: Exclude<Persona, 'all'>;
  name: string;
  role: string;
  avatar: string;
  quote: string;
  saved: string;
  rating: number;
  color: string;
}

const PERSONAS: { id: Persona; label: string; emoji: string }[] = [
  { id: 'all', label: 'All stories', emoji: '✨' },
  { id: 'parents', label: 'Busy Parents', emoji: '👨‍👩‍👧' },
  { id: 'roommates', label: 'College Roommates', emoji: '🎓' },
  { id: 'planners', label: 'Smart Meal Planners', emoji: '🥗' },
];

const TESTIMONIALS: Testimonial[] = [
  {
    id: 'maya',
    persona: 'parents',
    name: 'Maya R.',
    role: 'Mom of two · Portland',
    avatar: '👩🏽‍🦱',
    quote: 'The receipt scan is almost scary good. I snapped one photo at the farmers market and our whole pantry was organised before I unpacked the bags.',
    saved: '$186/mo',
    rating: 5,
    color: 'from-emerald-100 to-lime-50',
  },
  {
    id: 'sam',
    persona: 'roommates',
    name: 'Sam K.',
    role: 'Roommate of 4 · Austin',
    avatar: '🧑🏻‍💻',
    quote: 'We used to buy three cartons of eggs every week. Now everyone checks the shared pantry first. Our grocery bill dropped by a third.',
    saved: '$94/mo',
    rating: 5,
    color: 'from-sky-100 to-cyan-50',
  },
  {
    id: 'priya',
    persona: 'planners',
    name: 'Priya N.',
    role: 'Meal prep obsessive · Seattle',
    avatar: '👩🏽‍🍳',
    quote: 'The zero-waste recipe suggestions use exactly what is about to expire. I have not thrown away a wilted bunch of herbs in two months.',
    saved: '$72/mo',
    rating: 5,
    color: 'from-amber-100 to-orange-50',
  },
  {
    id: 'daniel',
    persona: 'parents',
    name: 'Daniel & Lila',
    role: 'Family of five · Denver',
    avatar: '👨🏼‍👩🏽',
    quote: 'Our kids actually check the urgency badges now. It turned “what is for dinner?” into a family game — and our fridge is finally under control.',
    saved: '$210/mo',
    rating: 5,
    color: 'from-violet-100 to-fuchsia-50',
  },
  {
    id: 'jules',
    persona: 'roommates',
    name: 'Jules M.',
    role: 'Student · Chicago',
    avatar: '🧑🏾‍🎓',
    quote: 'Between classes and work I never knew what was in the fridge. The live sync is the only reason my roommates and I still split groceries peacefully.',
    saved: '$61/mo',
    rating: 4,
    color: 'from-rose-100 to-pink-50',
  },
  {
    id: 'ben',
    persona: 'planners',
    name: 'Ben T.',
    role: 'Marathon training · Brooklyn',
    avatar: '👨🏿‍🦱',
    quote: 'I plan meals around training, not around waste. FreshSaver gives me a weekly “use it first” list that fits my macros without the mental load.',
    saved: '$88/mo',
    rating: 5,
    color: 'from-teal-100 to-emerald-50',
  },
];

export function Testimonials() {
  const [activePersona, setActivePersona] = useState<Persona>('all');
  const carouselRef = useRef<HTMLDivElement>(null);

  const visibleTestimonials = useMemo(
    () => TESTIMONIALS.filter((testimonial) => activePersona === 'all' || testimonial.persona === activePersona),
    [activePersona]
  );

  useEffect(() => {
    carouselRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  }, [activePersona]);

  const scrollCarousel = (direction: 1 | -1) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    carousel.scrollBy({ left: direction * Math.min(carousel.clientWidth * 0.88, 410), behavior: 'smooth' });
  };

  return (
    <section id="stories" className="scroll-mt-28 relative overflow-hidden bg-[#f8faf5] py-20 sm:py-24 lg:py-28">
      <div className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-4 h-80 w-80 rounded-full bg-emerald-200/35 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            align="left"
            eyebrow="Kitchen table proof"
            title={<>Real homes. <span className="text-emerald-600">Real money back.</span></>}
            description="Join 25,000+ households using FreshSaver to eat better, shop smarter, and waste a whole lot less."
          />

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-3 gap-2 rounded-2xl border border-white/80 bg-white/70 p-2 shadow-lg shadow-emerald-950/[0.04] backdrop-blur-md"
          >
            {[
              { value: '4.9/5', label: 'avg rating' },
              { value: '25k+', label: 'households' },
              { value: '$1.2M', label: 'saved' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl px-3 py-2 text-center">
                <p className="text-lg font-black tracking-tight text-slate-950">{stat.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.11em] text-slate-400">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter testimonials by household type">
            {PERSONAS.map((persona) => {
              const isActive = activePersona === persona.id;
              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => setActivePersona(persona.id)}
                  aria-pressed={isActive}
                  className={`relative flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[11px] font-black transition-all ${
                    isActive
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/60'
                  }`}
                >
                  <span aria-hidden="true">{persona.emoji}</span>
                  {persona.label}
                </button>
              );
            })}
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollCarousel(-1)}
              aria-label="Previous testimonials"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-emerald-300 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel(1)}
              aria-label="Next testimonials"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-emerald-300 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={carouselRef}
          className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {visibleTestimonials.map((testimonial, index) => (
              <motion.article
                key={testimonial.id}
                layout
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className={`flex min-w-[86%] snap-start flex-col rounded-[2rem] border border-white/90 bg-gradient-to-br p-5 shadow-lg shadow-slate-950/[0.04] sm:min-w-[370px] lg:min-w-[390px] ${testimonial.color}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-1" aria-label={`Rated ${testimonial.rating} out of 5`}>
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className={`h-3.5 w-3.5 ${
                          starIndex < testimonial.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-200 text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <Quote className="h-7 w-7 text-slate-900/10" fill="currentColor" />
                </div>

                <p className="mt-4 flex-1 text-pretty text-sm font-semibold leading-relaxed text-slate-700">
                  “{testimonial.quote}”
                </p>

                <div className="mt-5 flex items-center gap-3 border-t border-slate-900/[0.07] pt-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/80 text-xl shadow-sm">
                    {testimonial.avatar}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 text-xs font-black text-slate-900">
                      {testimonial.name}
                      <BadgeCheck className="h-3.5 w-3.5 fill-emerald-600 text-white" />
                    </p>
                    <p className="truncate text-[10px] font-semibold text-slate-500">{testimonial.role}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-black text-emerald-700 shadow-sm">
                    <TrendingDown className="h-3 w-3" />
                    {testimonial.saved}
                  </span>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-2 flex items-center justify-between sm:hidden">
          <p className="text-[10px] font-bold text-slate-400">Swipe for more stories</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollCarousel(-1)}
              aria-label="Previous testimonials"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel(1)}
              aria-label="Next testimonials"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-8 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          Every story is from a verified FreshSaver household.
        </motion.div>
      </div>
    </section>
  );
}
