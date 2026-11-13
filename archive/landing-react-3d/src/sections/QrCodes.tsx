import { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Download, Sparkles, Sliders, Check } from 'lucide-react';
import { TiltCard } from '../components/TiltCard';

const PRESET_COLORS = [
  { name: 'Classic Navy', fg: '#0b132b', bg: '#ffffff' },
  { name: 'HEA Electric', fg: '#0070f3', bg: '#ffffff' },
  { name: 'Cyan Glow', fg: '#00c8ff', bg: '#0b132b' },
  { name: 'Emerald', fg: '#059669', bg: '#f0fdf4' },
];

export function QrCodesSection() {
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[1]);
  const [qrContent, setQrContent] = useState('https://healink.store');
  const [isDownloaded, setIsDownloaded] = useState(false);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    qrContent
  )}&color=${selectedColor.fg.replace('#', '')}&bgcolor=${selectedColor.bg.replace('#', '')}`;

  const handleDownload = () => {
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2000);
  };

  return (
    <section id="qrcodes" className="relative py-24 lg:py-32 overflow-hidden z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Copy & Live Controls */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#0070f3] text-xs font-semibold uppercase tracking-wider">
              <QrCode className="w-3.5 h-3.5" />
              Dynamic 3D QR Matrix
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight">
              Customizable QR codes that <span className="text-[#0070f3]">command attention</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Design high-resolution vector QR codes for packaging, menus, billboards, and conferences.
              Change the destination URL at any time without reprinting.
            </p>

            {/* Interactive Color Swatch Bar */}
            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#0070f3]" />
                Select Brand Color Palette:
              </div>
              <div className="flex items-center gap-3">
                {PRESET_COLORS.map((col, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedColor.name === col.name
                        ? 'border-[#0070f3] bg-blue-50/80 shadow-sm'
                        : 'border-slate-200 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: col.fg }}
                    />
                    <span className="text-slate-800">{col.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Checkpoints */}
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-700 font-medium pt-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0070f3]" />
                Never-expiring dynamic links
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0070f3]" />
                SVG, EPS &amp; PNG exports
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0070f3]" />
                Device &amp; City scan tracking
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0070f3]" />
                Custom logo embedding
              </div>
            </div>
          </div>

          {/* Right Column: Live QR Preview Card */}
          <div className="lg:col-span-6 flex justify-center">
            <TiltCard className="p-8 sm:p-10 max-w-[420px] w-full text-center space-y-6 shadow-glass">
              <div className="relative inline-block p-4 rounded-2xl bg-white border border-slate-200/80 shadow-lg">
                <img
                  src={qrImageUrl}
                  alt="Interactive HEA QR Code"
                  className="w-56 h-56 rounded-lg object-contain mx-auto"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white shadow-md border border-slate-200 flex items-center justify-center">
                  <span className="text-xs font-black text-[#0070f3]">HEA</span>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={qrContent}
                  onChange={(e) => setQrContent(e.target.value)}
                  placeholder="Target URL..."
                  className="w-full text-center px-4 py-2.5 text-xs sm:text-sm font-mono text-slate-700 bg-slate-100/80 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0070f3]"
                />
                <a
                  href={qrImageUrl}
                  download="hea-link-custom-qr.png"
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#0070f3] hover:bg-[#0060d4] text-white text-sm font-semibold rounded-xl shadow-btn-glow transition-all"
                >
                  {isDownloaded ? (
                    <>
                      <Check className="w-4 h-4" /> Downloaded High-Res PNG
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> Export High-Res QR Code
                    </>
                  )}
                </a>
              </div>
            </TiltCard>
          </div>
        </div>
      </div>
    </section>
  );
}
