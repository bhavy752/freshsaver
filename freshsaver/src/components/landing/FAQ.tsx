import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import { SectionHeading } from '@/components/landing/SectionHeading';

const FAQ_ITEMS = [
  {
    question: 'How accurate is the AI receipt scanner?',
    answer:
      'FreshSaver reads standard printed and digital receipts with about 98% line-item accuracy across 40+ grocery chains. It recognises common abbreviations, multi-buy offers, and weighed produce, then lets you review or edit anything before it joins your pantry.',
  },
  {
    question: 'Can my whole family share one pantry?',
    answer:
      'Yes. Invite your household with a private join code and everyone gets the same live inventory, expiry alerts, and shopping list. Updates sync in real time, so nobody buys a fourth bottle of olive oil again. Free includes two members; Pro supports up to eight.',
  },
  {
    question: 'What is included in the free tier?',
    answer:
      'Free includes one household with two members, 10 AI receipt scans per month, unlimited manual items, smart expiry alerts, and zero-waste recipe suggestions. No credit card is required, and there is no time limit.',
  },
  {
    question: 'Does FreshSaver work across phone, tablet, and web?',
    answer:
      'Absolutely. FreshSaver is a responsive web app that works beautifully on phones, tablets, and desktop. Scan receipts with your phone camera, then plan meals or check your pantry from your laptop — everything stays in sync.',
  },
  {
    question: 'How does FreshSaver calculate my savings?',
    answer:
      'We track the estimated value of items you mark consumed before they expire, compare it with your household baseline, and show a conservative monthly savings estimate. Our calculator uses national food-waste averages as a starting point, not a guarantee.',
  },
  {
    question: 'Can I cancel or change plans later?',
    answer:
      'Of course. Upgrade, downgrade, or cancel from your account settings at any time. Annual plans include a 30-day money-back guarantee, and you keep access through the end of your billing period.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-28 relative overflow-hidden bg-[#f8faf5] py-20 sm:py-24 lg:py-28">
      <div className="pointer-events-none absolute -right-28 top-16 h-80 w-80 rounded-full bg-emerald-200/35 blur-3xl" />
      <div className="relative mx-auto max-w-4xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Good questions"
          title={<>Everything you need to know <span className="text-emerald-600">before your first scan.</span></>}
          description="Still curious? Our team is a real human email away."
        />

        <div className="mt-10 space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;

            return (
              <motion.div
                key={item.question}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
                className={`overflow-hidden rounded-2xl border transition-colors ${
                  isOpen
                    ? 'border-emerald-200 bg-white shadow-lg shadow-emerald-950/[0.05]'
                    : 'border-slate-200/80 bg-white/65 hover:border-emerald-200/80 hover:bg-white'
                }`}
              >
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400 sm:px-6 sm:py-5"
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <HelpCircle className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm font-black text-slate-900 sm:text-[15px]">{item.question}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      isOpen ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 pl-16 text-sm font-medium leading-relaxed text-slate-600 sm:px-6 sm:pb-6 sm:pl-[4.5rem]">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-5 py-4 sm:flex-row sm:px-6"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-slate-900">Still have a question?</p>
              <p className="text-[11px] font-medium text-slate-500">We answer every email within one business day.</p>
            </div>
          </div>
          <a
            href="mailto:hello@freshsaver.app"
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Talk to a human
          </a>
        </motion.div>
      </div>
    </section>
  );
}
