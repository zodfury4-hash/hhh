import { BarChart3, TrendingUp, Users, Globe2, Eye } from 'lucide-react';
import { TiltCard } from '../components/TiltCard';
import { Counter } from '../components/Counter';

export function AnalyticsSection() {
  return (
    <section id="analytics" className="relative py-24 lg:py-32 overflow-hidden z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#0070f3] text-xs font-semibold uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5" />
            Live Visitor Telemetry
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight">
            Know exactly <span className="text-[#0070f3]">who clicks, when &amp; where</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Gain immediate insight into device breakdown, geographical locations, referrer channels,
            and peak traffic hours without violating visitor privacy.
          </p>
        </div>

        {/* Layered Glass Dashboard Container */}
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Top 3 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TiltCard className="p-6 shadow-glass">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                <span>TOTAL CLICKS</span>
                <Eye className="w-4 h-4 text-[#0070f3]" />
              </div>
              <div className="text-3xl font-extrabold text-[#0070f3] mb-1">
                <Counter target={14820} />
              </div>
              <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +28.4% this week
              </div>
            </TiltCard>

            <TiltCard className="p-6 shadow-glass">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                <span>UNIQUE VISITORS</span>
                <Users className="w-4 h-4 text-[#38bdf8]" />
              </div>
              <div className="text-3xl font-extrabold text-[#0b132b] mb-1">
                <Counter target={11405} />
              </div>
              <div className="text-xs text-slate-500 font-medium">92% verified human traffic</div>
            </TiltCard>

            <TiltCard className="p-6 shadow-glass">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                <span>QR SCANS</span>
                <Globe2 className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-extrabold text-purple-600 mb-1">
                <Counter target={3812} />
              </div>
              <div className="text-xs text-slate-500 font-medium">42 countries represented</div>
            </TiltCard>
          </div>

          {/* Main Visual Telemetry Panel with SVG Chart */}
          <TiltCard className="p-6 sm:p-8 shadow-glass space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-[#0b132b]">Hourly Click Velocity (Live)</h3>
                <p className="text-xs text-slate-500">Real-time aggregate data across all active links</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white/80 border border-slate-200 px-3 py-1.5 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Stream Active
              </div>
            </div>

            {/* Self-Drawing Waveform Chart */}
            <div className="h-44 sm:h-52 w-full pt-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150">
                <defs>
                  <linearGradient id="chartBlueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0070f3" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#0070f3" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#e2e8f0" strokeDasharray="3 3" />

                {/* Area Gradient */}
                <path
                  d="M0,130 C60,110 110,40 180,65 C240,85 300,15 370,35 C430,50 470,10 500,20 L500,150 L0,150 Z"
                  fill="url(#chartBlueGrad)"
                />

                {/* Main Stroke */}
                <path
                  d="M0,130 C60,110 110,40 180,65 C240,85 300,15 370,35 C430,50 470,10 500,20"
                  fill="none"
                  stroke="#0070f3"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Peak Nodes */}
                <circle cx="180" cy="65" r="4.5" fill="#ffffff" stroke="#0070f3" strokeWidth="3" />
                <circle cx="370" cy="35" r="4.5" fill="#ffffff" stroke="#0070f3" strokeWidth="3" />
                <circle cx="500" cy="20" r="4.5" fill="#ffffff" stroke="#0070f3" strokeWidth="3" />
              </svg>
            </div>

            {/* Channels Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200/60 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1 text-slate-700">
                  <span>Direct / SMS / QR</span>
                  <span className="text-[#0070f3] font-bold">48%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#0070f3] rounded-full w-[48%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-semibold mb-1 text-slate-700">
                  <span>Instagram &amp; Bio</span>
                  <span className="text-purple-600 font-bold">32%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full w-[32%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-semibold mb-1 text-slate-700">
                  <span>WhatsApp &amp; Telegram</span>
                  <span className="text-emerald-600 font-bold">20%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full w-[20%]" />
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </div>
    </section>
  );
}
