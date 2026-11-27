import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MagneticButton } from '../components/MagneticButton';
import { TiltCard } from '../components/TiltCard';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function FinalCtaSection() {
  const isReduced = useReducedMotion();

  const handleCtaClick = () => {
    if (!isReduced) {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0070f3', '#00c8ff', '#38bdf8', '#ffffff'],
      });
    }
    setTimeout(() => {
      window.location.hash = '#signup';
    }, 400);
  };

  return (
    <section id="homeBottomCta" className="relative py-24 lg:py-32 overflow-hidden z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <TiltCard className="p-10 sm:p-16 text-center space-y-8 bg-gradient-to-b from-white/90 to-blue-50/80 border-2 border-white shadow-2xl relative overflow-hidden">
          {/* Subtle Glow Aura */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-60 bg-[#0070f3]/15 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#0070f3] text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Join 10,000+ Creators &amp; Growth Teams
          </div>

          <h2 id="homeCtaHeading" className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight max-w-2xl mx-auto leading-tight">
            Ready to share <span className="text-[#0070f3]">smarter links?</span>
          </h2>

          <p id="homeCtaSub" className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Create your free HEA Link account in under a minute. No credit card required.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <MagneticButton
              id="homeCtaBtn"
              onClick={handleCtaClick}
              className="px-8 py-4 bg-[#0070f3] hover:bg-[#0060d4] text-white text-base font-bold rounded-2xl shadow-btn-glow transition-all"
            >
              <span className="flex items-center gap-2">
                Sign up free
                <ArrowRight className="w-5 h-5" />
              </span>
            </MagneticButton>

            <a
              href="#pricing"
              className="px-6 py-4 rounded-2xl text-slate-700 hover:text-[#0070f3] bg-white/80 border border-slate-200 text-sm font-semibold hover:bg-white transition-all shadow-sm"
            >
              View Pricing Comparison
            </a>
          </div>

          <div className="pt-6 flex items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Free forever tier
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>Instant setup</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>Cancel anytime</span>
          </div>
        </TiltCard>
      </div>
    </section>
  );
}
