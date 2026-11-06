import { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { MagneticButton } from './MagneticButton';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'py-2.5 bg-white/75 backdrop-blur-xl border-b border-white/80 shadow-sm'
          : 'py-4 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#home" className="flex items-center gap-2.5 group">
          <svg
            className="w-8 h-6 text-[#0070f3] group-hover:scale-105 transition-transform"
            viewBox="0 0 54 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.5 8C10.25 8 6 12.25 6 17.5C6 22.75 10.25 27 15.5 27C21.2 27 24.6 20.8 27 17.5C29.4 14.2 32.8 8 38.5 8C43.75 8 48 12.25 48 17.5C48 22.75 43.75 27 38.5 27C32.8 27 29.4 20.8 27 17.5C24.6 14.2 21.2 8 15.5 8Z"
              stroke="url(#navLogoBlueGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="navLogoBlueGrad" x1="6" y1="8" x2="48" y2="27" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0066ff" />
                <stop offset="100%" stopColor="#00c8ff" />
              </linearGradient>
            </defs>
          </svg>
          <div className="font-extrabold text-xl tracking-tight text-[#0b132b]">
            HEA <span className="text-[#0070f3]">Link</span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm font-semibold text-slate-700 hover:text-[#0070f3] transition-colors relative py-1"
          >
            Features
          </a>
          <a
            href="#solutions"
            className="text-sm font-semibold text-slate-700 hover:text-[#0070f3] transition-colors relative py-1"
          >
            Solutions
          </a>
          <a
            href="#pricing"
            className="text-sm font-semibold text-slate-700 hover:text-[#0070f3] transition-colors relative py-1"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="text-sm font-semibold text-slate-700 hover:text-[#0070f3] transition-colors relative py-1"
          >
            Resources
          </a>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="#login"
            className="text-sm font-semibold text-[#0b132b] hover:text-[#0070f3] transition-colors px-3 py-2"
          >
            Log in
          </a>
          <MagneticButton
            onClick={() => {
              window.location.hash = '#signup';
            }}
            className="px-5 py-2.5 bg-[#0070f3] hover:bg-[#0060d4] text-white text-sm font-semibold rounded-full shadow-btn-glow"
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
          className="md:hidden p-2 text-slate-700 hover:text-[#0070f3] rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-white/60 px-6 py-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-3 font-semibold text-slate-800">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#0070f3]"
            >
              Features
            </a>
            <a
              href="#solutions"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#0070f3]"
            >
              Solutions
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#0070f3]"
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#0070f3]"
            >
              Resources
            </a>
          </div>

          <div className="pt-4 border-t border-slate-200/60 flex flex-col gap-3">
            <a
              href="#login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 font-semibold text-[#0b132b] bg-slate-100/80 rounded-xl"
            >
              Log in
            </a>
            <a
              href="#signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 font-semibold text-white bg-[#0070f3] rounded-xl shadow-btn-glow"
            >
              Sign up free
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
