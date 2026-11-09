import { useState, useEffect } from 'react';
import { ChevronDown, ArrowRight, Menu, X, Link2, QrCode, Smartphone, BarChart3, Globe, Sparkles, Cpu, Bot, Shield, Tag, Users, HelpCircle, Layers } from 'lucide-react';
import { MagneticButton } from './MagneticButton';

interface NavbarProps {
  onOpenAuth?: (mode: 'login' | 'signup') => void;
}

export function Navbar({ onOpenAuth }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeSolTab, setActiveSolTab] = useState<'industry' | 'team' | 'business'>('industry');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-[0_4px_24px_rgba(0,112,243,0.06)] py-2.5'
          : 'bg-white/90 backdrop-blur-sm border-b border-slate-100 py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo matching media_1793954313394_7bcdc1e9.png */}
        <a href="#home" className="flex items-center gap-2 group shrink-0">
          <svg
            className="w-8 h-6 text-[#0070f3] group-hover:scale-105 transition-transform"
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
          <div className="font-extrabold text-[22px] tracking-tight text-[#0070f3] flex items-center gap-1">
            <span>HEA</span> <span>Link</span>
          </div>
        </a>

        {/* Desktop Navigation Links with Mega Dropdowns */}
        <nav
          className="hidden lg:flex items-center gap-6"
          onMouseLeave={() => setActiveDropdown(null)}
        >
          {/* 1. Platform Mega Menu */}
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setActiveDropdown('platform')}
              onClick={() => setActiveDropdown(activeDropdown === 'platform' ? null : 'platform')}
              className={`flex items-center gap-1 py-1.5 text-[15px] font-medium transition-colors ${
                activeDropdown === 'platform' ? 'text-[#0070f3]' : 'text-slate-600 hover:text-[#0070f3]'
              }`}
            >
              <span>Platform</span>
              <span className="text-xs opacity-60 ml-0.5">▾</span>
            </button>

            {activeDropdown === 'platform' && (
              <div className="absolute top-full left-0 mt-2 w-[540px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 shadow-2xl border border-white/80 grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Products</div>
                  <div className="space-y-3">
                    <a href="#shortlinks" className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/80 transition-colors group">
                      <div className="p-2 rounded-lg bg-blue-50 text-[#0070f3] shrink-0 group-hover:bg-[#0070f3] group-hover:text-white transition-colors">
                        <Link2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0b132b]">URL Shortener</div>
                        <div className="text-[11px] text-slate-500">Customize, share and track links</div>
                      </div>
                    </a>

                    <a href="#qrcodes" className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/80 transition-colors group">
                      <div className="p-2 rounded-lg bg-blue-50 text-[#0070f3] shrink-0 group-hover:bg-[#0070f3] group-hover:text-white transition-colors">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0b132b]">QR Code Studio</div>
                        <div className="text-[11px] text-slate-500">Dynamic high-density vector codes</div>
                      </div>
                    </a>

                    <a href="#biopages" className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/80 transition-colors group">
                      <div className="p-2 rounded-lg bg-blue-50 text-[#0070f3] shrink-0 group-hover:bg-[#0070f3] group-hover:text-white transition-colors">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0b132b]">Pages &amp; Bio</div>
                        <div className="text-[11px] text-slate-500">Mobile link profiles for creators</div>
                      </div>
                    </a>

                    <a href="#analytics" className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/80 transition-colors group">
                      <div className="p-2 rounded-lg bg-blue-50 text-[#0070f3] shrink-0 group-hover:bg-[#0070f3] group-hover:text-white transition-colors">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0b132b]">Detailed Analytics</div>
                        <div className="text-[11px] text-slate-500">Real-time visitor intelligence</div>
                      </div>
                    </a>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Core Features</div>
                  <div className="space-y-3">
                    <a href="#features" className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/80 transition-colors group">
                      <div className="p-2 rounded-lg bg-purple-50 text-purple-600 shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0b132b]">Branded Domains</div>
                        <div className="text-[11px] text-slate-500">Attach custom CNAME domains</div>
                      </div>
                    </a>

                    <a href="#features" className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/80 transition-colors group">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0b132b]">Password &amp; Expiry</div>
                        <div className="text-[11px] text-slate-500">Protect confidential links</div>
                      </div>
                    </a>

                    <a href="#features" className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/80 transition-colors group">
                      <div className="p-2 rounded-lg bg-sky-50 text-sky-600 shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0b132b]">UTM Campaign Builder</div>
                        <div className="text-[11px] text-slate-500">Automatic marketing attribution</div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. AI Mega Menu */}
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setActiveDropdown('ai')}
              onClick={() => setActiveDropdown(activeDropdown === 'ai' ? null : 'ai')}
              className={`flex items-center gap-1 py-1.5 text-[15px] font-medium transition-colors ${
                activeDropdown === 'ai' ? 'text-[#0070f3]' : 'text-slate-600 hover:text-[#0070f3]'
              }`}
            >
              <span>AI</span>
              <span className="text-xs opacity-60 ml-0.5">▾</span>
            </button>

            {activeDropdown === 'ai' && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 shadow-2xl border border-white/80 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <a href="#ai" className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/80 transition-colors group">
                  <div className="p-2 rounded-lg bg-blue-50 text-[#0070f3] shrink-0 group-hover:bg-[#0070f3] group-hover:text-white transition-colors">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0b132b]">AI Slug Generator</div>
                    <div className="text-[11px] text-slate-500">Recommends high-converting back-halves</div>
                  </div>
                </a>

                <a href="#ai" className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/80 transition-colors group">
                  <div className="p-2 rounded-lg bg-sky-50 text-sky-600 shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0b132b]">HEA Assist AI</div>
                    <div className="text-[11px] text-slate-500">Ask conversational questions about clicks</div>
                  </div>
                </a>

                <a href="#ai" className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/80 transition-colors group">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600 shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0b132b]">Model Context Protocol (MCP)</div>
                    <div className="text-[11px] text-slate-500">Native integration with AI agents</div>
                  </div>
                </a>
              </div>
            )}
          </div>

          {/* 3. Solutions Mega Menu */}
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setActiveDropdown('solutions')}
              onClick={() => setActiveDropdown(activeDropdown === 'solutions' ? null : 'solutions')}
              className={`flex items-center gap-1 py-1.5 text-[15px] font-medium transition-colors ${
                activeDropdown === 'solutions' ? 'text-[#0070f3]' : 'text-slate-600 hover:text-[#0070f3]'
              }`}
            >
              <span>Solutions</span>
              <span className="text-xs opacity-60 ml-0.5">▾</span>
            </button>

            {activeDropdown === 'solutions' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 shadow-2xl border border-white/80 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex gap-2 p-1 bg-slate-100/80 rounded-xl mb-4 text-xs font-semibold">
                  <button
                    onClick={() => setActiveSolTab('industry')}
                    type="button"
                    className={`flex-1 py-1.5 rounded-lg transition-colors ${activeSolTab === 'industry' ? 'bg-white text-[#0070f3] shadow-sm' : 'text-slate-600'}`}
                  >
                    BY INDUSTRY
                  </button>
                  <button
                    onClick={() => setActiveSolTab('team')}
                    type="button"
                    className={`flex-1 py-1.5 rounded-lg transition-colors ${activeSolTab === 'team' ? 'bg-white text-[#0070f3] shadow-sm' : 'text-slate-600'}`}
                  >
                    BY TEAM
                  </button>
                  <button
                    onClick={() => setActiveSolTab('business')}
                    type="button"
                    className={`flex-1 py-1.5 rounded-lg transition-colors ${activeSolTab === 'business' ? 'bg-white text-[#0070f3] shadow-sm' : 'text-slate-600'}`}
                  >
                    BY BUSINESS
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {activeSolTab === 'industry' && (
                    <>
                      <a href="#solutions" className="p-3 rounded-xl bg-white/70 hover:bg-white transition-colors border border-slate-100">
                        <div className="font-bold text-[#0b132b] mb-1">🛍️ Retail &amp; E-Commerce</div>
                        <div className="text-slate-500">Product launch tracking and SMS discounts.</div>
                      </a>
                      <a href="#solutions" className="p-3 rounded-xl bg-white/70 hover:bg-white transition-colors border border-slate-100">
                        <div className="font-bold text-[#0b132b] mb-1">🎬 Media &amp; Creators</div>
                        <div className="text-slate-500">Trailer links, ticket sales &amp; bio pages.</div>
                      </a>
                      <a href="#solutions" className="p-3 rounded-xl bg-white/70 hover:bg-white transition-colors border border-slate-100">
                        <div className="font-bold text-[#0b132b] mb-1">💻 Technology &amp; SaaS</div>
                        <div className="text-slate-500">Route beta downloads &amp; track ROI.</div>
                      </a>
                      <a href="#solutions" className="p-3 rounded-xl bg-white/70 hover:bg-white transition-colors border border-slate-100">
                        <div className="font-bold text-[#0b132b] mb-1">🏥 Healthcare &amp; Services</div>
                        <div className="text-slate-500">Secure patient portal &amp; brochure routing.</div>
                      </a>
                    </>
                  )}

                  {activeSolTab === 'team' && (
                    <>
                      <a href="#solutions" className="p-3 rounded-xl bg-white/70 hover:bg-white transition-colors border border-slate-100">
                        <div className="font-bold text-[#0b132b] mb-1">⚡ Developers &amp; Engineers</div>
                        <div className="text-slate-500">Automate link creation with REST API.</div>
                      </a>
                      <a href="#solutions" className="p-3 rounded-xl bg-white/70 hover:bg-white transition-colors border border-slate-100">
                        <div className="font-bold text-[#0b132b] mb-1">📈 Marketing &amp; Growth</div>
                        <div className="text-slate-500">Optimize UTM campaigns across social and email.</div>
                      </a>
                      <a href="#solutions" className="p-3 rounded-xl bg-white/70 hover:bg-white transition-colors border border-slate-100">
                        <div className="font-bold text-[#0b132b] mb-1">🎧 Customer Support</div>
                        <div className="text-slate-500">Shorten troubleshooting docs for clean delivery.</div>
                      </a>
                      <a href="#solutions" className="p-3 rounded-xl bg-white/70 hover:bg-white transition-colors border border-slate-100">
                        <div className="font-bold text-[#0b132b] mb-1">👥 Operations &amp; HR</div>
                        <div className="text-slate-500">Internal company notices and event QR codes.</div>
                      </a>
                    </>
                  )}

                  {activeSolTab === 'business' && (
                    <>
                      <a href="#solutions" className="p-3 rounded-xl bg-white/70 hover:bg-white transition-colors border border-slate-100">
                        <div className="font-bold text-[#0b132b] mb-1">🌱 Small Business</div>
                        <div className="text-slate-500">Free and accessible tools to establish presence.</div>
                      </a>
                      <a href="#solutions" className="p-3 rounded-xl bg-white/70 hover:bg-white transition-colors border border-slate-100">
                        <div className="font-bold text-[#0b132b] mb-1">🚀 Midmarket Growth</div>
                        <div className="text-slate-500">Custom domains, team seats &amp; history.</div>
                      </a>
                      <a href="#solutions" className="p-3 rounded-xl bg-white/70 hover:bg-white transition-colors border border-slate-100">
                        <div className="font-bold text-[#0b132b] mb-1">🏢 Enterprise Scale</div>
                        <div className="text-slate-500">Dedicated SLA, 99.99% uptime &amp; SOC2.</div>
                      </a>
                      <a href="#solutions" className="p-3 rounded-xl bg-white/70 hover:bg-white transition-colors border border-slate-100">
                        <div className="font-bold text-[#0b132b] mb-1">🌍 Global Agencies</div>
                        <div className="text-slate-500">Multi-client workspace architecture.</div>
                      </a>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. Resources Dropdown */}
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setActiveDropdown('resources')}
              onClick={() => setActiveDropdown(activeDropdown === 'resources' ? null : 'resources')}
              className={`flex items-center gap-1 py-1.5 text-[15px] font-medium transition-colors ${
                activeDropdown === 'resources' ? 'text-[#0070f3]' : 'text-slate-600 hover:text-[#0070f3]'
              }`}
            >
              <span>Resources</span>
              <span className="text-xs opacity-60 ml-0.5">▾</span>
            </button>

            {activeDropdown === 'resources' && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 shadow-2xl border border-white/80 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <a href="#features" className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/80 transition-colors text-xs font-semibold text-[#0b132b]">
                  <Layers className="w-4 h-4 text-[#0070f3]" /> Integrations Hub
                </a>
                <a href="#features" className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/80 transition-colors text-xs font-semibold text-[#0b132b]">
                  <Tag className="w-4 h-4 text-[#38bdf8]" /> UTM Campaign Guide
                </a>
                <a href="#faq" className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/80 transition-colors text-xs font-semibold text-[#0b132b]">
                  <HelpCircle className="w-4 h-4 text-purple-600" /> Help Center &amp; FAQ
                </a>
                <a href="#features" className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/80 transition-colors text-xs font-semibold text-[#0b132b]">
                  <Cpu className="w-4 h-4 text-emerald-600" /> Developer REST API
                </a>
              </div>
            )}
          </div>

          {/* 5. Pricing Direct Link */}
          <a
            href="#pricing"
            className="py-1.5 text-[15px] font-medium text-slate-600 hover:text-[#0070f3] transition-colors"
          >
            Pricing
          </a>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              if (onOpenAuth) onOpenAuth('login');
              else window.location.hash = '#login';
            }}
            className="text-[15px] font-medium text-slate-700 hover:text-[#0070f3] transition-colors px-2 py-1.5 cursor-pointer"
          >
            Log in
          </button>
          <MagneticButton
            onClick={() => {
              if (onOpenAuth) onOpenAuth('signup');
              else window.location.hash = '#signup';
            }}
            className="px-5 py-2.5 bg-[#0070f3] hover:bg-[#0060d4] text-white text-[14px] font-semibold rounded-full shadow-sm transition-all"
          >
            <span className="flex items-center gap-1.5">
              Sign up free
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </MagneticButton>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          type="button"
          className="lg:hidden p-2 text-slate-700 hover:text-[#0070f3] rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass-panel border-t border-white/60 px-6 py-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-3 font-semibold text-slate-800 text-sm">
            <a href="#shortlinks" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#0070f3]">
              URL Shortener
            </a>
            <a href="#qrcodes" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#0070f3]">
              QR Code Studio
            </a>
            <a href="#biopages" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#0070f3]">
              Bio Landing Pages
            </a>
            <a href="#analytics" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#0070f3]">
              Live Analytics
            </a>
            <a href="#ai" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#0070f3]">
              AI Tools
            </a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#0070f3]">
              Pricing
            </a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#0070f3]">
              FAQ
            </a>
          </div>

          <div className="pt-4 border-t border-slate-200/60 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenAuth) onOpenAuth('login');
                else window.location.hash = '#login';
              }}
              className="w-full text-center py-2.5 font-semibold text-[#0b132b] bg-slate-100/80 rounded-xl"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenAuth) onOpenAuth('signup');
                else window.location.hash = '#signup';
              }}
              className="w-full text-center py-2.5 font-semibold text-white bg-[#0070f3] rounded-xl shadow-btn-glow"
            >
              Sign up free →
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
