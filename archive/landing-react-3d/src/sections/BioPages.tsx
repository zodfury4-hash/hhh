import { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Instagram, Youtube, ShoppingBag, Music2, ArrowUpRight, Palette } from 'lucide-react';
import { TiltCard } from '../components/TiltCard';

const THEMES = [
  { id: 'ocean', name: 'Ocean Cyan', bg: 'from-blue-600 to-sky-400', buttonBg: 'bg-white/20 hover:bg-white/30 text-white' },
  { id: 'dark', name: 'Dark Neon', bg: 'from-slate-900 to-blue-950', buttonBg: 'bg-blue-500/20 hover:bg-blue-500/30 text-sky-300 border border-blue-400/30' },
  { id: 'sunset', name: 'Sunset Glow', bg: 'from-purple-600 to-pink-500', buttonBg: 'bg-white/20 hover:bg-white/30 text-white' },
];

export function BioPagesSection() {
  const [activeTheme, setActiveTheme] = useState(THEMES[0]);

  return (
    <section id="biopages" className="relative py-24 lg:py-32 overflow-hidden z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Interactive Phone Preview */}
          <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
            <TiltCard className="w-full max-w-[340px] p-4 rounded-[40px] bg-slate-900 border-4 border-slate-800 shadow-2xl">
              <div
                className={`w-full rounded-[32px] p-6 text-center text-white bg-gradient-to-b ${activeTheme.bg} transition-colors duration-500 space-y-5`}
              >
                {/* Avatar & Name */}
                <div className="space-y-2 pt-4">
                  <div className="w-20 h-20 rounded-full mx-auto p-1 bg-white/30 backdrop-blur-md">
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-sky-300 to-blue-600 flex items-center justify-center text-2xl font-bold">
                      🚀
                    </div>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg">Alex Vance</h3>
                    <p className="text-xs text-white/80">Digital Creator &amp; Founder</p>
                  </div>
                </div>

                {/* Social Bio Pills */}
                <div className="space-y-2.5 pt-2">
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href="#biopages"
                    className={`flex items-center justify-between px-4 py-3 rounded-xl backdrop-blur-md text-xs font-semibold shadow-sm transition-all ${activeTheme.buttonBg}`}
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" /> Summer Merch Drop
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </motion.a>

                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href="#biopages"
                    className={`flex items-center justify-between px-4 py-3 rounded-xl backdrop-blur-md text-xs font-semibold shadow-sm transition-all ${activeTheme.buttonBg}`}
                  >
                    <span className="flex items-center gap-2">
                      <Youtube className="w-4 h-4" /> Latest 4K Tech Breakdown
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </motion.a>

                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href="#biopages"
                    className={`flex items-center justify-between px-4 py-3 rounded-xl backdrop-blur-md text-xs font-semibold shadow-sm transition-all ${activeTheme.buttonBg}`}
                  >
                    <span className="flex items-center gap-2">
                      <Instagram className="w-4 h-4" /> Daily Stories &amp; Behind Scenes
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </motion.a>

                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href="#biopages"
                    className={`flex items-center justify-between px-4 py-3 rounded-xl backdrop-blur-md text-xs font-semibold shadow-sm transition-all ${activeTheme.buttonBg}`}
                  >
                    <span className="flex items-center gap-2">
                      <Music2 className="w-4 h-4" /> Podcast on Spotify
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </motion.a>
                </div>

                <div className="pt-2 text-[10px] text-white/60 font-semibold tracking-wider uppercase">
                  ⚡ Powered by hea.link
                </div>
              </div>
            </TiltCard>
          </div>

          {/* Right Column: Copy & Theme Switcher */}
          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#0070f3] text-xs font-semibold uppercase tracking-wider">
              <Smartphone className="w-3.5 h-3.5" />
              Creator Bio Links
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight">
              One link for all your <span className="text-[#0070f3]">socials &amp; content</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Consolidate your Instagram, TikTok, YouTube, and storefront links into a singular, lightning-fast
              mobile landing page that converts followers into customers.
            </p>

            {/* Theme Switcher Controls */}
            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-[#0070f3]" />
                Select Bio Theme:
              </div>
              <div className="flex items-center gap-3">
                {THEMES.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setActiveTheme(th)}
                    type="button"
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      activeTheme.id === th.id
                        ? 'border-[#0070f3] bg-blue-50/80 text-[#0070f3] shadow-sm'
                        : 'border-slate-200 bg-white/70 text-slate-700 hover:bg-white'
                    }`}
                  >
                    {th.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-6 text-sm text-slate-600">
              <div>
                <span className="text-xl font-bold text-[#0b132b] block">0.3s</span>
                <span>Mobile Load Speed</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <span className="text-xl font-bold text-[#0b132b] block">100%</span>
                <span>Custom Domains</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <span className="text-xl font-bold text-[#0b132b] block">0%</span>
                <span>Transaction Fees</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
