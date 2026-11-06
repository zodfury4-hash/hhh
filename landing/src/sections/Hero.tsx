import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, BarChart2, Globe2 } from 'lucide-react';
import { SplitText } from '../components/SplitText';
import { ShortenBox } from '../components/ShortenBox';
import { HeroScene } from '../canvas/Scene';
import { HudCards } from '../components/HudCard';
import { useReducedMotion } from '../hooks/useReducedMotion';

const TRUST_BADGES = [
  { icon: <Zap className="w-4 h-4 text-[#0070f3]" />, label: '99.9% Uptime' },
  { icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />, label: 'GDPR & SOC2' },
  { icon: <BarChart2 className="w-4 h-4 text-[#38bdf8]" />, label: 'Live Telemetry' },
  { icon: <Globe2 className="w-4 h-4 text-purple-600" />, label: 'Custom Domains' },
];

export function Hero() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const isReduced = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReduced) return;
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = ((clientX - left) / width) * 2 - 1;
    const y = ((clientY - top) / height) * 2 - 1;
    setMousePos({ x, y });
  };

  return (
    <section
      id="home"
      onMouseMove={handleMouseMove}
      className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden"
    >
      {/* Background Soft Glow Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-blue-300/20 via-sky-300/25 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Subtitle, Shorten Form & Trust Badges */}
          <div className="lg:col-span-6 z-20 space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-[#0b132b] leading-[1.14] tracking-tight">
                <SplitText>Short links & URLs,</SplitText>
                <br />
                <SplitText delay={0.15}>QR codes & bio pages</SplitText>
                <br />
                <span className="text-shimmer inline-block font-extrabold">all in one place</span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="text-base sm:text-lg text-slate-600 max-w-xl font-normal leading-relaxed"
              >
                Create branded short links, customizable QR codes, and bio landing pages, then see
                exactly who clicks with real-time visitor intelligence.
              </motion.p>
            </div>

            {/* Interactive Working Shorten Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
            >
              <ShortenBox />
            </motion.div>

            {/* 4 Feature Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2"
            >
              {TRUST_BADGES.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/60 border border-white/70 shadow-sm"
                >
                  <span className="p-1 rounded-lg bg-blue-50/80 shrink-0">{b.icon}</span>
                  <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                    {b.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Column: 3D Cyber Stage with Lemniscate Knot & HUD Cards */}
          <div className="lg:col-span-6 relative w-full h-[440px] sm:h-[500px] lg:h-[560px] flex items-center justify-center">
            {/* The 3D Three.js Scene */}
            <div className="relative w-full h-full max-w-[560px]">
              <HeroScene mousePosition={mousePos} />
              {/* Glassmorphic Parallax HUD Cards */}
              <HudCards mousePosition={mousePos} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
