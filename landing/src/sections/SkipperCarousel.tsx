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
      <div className="relative w-full max-w-md mx-auto group">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#0070f3]/20 to-[#00d2ff]/20 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-500 pointer-events-none" />
        <div className="relative overflow-hidden rounded-2xl border border-white/90 bg-white/60 shadow-xl backdrop-blur-md">
          <img
            src="/images/carousel-shortlinks.jpg"
            alt="AI-Powered Short Links"
            className="w-full h-64 sm:h-72 object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/90 backdrop-blur-md border border-white/90 shadow-sm text-xs font-semibold text-slate-800">
            <span className="flex items-center gap-1.5 text-[#0070f3]">
              <Zap className="w-3.5 h-3.5 fill-[#0070f3]" /> hea.link/ai
            </span>
            <span className="text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">
              Active • 2.4k Clicks
            </span>
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
      <div className="relative w-full max-w-md mx-auto group">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#00c8ff]/20 to-blue-500/20 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-500 pointer-events-none" />
        <div className="relative overflow-hidden rounded-2xl border border-white/90 bg-white/60 shadow-xl backdrop-blur-md">
          <img
            src="/images/carousel-qrcode.jpg"
            alt="Dynamic Gradient Vector QR Code Studio"
            className="w-full h-64 sm:h-72 object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/90 backdrop-blur-md border border-white/90 shadow-sm text-xs font-semibold text-slate-800">
            <span className="flex items-center gap-1.5 text-[#0070f3]">
              <QrCode className="w-3.5 h-3.5" /> Vector HD Scan
            </span>
            <span className="text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full font-bold">
              Dynamic Target
            </span>
          </div>
        </div>
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
      <div className="relative w-full max-w-md mx-auto group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-500 pointer-events-none" />
        <div className="relative overflow-hidden rounded-2xl border border-white/90 bg-white/60 shadow-xl backdrop-blur-md">
          <img
            src="/images/carousel-bio.jpg"
            alt="Link-in-Bio Social Showcase"
            className="w-full h-64 sm:h-72 object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/90 backdrop-blur-md border border-white/90 shadow-sm text-xs font-semibold text-slate-800">
            <span className="flex items-center gap-1.5 text-purple-600">
              <Smartphone className="w-3.5 h-3.5" /> @yourbrand
            </span>
            <span className="text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full font-bold">
              Glassmorphic Bio
            </span>
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
      <div className="relative w-full max-w-md mx-auto group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-[#0070f3]/20 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-500 pointer-events-none" />
        <div className="relative overflow-hidden rounded-2xl border border-white/90 bg-white/60 shadow-xl backdrop-blur-md">
          <img
            src="/images/carousel-analytics.jpg"
            alt="Real-Time Deep Analytics"
            className="w-full h-64 sm:h-72 object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/90 backdrop-blur-md border border-white/90 shadow-sm text-xs font-semibold text-slate-800">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <BarChart3 className="w-3.5 h-3.5" /> Live Traffic Stream
            </span>
            <span className="text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">
              +34.8% Growth
            </span>
          </div>
        </div>
      </div>
    ),
  },
];

export function SkipperCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % SLIDES.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  // 3-second automatic progression
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSlide]);

  const slide = SLIDES[activeSlide];

  return (
    <section
      id="skipperShowcase"
      className="relative py-20 lg:py-28 z-10 overflow-hidden"
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
