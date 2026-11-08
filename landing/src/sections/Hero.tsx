import { useState } from 'react';
import { motion } from 'framer-motion';
import { SplitText } from '../components/SplitText';
import { ShortenBox } from '../components/ShortenBox';
import { HudCards } from '../components/HudCard';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useAppStore } from '../lib/store';

export function Hero() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const isReduced = useReducedMotion();
  const webglAvailable = useAppStore((s) => s.webglAvailable);

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
      className="relative pt-2 sm:pt-3 lg:pt-4 pb-8 lg:pb-12 overflow-hidden"
    >
      {/* Background Soft Glow Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-blue-300/20 via-sky-300/25 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          {/* Left Column: Headline, Subtitle & Interactive Shorten Card */}
          <div className="lg:col-span-6 z-20 space-y-6 sm:space-y-8 pt-0 sm:pt-1">
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
                Create branded short links and scalable QR codes, then see exactly who clicks with
                real-time visitor intelligence.
              </motion.p>
            </div>

            {/* Interactive Working Shorten Card (3 Tabs: Short Link, QR Code, Bulk Shorten) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
            >
              <ShortenBox />
            </motion.div>
          </div>

          {/* Right Column: 3D Stage Frame (Filled by fixed MasterScene) & HUD Cards */}
          <div className="lg:col-span-6 relative w-full h-[440px] sm:h-[500px] lg:h-[560px] flex items-center justify-center">
            <div className="relative w-full h-full max-w-[560px]">
              {/* WebGL Off Fallback Image */}
              {!webglAvailable && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <picture>
                    <source srcSet="/images/hero-infinity-hd.webp" type="image/webp" />
                    <img
                      src="/images/hero-infinity-hd.png"
                      alt="HEA Link 3D Blue Infinity"
                      className="w-full max-w-[500px] h-auto object-contain select-none pointer-events-none drop-shadow-xl"
                      loading="eager"
                    />
                  </picture>
                </div>
              )}

              {/* Glassmorphic Parallax HUD Cards (Analytics +245%, QR Mini, Track Clicks) */}
              <HudCards mousePosition={mousePos} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
