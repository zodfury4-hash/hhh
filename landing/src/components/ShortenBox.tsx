import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, QrCode, Layers, ArrowRight, Check, Copy, ExternalLink, Loader2, Download } from 'lucide-react';
import confetti from 'canvas-confetti';
import { shortenUrl, ShortenResult } from '../lib/api';
import { MagneticButton } from './MagneticButton';
import { useReducedMotion } from '../hooks/useReducedMotion';

type TabType = 'link' | 'qr' | 'bulk';

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'link', label: '🔗 Short link & URL', icon: <Link2 className="w-4 h-4" /> },
  { id: 'qr', label: '▦ QR code', icon: <QrCode className="w-4 h-4" /> },
  { id: 'bulk', label: '⚡ Bulk shorten', icon: <Layers className="w-4 h-4" /> },
];

const QR_COLOR_CHIPS = [
  { name: 'Neon Cyan', color: '#00d2ff', bg: '#ffffff' },
  { name: 'Hot Pink', color: '#ff007f', bg: '#ffffff' },
  { name: 'Electric Blue', color: '#0070f3', bg: '#ffffff' },
  { name: 'Midnight Navy', color: '#0e1a33', bg: '#ffffff' },
];

const SAMPLE_BULK_URLS = [
  'https://brand.com/products/summer-drop',
  'https://instagram.com/mybrand',
  'https://youtube.com/@creativehub',
].join('\n');

export function ShortenBox() {
  const [activeTab, setActiveTab] = useState<TabType>('link');
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showQrPreview, setShowQrPreview] = useState(false);
  const isReduced = useReducedMotion();

  // Tab 2 (QR Studio) State
  const [qrInput, setQrInput] = useState('https://healink.store');
  const [selectedChip, setSelectedChip] = useState(QR_COLOR_CHIPS[2]);
  const [qrCopied, setQrCopied] = useState(false);

  // Tab 3 (Bulk Shorten) State
  const [bulkText, setBulkText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ original: string; short: string }[]>([]);

  // Count detected lines in bulk textarea
  const bulkLines = bulkText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

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

  const handleQrCopy = () => {
    navigator.clipboard.writeText(qrInput);
    setQrCopied(true);
    setTimeout(() => setQrCopied(false), 2000);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkLines.length === 0) return;

    setBulkLoading(true);
    const results: { original: string; short: string }[] = [];

    for (const line of bulkLines.slice(0, 15)) {
      try {
        const res = await shortenUrl(line);
        if (res.success) {
          results.push({ original: line, short: res.shortUrl });
        }
      } catch {
        // ignore individual fails
      }
    }

    setBulkResults(results);
    setBulkLoading(false);

    if (!isReduced) {
      confetti({
        particleCount: 45,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    qrInput || 'https://healink.store'
  )}&color=${selectedChip.color.replace('#', '')}&bgcolor=${selectedChip.bg.replace('#', '')}`;

  return (
    <div
      id="heroShortenCard"
      className="w-full max-w-[560px] glass-panel rounded-3xl p-4 sm:p-6 shadow-glass relative z-20"
    >
      {/* 1. Sliding Pill Tabs */}
      <div
        id="heroTabs"
        className="flex items-center gap-1.5 p-1 bg-blue-950/5 rounded-2xl mb-4 sm:mb-6 overflow-x-auto no-scrollbar"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab${tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}`}
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
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Tab Panes */}
      <AnimatePresence mode="wait">
        {/* PANE 1: Short Link (Default Sleek Capsule) */}
        {activeTab === 'link' && (
          <motion.div
            key="link-pane"
            id="paneShortLink"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <form id="heroForm" onSubmit={handleShorten} className="space-y-3">
              <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-white/90 rounded-2xl border border-blue-500/20 focus-within:border-[#0070f3] focus-within:ring-4 focus-within:ring-[#0070f3]/15 transition-all shadow-inner">
                <div className="flex items-center flex-1 px-3 py-2 min-w-0">
                  <Link2 className="w-5 h-5 text-[#0070f3] mr-2.5 shrink-0" />
                  <input
                    id="heroUrl"
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Paste your link here..."
                    required
                    className="w-full bg-transparent text-sm sm:text-base text-[#0b132b] placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <MagneticButton
                  id="heroBtn"
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
                      Shorten link →
                    </span>
                  )}
                </MagneticButton>
              </div>

              {errorMessage && (
                <p id="heroErr" className="text-xs sm:text-sm text-red-500 font-medium px-2">
                  {errorMessage}
                </p>
              )}
            </form>
          </motion.div>
        )}

        {/* PANE 2: Vector QR Code Studio (Color Chips, Canvas & Download) */}
        {activeTab === 'qr' && (
          <motion.div
            key="qr-pane"
            id="paneQrCode"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-white/90 rounded-2xl border border-blue-500/20 focus-within:border-[#0070f3] focus-within:ring-4 focus-within:ring-[#0070f3]/15 transition-all shadow-inner">
              <div className="flex items-center flex-1 px-3 py-2">
                <QrCode className="w-5 h-5 text-[#0070f3] mr-2.5 shrink-0" />
                <input
                  id="heroQrInput"
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="Enter URL, Wi-Fi credentials, or text for vector QR..."
                  className="w-full bg-transparent text-sm sm:text-base text-[#0b132b] placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* QR Adjustment Row with Color Chips and Live Preview */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/80 rounded-2xl border border-blue-500/20">
              {/* Color Chips */}
              <div className="space-y-1.5 text-left w-full sm:w-auto">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Code Color:
                </span>
                <div id="heroQrColorChips" className="flex items-center gap-2">
                  {QR_COLOR_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedChip(chip)}
                      title={chip.name}
                      style={{ backgroundColor: chip.color }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        selectedChip.name === chip.name
                          ? 'scale-110 border-blue-600 shadow-md'
                          : 'border-white opacity-85 hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* QR Preview Card */}
              <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm w-full sm:w-auto">
                <img
                  src={qrImageUrl}
                  alt="Dynamic Vector QR"
                  className="w-16 h-16 rounded-lg object-contain border border-slate-100"
                />
                <div className="space-y-1.5 text-left">
                  <div className="text-[11px] font-bold text-[#0070f3]">✨ Dynamic Vector QR</div>
                  <div className="flex items-center gap-2">
                    <a
                      id="heroQrDlBtn"
                      href={qrImageUrl}
                      download="hea-vector-qr.png"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#0070f3] hover:bg-[#0060d4] text-white text-[11px] font-bold rounded-lg shadow-sm"
                    >
                      <Download className="w-3 h-3" /> Download PNG
                    </a>
                    <button
                      id="heroQrCopyBtn"
                      type="button"
                      onClick={handleQrCopy}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg"
                    >
                      {qrCopied ? 'Copied! ✓' : 'Copy 📋'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* PANE 3: Bulk Shorten Studio (Textarea, Counter Tag & Sample Loader) */}
        {activeTab === 'bulk' && (
          <motion.div
            key="bulk-pane"
            id="paneBulkShorten"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <form onSubmit={handleBulkSubmit} className="space-y-3">
              <div className="relative p-2 bg-white/90 rounded-2xl border border-blue-500/20 shadow-inner">
                <textarea
                  id="heroBulkTextarea"
                  rows={4}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Paste multiple URLs (one per line, up to 20 links):&#10;https://mybrand.com/products&#10;https://instagram.com/mybrand&#10;https://youtube.com/@creativehub"
                  className="w-full bg-transparent text-xs sm:text-sm font-mono text-[#0b132b] placeholder-slate-400 focus:outline-none resize-none p-2"
                />

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span id="bulkLinkCounter" className="font-semibold text-slate-500">
                    ⚡ {bulkLines.length} links detected
                  </span>
                  <button
                    id="bulkFillSampleBtn"
                    type="button"
                    onClick={() => setBulkText(SAMPLE_BULK_URLS)}
                    className="text-[#0070f3] hover:underline font-semibold"
                  >
                    + Load sample URLs
                  </button>
                </div>
              </div>

              <button
                id="heroBulkSubmitBtn"
                type="submit"
                disabled={bulkLoading || bulkLines.length === 0}
                className="w-full py-3 bg-[#0070f3] hover:bg-[#0060d4] text-white text-sm font-bold rounded-xl shadow-btn-glow disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {bulkLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Shortening Batch...
                  </>
                ) : (
                  <>Bulk shorten links →</>
                )}
              </button>
            </form>

            {/* Bulk Results List */}
            {bulkResults.length > 0 && (
              <div className="mt-3 p-3 bg-white rounded-xl border border-blue-500/20 max-h-40 overflow-y-auto space-y-2 text-xs text-left">
                <div className="font-bold text-[#0070f3] uppercase tracking-wider text-[10px]">
                  Batch Results ({bulkResults.length} Created):
                </div>
                {bulkResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 rounded-lg">
                    <span className="font-mono text-[#0070f3] font-bold truncate">{r.short}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(r.short)}
                      className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded text-[10px] font-semibold hover:bg-slate-100"
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Shortened Single Link Result Card */}
      <AnimatePresence>
        {result && (
          <motion.div
            id="heroRes"
            initial={{ opacity: 0, height: 0, y: 10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: 10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden mt-4"
          >
            <div className="bg-white rounded-2xl border-1.5 border-[#0070f3] p-4 sm:p-5 shadow-lg shadow-blue-500/10 text-left">
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
                    id="rCopy"
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
                    id="rQr"
                    onClick={() => setShowQrPreview(!showQrPreview)}
                    type="button"
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    QR
                  </button>
                </div>
              </div>

              <div
                id="realShortContainer"
                className="text-xs text-slate-500 truncate"
                title={result.dest}
              >
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
