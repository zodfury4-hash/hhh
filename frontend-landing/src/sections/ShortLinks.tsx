import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, ShieldAlert, Sparkles, Copy, Check } from 'lucide-react';
import { TiltCard } from '../components/TiltCard';

export function ShortLinksSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('https://hea.link/launch-2026');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="shortlinks" className="relative py-24 lg:py-32 overflow-hidden z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#0070f3] text-xs font-semibold uppercase tracking-wider">
            <Link2 className="w-3.5 h-3.5" />
            URL Shortener Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight">
            Collapse ugly URLs into <span className="text-[#0070f3]">memorable links</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Eliminate 200-character tracking links. Deliver clean, trustworthy branded URLs with custom
            back-halves and auto-generated UTM parameters.
          </p>
        </div>

        {/* Visual Collapse Interactive Demo */}
        <div className="max-w-3xl mx-auto space-y-6">
          <TiltCard className="p-6 sm:p-8 space-y-6 shadow-glass">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Before: Messy Unbranded Link</span>
                <span className="text-red-500 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> 164 Characters
                </span>
              </div>
              <div className="p-3.5 bg-slate-100/90 rounded-xl text-xs sm:text-sm font-mono text-slate-500 break-all border border-slate-200">
                https://marketing-analytics.store/campaigns/q4-summer-promo-2026/products?utm_source=facebook&utm_medium=cpc&utm_campaign=flash_sale_tier_vip&affiliate_token=9a8b7c6d5e
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#0070f3] font-bold">
                ↓
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#0070f3] uppercase tracking-wider">
                <span>After: HEA Branded Short Link</span>
                <span className="text-emerald-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> 23 Characters
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 p-4 bg-white rounded-xl border-1.5 border-[#0070f3] shadow-md shadow-blue-500/10">
                <span className="text-base sm:text-lg font-bold text-[#0070f3] font-mono">
                  https://hea.link/launch-2026
                </span>
                <button
                  onClick={handleCopy}
                  type="button"
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0070f3] hover:bg-[#0060d4] text-white text-xs font-semibold rounded-lg shadow-sm transition-all shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </TiltCard>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div
              whileHover={{ y: -3 }}
              className="glass-panel p-4 rounded-xl text-center shadow-sm"
            >
              <div className="text-2xl font-extrabold text-[#0070f3]">34%</div>
              <div className="text-xs font-semibold text-slate-600">Higher Click-Through Rate</div>
            </motion.div>
            <motion.div
              whileHover={{ y: -3 }}
              className="glass-panel p-4 rounded-xl text-center shadow-sm"
            >
              <div className="text-2xl font-extrabold text-[#38bdf8]">0.08s</div>
              <div className="text-xs font-semibold text-slate-600">Global Edge Redirection</div>
            </motion.div>
            <motion.div
              whileHover={{ y: -3 }}
              className="glass-panel p-4 rounded-xl text-center shadow-sm"
            >
              <div className="text-2xl font-extrabold text-emerald-600">100%</div>
              <div className="text-xs font-semibold text-slate-600">SSL &amp; Phishing Shield</div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
