import { lazy, Suspense, useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './sections/Hero';
import { HeroBadges } from './sections/HeroBadges';
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
const SkipperCarousel = lazy(() =>
  import('./sections/SkipperCarousel').then((m) => ({ default: m.SkipperCarousel }))
);
const ShortLinksSection = lazy(() =>
  import('./sections/ShortLinks').then((m) => ({ default: m.ShortLinksSection }))
);
const QrCodesSection = lazy(() =>
  import('./sections/QrCodes').then((m) => ({ default: m.QrCodesSection }))
);
const BioPagesSection = lazy(() =>
  import('./sections/BioPages').then((m) => ({ default: m.BioPagesSection }))
);
const AnalyticsSection = lazy(() =>
  import('./sections/Analytics').then((m) => ({ default: m.AnalyticsSection }))
);
const CoreFeatures = lazy(() =>
  import('./sections/CoreFeatures').then((m) => ({ default: m.CoreFeatures }))
);
const AiAdvanced = lazy(() =>
  import('./sections/AiAdvanced').then((m) => ({ default: m.AiAdvanced }))
);
const StepsSection = lazy(() =>
  import('./sections/Steps').then((m) => ({ default: m.StepsSection }))
);
const FeaturesSection = lazy(() =>
  import('./sections/Features').then((m) => ({ default: m.FeaturesSection }))
);
const PricingSection = lazy(() =>
  import('./sections/Pricing').then((m) => ({ default: m.PricingSection }))
);
const FaqSection = lazy(() =>
  import('./sections/Faq').then((m) => ({ default: m.FaqSection }))
);
const FinalCtaSection = lazy(() =>
  import('./sections/FinalCta').then((m) => ({ default: m.FinalCtaSection }))
);

export function App() {
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

  // Smoothly fade out and remove instant HTML splash screen once React boots
  useEffect(() => {
    const splash = document.getElementById('app-splash');
    if (splash) {
      splash.style.opacity = '0';
      splash.style.pointerEvents = 'none';
      const removeTimer = window.setTimeout(() => {
        splash.remove();
      }, 500);
      return () => window.clearTimeout(removeTimer);
    }
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
      <CustomCursor />

      {/* Deferred 3D Canvas Behind HTML */}
      {sceneReady && (
        <Suspense fallback={null}>
          <MasterScene mousePosition={mousePos} />
        </Suspense>
      )}

      {/* Sticky Glass Navbar with Full Mega Menus */}
      <Navbar
        onOpenAuth={(mode) => {
          if (getVerifiedSession()) {
            window.location.href = '/app.html#dashboard';
            return;
          }
          setAuthModal({ isOpen: true, mode });
        }}
      />

      {/* Complete Rich Landing UI */}
      <main id="main-content" className="relative z-10">
        <Hero />
        <HeroBadges />
        <Suspense fallback={null}>
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
        </Suspense>
      </main>

      <Footer />

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
