import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { TiltCard } from '../components/TiltCard';

const FAQS = [
  {
    q: 'Is HEA Link free to use?',
    a: 'Yes! The Free plan gives you complete access to generate branded short links, basic QR codes, and a Link-in-Bio page at zero cost.',
  },
  {
    q: 'Can I edit a destination URL after sharing it?',
    a: 'Yes! You can edit the destination URL anytime from your dashboard. The short link and QR code remain identical.',
  },
  {
    q: 'How does the safe link redirection work?',
    a: 'When a visitor clicks your HEA Link, they are greeted by a safe gateway showing the destination URL before redirecting, keeping your audience safe from phishing.',
  },
  {
    q: 'Can I track UTM parameters and marketing campaigns?',
    a: 'Absolutely. Use our built-in UTM Campaign Builder to tag sources, mediums, and campaigns, then monitor performance in the Analytics tab.',
  },
  {
    q: 'How does HEA Link compare to Bitly and Rebrandly?',
    a: 'Unlike legacy link shorteners that charge high subscription fees for basic custom domains and lock your analytics behind paywalls, HEA Link includes custom domains, dynamic QR codes, mobile bio pages, and unlimited link generation with no surprise fees.',
  },
  {
    q: 'Are visitor clicks tracked in real time?',
    a: 'Yes! Every click and QR scan streams directly to your analytics dashboard with geolocation, operating system, browser, referrer source, and exact timestamp data.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="relative py-24 lg:py-32 overflow-hidden z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#0070f3] text-xs font-semibold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            FAQ
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight">
            Frequently asked <span className="text-[#0070f3]">questions</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Everything you need to know about the platform, migration, and link management.
          </p>
        </div>

        {/* Accordion Stack */}
        <div className="space-y-4">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <TiltCard
                key={i}
                maxTilt={3}
                className="p-5 sm:p-6 shadow-sm transition-all rounded-2xl bg-white/75 backdrop-blur-md border border-white/80"
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between gap-4 text-left font-bold text-base sm:text-lg text-[#0b132b] hover:text-[#0070f3] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180 text-[#0070f3]' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="pt-4 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100 mt-4">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
