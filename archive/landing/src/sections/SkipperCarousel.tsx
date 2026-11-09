import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Zap, QrCode, Smartphone, BarChart3, ArrowRight, ShieldCheck, Sparkles, Copy, Check } from 'lucide-react';

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

function ShortlinksVisual() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative rounded-2xl bg-white/90 backdrop-blur-xl border border-white p-5 sm:p-6 shadow-[0_12px_40px_-10px_rgba(0,112,243,0.14)] space-y-4">
        {/* Window Topbar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200/60">
            hea.link • link_builder
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
          </span>
        </div>

        {/* Long Destination URL */}
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Destination URL</span>
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500 font-mono truncate">
            https://my-store.com/products/summer-sale?utm_source=promo&amp;ref=affiliate
          </div>
        </div>

        {/* AI Transformation badge */}
        <div className="flex items-center justify-center -my-1">
          <div className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] font-bold text-[#0070f3] flex items-center gap-1.5 shadow-xs">
            <Sparkles className="w-3 h-3 text-[#0070f3]" />
            <span>AI Suggested Back-Half</span>
          </div>
        </div>

        {/* Generated Short Link */}
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Branded Short Link</span>
          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-50/90 via-sky-50/80 to-blue-50/90 border border-blue-200 text-xs font-mono">
            <span className="font-bold text-[#0070f3] text-sm tracking-tight">hea.link/summer-sale</span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0070f3] text-white text-[11px] font-sans font-semibold shadow-xs">
              <Check className="w-3 h-3" /> Copied
            </span>
          </div>
        </div>

        {/* Security & Routing pills */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-xs">
            <span className="block text-[10px] text-slate-400 font-medium">Protection</span>
            <span className="text-xs font-bold text-slate-700">🔒 AES-256</span>
          </div>
          <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-xs">
            <span className="block text-[10px] text-slate-400 font-medium">Device Route</span>
            <span className="text-xs font-bold text-slate-700">📱 Smart iOS</span>
          </div>
          <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-xs">
            <span className="block text-[10px] text-slate-400 font-medium">Clicks</span>
            <span className="text-xs font-bold text-blue-600">2,480 🔥</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function QrCodeVisual() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative rounded-2xl bg-white/90 backdrop-blur-xl border border-white p-6 shadow-[0_12px_40px_-10px_rgba(0,200,255,0.16)] flex flex-col items-center">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#0070f3] to-[#00c8ff] flex items-center justify-center text-white shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Vector Studio</span>
              <span className="text-[10px] text-slate-400 block font-mono">Dynamic Destination</span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-[#0070f3] bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
            300 DPI Export
          </span>
        </div>

        {/* QR Code Graphic with Scan Beam */}
        <div className="relative p-5 rounded-2xl bg-white border border-blue-100/90 shadow-sm">
          {/* Laser Scan line animation */}
          <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#00c8ff] to-transparent shadow-[0_0_12px_#00c8ff] animate-[bounce_3s_infinite] pointer-events-none z-10" />

          {/* Authentic Vector QR Code */}
          <svg className="w-44 h-44" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="qrGrad" x1="0" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0070f3" />
                <stop offset="100%" stopColor="#00c8ff" />
              </linearGradient>
            </defs>

            {/* Position Detection Patterns */}
            <rect x="10" y="10" width="40" height="40" rx="8" stroke="url(#qrGrad)" strokeWidth="6" />
            <rect x="20" y="20" width="20" height="20" rx="4" fill="url(#qrGrad)" />

            <rect x="110" y="10" width="40" height="40" rx="8" stroke="url(#qrGrad)" strokeWidth="6" />
            <rect x="120" y="20" width="20" height="20" rx="4" fill="url(#qrGrad)" />

            <rect x="10" y="110" width="40" height="40" rx="8" stroke="url(#qrGrad)" strokeWidth="6" />
            <rect x="20" y="120" width="20" height="20" rx="4" fill="url(#qrGrad)" />

            {/* Data Modules */}
            <rect x="60" y="14" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="74" y="14" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="88" y="14" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="60" y="28" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="88" y="28" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="74" y="42" width="8" height="8" rx="2" fill="url(#qrGrad)" />

            <rect x="14" y="60" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="28" y="60" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="42" y="60" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="60" y="60" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="88" y="60" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="102" y="60" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="130" y="60" width="8" height="8" rx="2" fill="url(#qrGrad)" />

            <rect x="14" y="74" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="42" y="74" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="102" y="74" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="116" y="74" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="138" y="74" width="8" height="8" rx="2" fill="url(#qrGrad)" />

            <rect x="14" y="88" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="28" y="88" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="42" y="88" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="60" y="88" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="88" y="88" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="116" y="88" width="8" height="8" rx="2" fill="url(#qrGrad)" />

            <rect x="60" y="110" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="74" y="110" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="88" y="110" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="102" y="110" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="130" y="110" width="8" height="8" rx="2" fill="url(#qrGrad)" />

            <rect x="60" y="124" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="88" y="124" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="116" y="124" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="138" y="124" width="8" height="8" rx="2" fill="url(#qrGrad)" />

            <rect x="74" y="138" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="102" y="138" width="8" height="8" rx="2" fill="url(#qrGrad)" />
            <rect x="130" y="138" width="8" height="8" rx="2" fill="url(#qrGrad)" />
          </svg>

          {/* Center Brand Badge */}
          <div className="absolute inset-0 m-auto w-11 h-11 rounded-xl bg-gradient-to-tr from-[#0070f3] to-[#00c8ff] text-white flex items-center justify-center font-extrabold text-xs shadow-md border-2 border-white">
            <span className="tracking-tighter">HEA</span>
          </div>
        </div>

        {/* Destination Target */}
        <div className="w-full mt-4 flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
          <span className="text-slate-500 font-medium">Scan target:</span>
          <span className="font-mono font-bold text-[#0070f3]">healink.store/@brand</span>
        </div>
      </div>
    </div>
  );
}

function BioVisual() {
  return (
    <div className="w-full max-w-xs mx-auto">
      {/* Smartphone Frame */}
      <div className="relative rounded-[36px] bg-slate-900 p-3 shadow-[0_20px_50px_-10px_rgba(0,112,243,0.22)] border-[4px] border-slate-800">
        {/* Dynamic Island */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-20 flex items-center justify-end px-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
        </div>

        {/* Screen */}
        <div className="rounded-[28px] bg-gradient-to-b from-[#eef6ff] via-sky-50 to-[#eef6ff] p-4 pt-8 text-center space-y-3 overflow-hidden">
          {/* Avatar & Profile */}
          <div className="relative mx-auto w-13 h-13 rounded-full bg-gradient-to-tr from-[#0070f3] to-[#00d2ff] p-0.5 shadow-sm">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-lg">
              ✨
            </div>
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
              ✓
            </span>
          </div>

          <div>
            <h4 className="font-extrabold text-sm text-[#0b132b]">Alex Morgan</h4>
            <span className="text-[11px] font-mono text-[#0070f3] block">@alexcreatives</span>
            <p className="text-[10px] text-slate-500 mt-0.5">Creator • Designer • Building in public</p>
          </div>

          {/* Links list */}
          <div className="space-y-2 pt-0.5 text-xs">
            <div className="p-2.5 rounded-xl bg-white/95 backdrop-blur-md border border-white shadow-xs flex items-center justify-between font-semibold text-slate-700 hover:scale-[1.02] transition-transform">
              <span className="flex items-center gap-1.5">
                <span>🛍️</span> Summer Drop 2026
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                1.4k
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/95 backdrop-blur-md border border-white shadow-xs flex items-center justify-between font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <span>💬</span> Discord Community
              </span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                Join
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/95 backdrop-blur-md border border-white shadow-xs flex items-center justify-between font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <span>🎥</span> New YouTube Video
              </span>
              <span className="text-[10px] text-slate-400">Watch</span>
            </div>
          </div>

          {/* Social Icons Strip */}
          <div className="flex items-center justify-center gap-3 pt-1 text-slate-400 text-xs">
            <span className="w-6 h-6 rounded-full bg-white shadow-xs flex items-center justify-center text-slate-700 font-bold text-[10px]">𝕏</span>
            <span className="w-6 h-6 rounded-full bg-white shadow-xs flex items-center justify-center text-slate-700 font-bold text-[10px]">📷</span>
            <span className="w-6 h-6 rounded-full bg-white shadow-xs flex items-center justify-center text-slate-700 font-bold text-[10px]">🐙</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsVisual() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative rounded-2xl bg-white/90 backdrop-blur-xl border border-white p-5 sm:p-6 shadow-[0_12px_40px_-10px_rgba(0,112,243,0.14)] space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Real-Time Traffic</span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 148 active right now
              </span>
            </div>
          </div>
          <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            +34.8% ↑
          </span>
        </div>

        {/* SVG Area Line Chart */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
            <span>Hourly Clicks Stream</span>
            <span className="font-bold text-[#0070f3]">Peak: 1,840 clicks</span>
          </div>
          <div className="relative h-28 w-full rounded-xl bg-gradient-to-b from-blue-50/50 to-transparent p-2 border border-blue-50">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 80" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0070f3" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#00c8ff" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="20" x2="300" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
              <polygon
                points="0,65 30,55 60,60 90,40 120,45 150,25 180,30 210,15 240,20 270,8 300,12 300,80 0,80"
                fill="url(#chartFill)"
              />
              <polyline
                fill="none"
                stroke="#0070f3"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,65 30,55 60,60 90,40 120,45 150,25 180,30 210,15 240,20 270,8 300,12"
              />
              <circle cx="270" cy="8" r="4" fill="#0070f3" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Breakdown stats */}
        <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/60 space-y-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Top Channels</span>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-600 font-medium">Instagram</span>
              <span className="font-bold text-slate-800">48%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-600 font-medium">X / Twitter</span>
              <span className="font-bold text-slate-800">32%</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/60 space-y-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Top Geo</span>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-600 font-medium">🇺🇸 United States</span>
              <span className="font-bold text-slate-800">42%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-600 font-medium">🇬🇧 United Kingdom</span>
              <span className="font-bold text-slate-800">28%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
    visual: <ShortlinksVisual />,
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
    visual: <QrCodeVisual />,
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
    visual: <BioVisual />,
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
    visual: <AnalyticsVisual />,
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
