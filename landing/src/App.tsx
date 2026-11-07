import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { Hero } from './sections/Hero';
import { HeroBadges } from './sections/HeroBadges';
import { SkipperCarousel } from './sections/SkipperCarousel';
import { ShortLinksSection } from './sections/ShortLinks';
import { QrCodesSection } from './sections/QrCodes';
import { BioPagesSection } from './sections/BioPages';
import { AnalyticsSection } from './sections/Analytics';
import { CoreFeatures } from './sections/CoreFeatures';
import { AiAdvanced } from './sections/AiAdvanced';
import { StepsSection } from './sections/Steps';
import { FeaturesSection } from './sections/Features';
import { PricingSection } from './sections/Pricing';
import { FaqSection } from './sections/Faq';
import { FinalCtaSection } from './sections/FinalCta';
import { Footer } from './components/Footer';
import { MasterScene } from './canvas/Scene';
import { CustomCursor } from './components/CustomCursor';
import { AuthModal } from './components/AuthModal';
import { useLenis } from './hooks/useLenis';
import { useReducedMotion } from './hooks/useReducedMotion';

export function App() {
  const [loading, setLoading] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'signup' }>({
    isOpen: false,
    mode: 'login',
  });
  const isReduced = useReducedMotion();

  // Initialize smooth momentum scrolling via Lenis & GSAP ScrollTrigger
  useLenis();

  useEffect(() => {
    // Fast brand preloader (<= 0.8s)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 750);
    return () => clearTimeout(timer);
  }, []);

  // Listen to hash changes for #login and #signup to pop up auth modal
  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash.toLowerCase();
      if (h === '#login') {
        setAuthModal({ isOpen: true, mode: 'login' });
      } else if (h === '#signup') {
        setAuthModal({ isOpen: true, mode: 'signup' });
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    if (isReduced) return;
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [isReduced]);

  return (
    <div className="relative min-h-screen selection:bg-[#0070f3] selection:text-white overflow-x-hidden">
      {/* 1. Desktop Custom Follow Cursor */}
      <CustomCursor />

      {/* 2. Fast Fluid Preloader */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] bg-[#eef6ff] flex flex-col items-center justify-center gap-4"
          >
            <div className="relative w-16 h-12 flex items-center justify-center">
              <svg
                className="w-16 h-12 text-[#0070f3] animate-pulse"
                viewBox="0 0 54 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.5 8C10.25 8 6 12.25 6 17.5C6 22.75 10.25 27 15.5 27C21.2 27 24.6 20.8 27 17.5C29.4 14.2 32.8 8 38.5 8C43.75 8 48 12.25 48 17.5C48 22.75 43.75 27 38.5 27C32.8 27 29.4 20.8 27 17.5C24.6 14.2 21.2 8 15.5 8Z"
                  stroke="#0070f3"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-xs font-bold tracking-widest text-[#0070f3] uppercase animate-pulse">
              HEA Link
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Persistent Fixed 3D Canvas Behind HTML (Hero -> Scrollytelling transitions) */}
      <MasterScene mousePosition={mousePos} />

      {/* 4. Sticky Glass Navbar with Full Mega Menus */}
      <Navbar onOpenAuth={(mode) => setAuthModal({ isOpen: true, mode })} />

      {/* 5. Complete Rich Landing UI */}
      <main className="relative z-10">
        {/* 5.1 Hero: Title, Tabbed ShortenBox (Short Link, QR, Bulk), HUD Cards, 3D Loop */}
        <Hero />

        {/* 5.2 4 Hero Feature Badges: Instant & Reliable, Powerful Analytics, Branded Experience, Global Reach */}
        <HeroBadges />

        {/* 5.3 Interactive Skipper Feature Showcase Carousel (4 interactive slides + stats + mockups) */}
        <SkipperCarousel />

        {/* 5.4 3D Scrollytelling: Short Links URL Collapse */}
        <ShortLinksSection />

        {/* 5.5 3D Scrollytelling: QR Codes 21x21 Particle Matrix */}
        <QrCodesSection />

        {/* 5.6 3D Scrollytelling: Bio Pages 3D Smartphone Link Hub */}
        <BioPagesSection />

        {/* 5.7 3D Scrollytelling: Analytics 3D Globe & Live Stream Telemetry */}
        <AnalyticsSection />

        {/* 5.8 Everything You Need: 4 Core Platform Features */}
        <CoreFeatures />

        {/* 5.9 Only On HEA Link: AI Slug Suggester + 6 Advanced Control Cards */}
        <AiAdvanced />

        {/* 5.10 How It Works: 3 Easy Steps */}
        <StepsSection />

        {/* 5.11 Enterprise Scalability Features */}
        <FeaturesSection />

        {/* 5.12 Simple, Transparent Pricing: Free (Rs 0), Pro (Rs 1,499), Enterprise (Custom) */}
        <PricingSection />

        {/* 5.13 Frequently Asked Questions Accordion */}
        <FaqSection />

        {/* 5.14 Final Bottom CTA ("Ready to share smarter links?" -> #signup) */}
        <FinalCtaSection />
      </main>

      {/* 6. Comprehensive Glass Footer */}
      <Footer />

      {/* 7. Interactive Login & Sign Up Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        onClose={() => {
          setAuthModal((prev) => ({ ...prev, isOpen: false }));
          if (window.location.hash === '#login' || window.location.hash === '#signup') {
            history.replaceState(null, '', window.location.pathname);
          }
        }}
      />
    </div>
  );
}

export default App;
