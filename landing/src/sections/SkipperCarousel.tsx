import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Zap, QrCode, Smartphone, BarChart3, ArrowRight } from 'lucide-react';

interface Slide {
  badgeIcon: React.ReactNode;
  badgeText: string;
  title: string;
  desc: string;
  stats: { value: string; label: string }[];
  ctaText: string;
  ctaHref: string;
  visual: React.ReactNode;
}

const SLIDES: Slide[] = [
  {
    badgeIcon: <Zap className="w-3.5 h-3.5 text-[#0070f3]" />,
    badgeText: 'Intelligent Shortener',
    title: 'AI-Powered Custom Short Links',
    desc: 'Generate memorable, branded links with readable AI-suggested back-halves, password protection, expiration timers, and universal device routing.',
    stats: [
      { value: '99.99%', label: 'Uptime SLA' },
      { value: '<50ms', label: 'Redirect Speed' },
      { value: 'Zero', label: 'Ad Interstitials' },
    ],
    ctaText: 'Try Shortener Now',
    ctaHref: '#home',
    visual: (
      <div className="w-full max-w-sm rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 p-5 shadow-glass space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-400" />
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            hea.link/summer-sale
          </span>
        </div>
        <div className="space-y-3">
          <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-[#0070f3] to-[#00d2ff] animate-pulse" />
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              ✨ AI Generated
            </span>
            <span className="font-bold text-slate-700">2,480 Clicks Today</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    badgeIcon: <QrCode className="w-3.5 h-3.5 text-[#00c8ff]" />,
    badgeText: 'Vector QR Studio',
    title: 'Dynamic Gradient QR Codes',
    desc: 'Create scannable, high-density vector QR codes with custom gradients, embedded brand logos, dynamic destination updates, and instant high-res PNG downloads.',
    stats: [
      { value: 'Vector PNG', label: 'High-Res Export' },
      { value: 'Dynamic', label: 'Editable Target' },
      { value: 'Custom', label: 'Brand Palettes' },
    ],
    ctaText: 'Launch QR Studio',
    ctaHref: '#qr',
    visual: (
      <div className="w-full max-w-sm rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 p-6 shadow-glass flex flex-col items-center justify-center">
        <div className="relative w-36 h-36 rounded-2xl bg-gradient-to-tr from-[#0070f3]/10 to-[#00d2ff]/20 p-3 border border-blue-200/50 flex items-center justify-center shadow-inner">
          <div className="w-full h-full border-2 border-dashed border-[#0070f3] rounded-xl flex items-center justify-center">
            <span className="text-4xl text-[#0070f3]">▦</span>
          </div>
          <div className="absolute inset-0 m-auto w-10 h-10 rounded-lg bg-[#0070f3] text-white flex items-center justify-center font-extrabold text-xs shadow-md tracking-wider">
            HEA
          </div>
        </div>
        <span className="mt-3 text-xs font-semibold text-slate-500">Live Scannable Vector</span>
      </div>
    ),
  },
  {
    badgeIcon: <Smartphone className="w-3.5 h-3.5 text-purple-600" />,
    badgeText: 'Mobile Experience',
    title: 'Link-in-Bio Social Showcases',
    desc: 'Curate all your products, socials, and campaigns onto one mobile-first glassmorphic bio page with live themes, click tracking, and verified badges.',
    stats: [
      { value: '100%', label: 'Mobile First' },
      { value: 'Themes', label: 'Cloud Glassmorphic' },
      { value: 'Instant', label: 'Live Publishing' },
    ],
    ctaText: 'Create Bio Page',
    ctaHref: '#pages',
    visual: (
      <div className="w-full max-w-sm rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 p-5 shadow-glass text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0070f3] to-[#00d2ff] mx-auto flex items-center justify-center text-white text-xl shadow-md">
          ✨
        </div>
        <div>
          <b className="text-sm font-bold text-[#0070f3]">@yourbrand</b>
          <p className="text-xs text-slate-500 mt-0.5">All our official links &amp; releases</p>
        </div>
        <div className="space-y-2 pt-1">
          <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-100 text-xs font-semibold text-slate-700">
            Summer Drop Collection 2026 🔥
          </div>
          <div className="p-2 rounded-xl bg-white border border-slate-200/70 text-xs font-medium text-slate-500">
            Join Official Discord Community 💬
          </div>
        </div>
      </div>
    ),
  },
  {
    badgeIcon: <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />,
    badgeText: 'Deep Intelligence',
    title: 'Real-Time Deep Analytics',
    desc: 'Understand your audience with click heatmaps, country-level geolocation, browser & OS breakdowns, referrer channels, and single-click CSV exports.',
    stats: [
      { value: 'Live Stream', label: 'Instant Logging' },
      { value: 'Geo', label: 'Country & City' },
      { value: 'CSV', label: 'Full Data Export' },
    ],
    ctaText: 'View Analytics',
    ctaHref: '#analytics',
    visual: (
      <div className="w-full max-w-sm rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 p-5 shadow-glass space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#0070f3]">Total Traffic</span>
          <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            +34.8% ↑
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#0070f3] via-[#00c8ff] to-emerald-500 w-[72%] rounded-full animate-pulse" />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-600 font-medium pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0070f3]" />
            Mobile 68%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00c8ff]" />
            Desktop 32%
          </span>
        </div>
      </div>
    ),
  },
];

export function SkipperCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % SLIDES.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  // 5-second automatic progression
  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const slide = SLIDES[activeSlide];

  return (
    <section
      id="skipperShowcase"
      className="relative py-20 lg:py-28 z-10 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#0070f3] text-xs font-bold uppercase tracking-wider">
            AWARDS EXPERIENCE
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight">
            Interactive Platform Showcase
          </h2>
          <p className="text-base text-slate-600 max-w-xl mx-auto">
            Swipe, click, or explore the suite of tools designed for high-performance links.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-5xl mx-auto">
          <div className="p-8 sm:p-12 shadow-glass border border-white/80 rounded-3xl backdrop-blur-xl bg-white/70 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
              >
                {/* Left Slide Info */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-slate-700">
                    {slide.badgeIcon}
                    {slide.badgeText}
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] tracking-tight">
                    {slide.title}
                  </h3>

                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    {slide.desc}
                  </p>

                  {/* 3 Key Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {slide.stats.map((s, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white/80 border border-slate-100 shadow-sm">
                        <b className="block text-base sm:text-lg font-extrabold text-[#0070f3] leading-none mb-1">
                          {s.value}
                        </b>
                        <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Action */}
                  <div className="pt-2">
                    <a
                      href={slide.ctaHref}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0070f3] text-white font-semibold text-sm shadow-md hover:bg-blue-600 hover:shadow-lg transition-all"
                    >
                      <span>{slide.ctaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Right Slide Visual Mockup */}
                <div className="lg:col-span-5 flex items-center justify-center">
                  {slide.visual}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slider Navigation Controls */}
            <div className="flex items-center justify-between pt-8 mt-6 border-t border-slate-200/60">
              {/* Prev / Next Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Previous slide"
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-blue-50 hover:text-[#0070f3] transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next slide"
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-blue-50 hover:text-[#0070f3] transition-colors shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Pagination Dots */}
              <div className="flex items-center gap-2">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveSlide(i)}
                    aria-label={`Slide ${i + 1}`}
                    className={`h-2.5 rounded-full transition-all ${
                      activeSlide === i
                        ? 'w-8 bg-[#0070f3]'
                        : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
