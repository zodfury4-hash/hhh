import { motion } from 'framer-motion';

export function HeroBadges() {
  return (
    <section className="relative py-8 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Badge 1: Instant & Reliable */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/75 backdrop-blur-md border border-white/80 shadow-glass hover:shadow-glass-hover hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="boltGradBadge" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#00d2ff" />
                    <stop offset="100%" stopColor="#0070f3" />
                  </linearGradient>
                </defs>
                <path
                  d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
                  fill="url(#boltGradBadge)"
                  stroke="#00d2ff"
                  strokeWidth="0.8"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <b className="block text-sm font-bold text-[#0b132b]">Instant &amp; Reliable</b>
              <span className="text-xs text-slate-500 font-medium">Shorten in milliseconds</span>
            </div>
          </div>

          {/* Badge 2: Powerful Analytics */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/75 backdrop-blur-md border border-white/80 shadow-glass hover:shadow-glass-hover hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="chartGradBadge1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0066ff" />
                  </linearGradient>
                  <linearGradient id="chartGradBadge2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0070f3" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <linearGradient id="chartGradBadge3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d2ff" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <rect x="3" y="13" width="4" height="8" rx="1.5" fill="url(#chartGradBadge1)" />
                <rect x="10" y="8" width="4" height="13" rx="1.5" fill="url(#chartGradBadge2)" />
                <rect x="17" y="4" width="4" height="17" rx="1.5" fill="url(#chartGradBadge3)" />
                <path d="M4 11L11 6L18 3" stroke="#0070f3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="18" cy="3" r="1.8" fill="#0070f3" />
              </svg>
            </div>
            <div>
              <b className="block text-sm font-bold text-[#0b132b]">Powerful Analytics</b>
              <span className="text-xs text-slate-500 font-medium">Track every click</span>
            </div>
          </div>

          {/* Badge 3: Branded Experience */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/75 backdrop-blur-md border border-white/80 shadow-glass hover:shadow-glass-hover hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="shieldGradBadge" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#00d2ff" />
                    <stop offset="50%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#0055ff" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 2L4 5V11C4 16.5 7.4 21.6 12 22.8C16.6 21.6 20 16.5 20 11V5L12 2Z"
                  fill="url(#shieldGradBadge)"
                  fillOpacity="0.25"
                  stroke="url(#shieldGradBadge)"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path d="M9 12L11 14L15 9.5" stroke="#0070f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <b className="block text-sm font-bold text-[#0b132b]">Branded Experience</b>
              <span className="text-xs text-slate-500 font-medium">Build trust with your brand</span>
            </div>
          </div>

          {/* Badge 4: Global Reach */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/75 backdrop-blur-md border border-white/80 shadow-glass hover:shadow-glass-hover hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="globeGradBadge" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#00d2ff" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <circle cx="12" cy="12" r="9.5" stroke="url(#globeGradBadge)" strokeWidth="1.6" />
                <ellipse cx="12" cy="12" rx="4.5" ry="9.5" stroke="url(#globeGradBadge)" strokeWidth="1.4" />
                <path d="M3 12H21" stroke="url(#globeGradBadge)" strokeWidth="1.4" />
                <path d="M4.5 7H19.5" stroke="url(#globeGradBadge)" strokeWidth="1.2" strokeDasharray="0.5 2.5" />
                <path d="M4.5 17H19.5" stroke="url(#globeGradBadge)" strokeWidth="1.2" strokeDasharray="0.5 2.5" />
              </svg>
            </div>
            <div>
              <b className="block text-sm font-bold text-[#0b132b]">Global Reach</b>
              <span className="text-xs text-slate-500 font-medium">Share anywhere</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
