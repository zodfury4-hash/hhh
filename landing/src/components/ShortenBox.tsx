import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, QrCode, Layers, ArrowRight, Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { shortenUrl, ShortenResult } from '../lib/api';
import { MagneticButton } from './MagneticButton';
import { useReducedMotion } from '../hooks/useReducedMotion';

type TabType = 'link' | 'qr' | 'bulk';

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'link', label: 'Short link & URL', icon: <Link2 className="w-4 h-4" /> },
  { id: 'qr', label: 'QR code', icon: <QrCode className="w-4 h-4" /> },
  { id: 'bulk', label: 'Bulk shorten', icon: <Layers className="w-4 h-4" /> },
];

export function ShortenBox() {
  const [activeTab, setActiveTab] = useState<TabType>('link');
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showQrPreview, setShowQrPreview] = useState(false);
  const isReduced = useReducedMotion();

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    setResult(null);

    try {
      const res = await shortenUrl(urlInput);
      if (res.success) {
        setResult(res);
        if (!isReduced) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.65 },
            colors: ['#0070f3', '#00c8ff', '#38bdf8', '#10b981'],
          });
        }
      } else {
        setErrorMessage(res.error || 'Failed to shorten link');
      }
    } catch {
      setErrorMessage('Network error occurred. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.shortUrl) return;
    navigator.clipboard.writeText(result.shortUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-[560px] glass-panel rounded-3xl p-4 sm:p-6 shadow-glass relative z-20">
      {/* Sliding Pill Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-blue-950/5 rounded-2xl mb-4 sm:mb-6 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setErrorMessage('');
              }}
              className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                isActive ? 'text-[#0070f3]' : 'text-slate-600 hover:text-slate-900'
              }`}
              type="button"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm border border-blue-500/20"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.icon}</span>
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panes */}
      <AnimatePresence mode="wait">
        {activeTab === 'link' && (
          <motion.div
            key="link-pane"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={handleShorten} className="space-y-3">
              <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-white/90 rounded-2xl border border-blue-500/20 focus-within:border-[#0070f3] focus-within:ring-4 focus-within:ring-[#0070f3]/15 transition-all shadow-inner">
                <div className="flex items-center flex-1 px-3 py-2">
                  <Link2 className="w-5 h-5 text-[#0070f3] mr-2.5 shrink-0" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Enter destination link (e.g. https://...)"
                    required
                    className="w-full bg-transparent text-sm sm:text-base text-[#0b132b] placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <MagneticButton
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-3 sm:py-2.5 bg-[#0070f3] hover:bg-[#0060d4] text-white rounded-xl text-sm font-semibold shadow-btn-glow disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Shortening...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Shorten link
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </MagneticButton>
              </div>

              {errorMessage && (
                <p className="text-xs sm:text-sm text-red-500 font-medium px-2">{errorMessage}</p>
              )}
            </form>
          </motion.div>
        )}

        {activeTab === 'qr' && (
          <motion.div
            key="qr-pane"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <form onSubmit={handleShorten} className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-white/90 rounded-2xl border border-blue-500/20 focus-within:border-[#0070f3] focus-within:ring-4 focus-within:ring-[#0070f3]/15 transition-all shadow-inner">
                <div className="flex items-center flex-1 px-3 py-2">
                  <QrCode className="w-5 h-5 text-[#0070f3] mr-2.5 shrink-0" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Enter link to generate custom QR..."
                    required
                    className="w-full bg-transparent text-sm sm:text-base text-[#0b132b] placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <MagneticButton
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-3 sm:py-2.5 bg-[#0070f3] hover:bg-[#0060d4] text-white rounded-xl text-sm font-semibold shadow-btn-glow shrink-0"
                >
                  Generate QR
                </MagneticButton>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === 'bulk' && (
          <motion.div
            key="bulk-pane"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="p-4 bg-white/80 rounded-2xl border border-blue-500/20 text-center"
          >
            <p className="text-sm text-slate-600 mb-3">
              Need to shorten dozens or hundreds of URLs at once with CSV import and campaign tags?
            </p>
            <a
              href="#login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0070f3] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-btn-glow hover:bg-[#0060d4] transition-colors"
            >
              Sign up for Bulk Shortener
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shortened Result Card */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: 10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden mt-4"
          >
            <div className="bg-white rounded-2xl border-1.5 border-[#0070f3] p-4 sm:p-5 shadow-lg shadow-blue-500/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0070f3]">
                  Your Shortened Link:
                </span>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Ready to share
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <a
                  href={result.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base sm:text-lg font-bold text-[#0070f3] hover:underline flex items-center gap-1.5 break-all"
                >
                  {result.shortUrl}
                  <ExternalLink className="w-4 h-4 shrink-0 text-slate-400" />
                </a>

                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                  <button
                    onClick={handleCopy}
                    type="button"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#0070f3] hover:bg-[#0060d4] text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowQrPreview(!showQrPreview)}
                    type="button"
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    QR
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-500 truncate" title={result.dest}>
                <span>Destination: </span>
                <span className="font-medium text-slate-700">{result.dest}</span>
              </div>

              {/* QR Preview Expansion */}
              {showQrPreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4"
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                      result.shortUrl
                    )}`}
                    alt="Short URL QR Code"
                    className="w-20 h-20 rounded-lg border border-slate-200 shadow-sm"
                  />
                  <div>
                    <div className="text-xs font-bold text-[#0b132b] mb-1">Scannable QR Code</div>
                    <div className="text-xs text-slate-500 mb-2">Points directly to your short link.</div>
                    <a
                      href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
                        result.shortUrl
                      )}`}
                      download={`hea-qr-${result.slug}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#0070f3] font-semibold hover:underline"
                    >
                      Download High-Res PNG →
                    </a>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
