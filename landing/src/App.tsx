import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { Hero } from './sections/Hero';

export function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Elegant fast preloader (<= 1.0s)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen relative selection:bg-[#0070f3] selection:text-white">
      {/* 1. Fast Preloader */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 bg-[#eef6ff] flex flex-col items-center justify-center gap-4"
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
            <div className="text-sm font-semibold tracking-wider text-[#0070f3] uppercase animate-pulse">
              HEA Link
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Glass Navbar */}
      <Navbar />

      {/* 3. Hero Section (3D Lemniscate Knot + Parallax HUD Cards + Working Shorten Box) */}
      <main>
        <Hero />

        {/* Step 1 Preview Indicator of Upcoming Scrollytelling Sections */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#0070f3] text-xs font-semibold uppercase tracking-wider mb-3">
            ✨ Step 1 Completed: 3D Lemniscate + Hero Rig
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] mb-4">
            Next: Pinned 3D Scrollytelling & Morph Rig
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            In Step 2, the GSAP ScrollTrigger + Lenis rig will seamlessly guide the 3D infinity object
            down into the centered URL collapse scene and the 21×21 QR particle assembly.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;
