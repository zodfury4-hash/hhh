import { useState } from 'react';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { TiltCard } from '../components/TiltCard';
import { MagneticButton } from '../components/MagneticButton';

interface Plan {
  name: string;
  pricePKR: string;
  priceUSD: string;
  period: string;
  desc: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  popular: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    pricePKR: 'Rs 0',
    priceUSD: '$0',
    period: 'forever free',
    desc: 'Perfect for creators and individuals testing branded link generation.',
    features: [
      '50 short links a month',
      'Standard QR codes',
      '7-day analytics retention',
      '1 Link-in-Bio page',
      'Community support',
    ],
    ctaText: 'Get Started Free',
    ctaLink: '#signup',
    popular: false,
  },
  {
    name: 'Pro',
    pricePKR: 'Rs 1,499',
    priceUSD: '$9',
    period: 'per month',
    desc: 'For high-velocity marketers, agencies, and businesses demanding full custom branding.',
    features: [
      'Unlimited short links',
      'Dynamic QR with logo & colours',
      'Password, expiry & UTM builder',
      '1-year analytics + AI summaries',
      '5 Link-in-Bio pages',
      'Custom branded domains',
    ],
    ctaText: 'Start Pro Free',
    ctaLink: '#signup',
    popular: true,
  },
  {
    name: 'Enterprise',
    pricePKR: 'Custom',
    priceUSD: 'Custom',
    period: 'tailored SLA',
    desc: 'Dedicated high-throughput infrastructure with custom SLAs and single sign-on.',
    features: [
      'Everything in Pro',
      'Custom branded domains',
      'Dynamic routing & REST API',
      'Team workspaces & SSO',
      'Dedicated SLA support',
      'Custom invoice billing',
    ],
    ctaText: 'Contact Sales',
    ctaLink: '#pricing',
    popular: false,
  },
];

export function PricingSection() {
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR');

  return (
    <section id="pricing" className="relative py-24 lg:py-32 overflow-hidden z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#0070f3] text-xs font-semibold uppercase tracking-wider">
            PRICING
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight">
            Simple, transparent <span className="text-[#0070f3]">pricing</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Start free. Upgrade when your brand or team needs more power.
          </p>

          {/* Currency Toggle */}
          <div className="pt-3 flex items-center justify-center gap-3">
            <span className={`text-xs font-bold ${currency === 'PKR' ? 'text-[#0070f3]' : 'text-slate-400'}`}>
              PKR (Rs)
            </span>
            <button
              type="button"
              onClick={() => setCurrency(currency === 'PKR' ? 'USD' : 'PKR')}
              aria-label="Toggle currency"
              className="relative w-12 h-6 rounded-full bg-blue-100 p-0.5 border border-blue-200 transition-colors"
            >
              <div
                className={`w-5 h-5 rounded-full bg-[#0070f3] shadow-sm transition-transform ${
                  currency === 'USD' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-bold ${currency === 'USD' ? 'text-[#0070f3]' : 'text-slate-400'}`}>
              USD ($)
            </span>
          </div>
        </div>

        {/* 3 Tier Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch" id="plans">
          {PLANS.map((plan, i) => (
            <TiltCard
              key={i}
              maxTilt={plan.popular ? 8 : 5}
              className={`p-8 sm:p-9 flex flex-col justify-between rounded-3xl transition-all relative ${
                plan.popular
                  ? 'bg-white/85 shadow-2xl border-2 border-[#0070f3] lg:-translate-y-2'
                  : 'bg-white/70 shadow-glass border border-white/80'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#0070f3] to-[#00d2ff] text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Most Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#0b132b]">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{plan.desc}</p>
                </div>

                <div className="flex items-baseline gap-2 pt-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-[#0b132b] tracking-tight">
                    {currency === 'PKR' ? plan.pricePKR : plan.priceUSD}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ {plan.period}</span>
                </div>

                {/* Features List */}
                <ul className="space-y-3 pt-4 border-t border-slate-100">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-600">
                      <span className="p-0.5 rounded-full bg-emerald-50 text-emerald-600 mt-0.5 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-8 mt-6">
                <a
                  href={plan.ctaLink}
                  className={`w-full py-3.5 px-6 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                    plan.popular
                      ? 'bg-[#0070f3] text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm'
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
