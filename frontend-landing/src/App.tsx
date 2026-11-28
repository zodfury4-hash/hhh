import { lazy, Suspense, useEffect, useState } from 'react';
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
import { CustomCursor } from './components/CustomCursor';
import { getVerifiedSession } from './lib/auth';
import { useLenis } from './hooks/useLenis';
import { useReducedMotion } from './hooks/useReducedMotion';

const MasterScene = lazy(() =>
  import('./canvas/Scene').then((m) => ({ default: m.MasterScene }))
);
const AuthModal = lazy(() =>
  import('./components/AuthModal').then((m) => ({ default: m.AuthModal }))
);

export function App() {
  const [loading, setLoading] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    mode: 'login' | 'signup' | 'forgot';
  }>({
    isOpen: false,
    mode: 'login',
  });
  const isReduced = useReducedMotion();

  useLenis();

  // Smoothly remove instant HTML splash screen once React boots
  useEffect(() => {
    const splash = document.getElementById('app-splash');
    if (splash) {
      splash.style.opacity = '0';
      splash.style.pointerEvents = 'none';
      const removeTimer = window.setTimeout(() => {
        splash.remove();
      }, 350);
      return () => window.clearTimeout(removeTimer);
    }
  }, []);

  // Fast original brand preloader (750ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 750);
    return () => clearTimeout(timer);
  }, []);

  // Defer WebGL Three.js scene mount until after first paint so LCP/FCP remain instant
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) setSceneReady(true);
    }, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  // Listen to hash changes for #login, #signup, #forgot
  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash.toLowerCase();
      if (h === '#login' || h === '#signup' || h === '#forgot' || h === '#forgot-password') {
        if (getVerifiedSession()) {
          window.location.replace('/app.html#dashboard');
          return;
        }
        if (h === '#login') {
          setAuthModal({ isOpen: true, mode: 'login' });
        } else if (h === '#signup') {
          setAuthModal({ isOpen: true, mode: 'signup' });
        } else {
          setAuthModal({ isOpen: true, mode: 'forgot' });
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Track cursor for 3D parallax
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

      {/* 2. Original Light-Blue Fluid Preloader */}
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

      {/* 3. Deferred 3D Canvas Behind HTML */}
      {sceneReady && (
        <Suspense fallback={null}>
          <MasterScene mousePosition={mousePos} />
        </Suspense>
      )}

      {/* 4. Sticky Glass Navbar with Full Mega Menus */}
      <Navbar
        onOpenAuth={(mode) => {
          if (getVerifiedSession()) {
            window.location.href = '/app.html#dashboard';
            return;
          }
          setAuthModal({ isOpen: true, mode });
        }}
      />

      {/* 5. Complete Rich Landing UI */}
      <main id="main-content" className="relative z-10">
        <Hero />
        <HeroBadges />
        <SkipperCarousel />
        <ShortLinksSection />
        <QrCodesSection />
        <BioPagesSection />
        <AnalyticsSection />
        <CoreFeatures />
        <AiAdvanced />
        <StepsSection />
        <FeaturesSection />
        <PricingSection />
        <FaqSection />
        <FinalCtaSection />
      </main>

      {/* 6. Comprehensive Glass Footer */}
      <Footer />

      {/* 7. Interactive Auth Modal */}
      {authModal.isOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={authModal.isOpen}
            initialMode={authModal.mode}
            onClose={() => {
              setAuthModal((prev) => ({ ...prev, isOpen: false }));
              if (
                window.location.hash === '#login' ||
                window.location.hash === '#signup' ||
                window.location.hash === '#forgot' ||
                window.location.hash === '#forgot-password'
              ) {
                history.replaceState(null, '', window.location.pathname);
              }
            }}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
