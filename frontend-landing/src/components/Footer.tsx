import { Heart, Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative border-t border-blue-500/10 bg-white/40 backdrop-blur-xl pt-16 pb-12 mt-20 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-200/60">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <svg
                className="w-7 h-5 text-[#0070f3]"
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
              <span className="font-extrabold text-xl text-[#0b132b]">
                HEA <span className="text-[#0070f3]">Link</span>
              </span>
            </div>
            <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
              The modern URL shortener, QR code studio, and bio pages platform designed for high-growth
              creators, marketing teams, and developers.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="HEA Link on X (Twitter)"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg bg-white/80 hover:text-[#0070f3] border border-slate-200/60 shadow-sm transition-colors text-slate-600"
              >
                <Twitter className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="HEA Link on GitHub"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg bg-white/80 hover:text-[#0070f3] border border-slate-200/60 shadow-sm transition-colors text-slate-600"
              >
                <Github className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="HEA Link on LinkedIn"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg bg-white/80 hover:text-[#0070f3] border border-slate-200/60 shadow-sm transition-colors text-slate-600"
              >
                <Linkedin className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Column 1: Products */}
          <div>
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-4">
              Products
            </h2>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <a href="#home" className="hover:text-[#0070f3] transition-colors">
                  URL Shortener
                </a>
              </li>
              <li>
                <a href="#qrcodes" className="hover:text-[#0070f3] transition-colors">
                  Dynamic QR Codes
                </a>
              </li>
              <li>
                <a href="#biopages" className="hover:text-[#0070f3] transition-colors">
                  Bio Landing Pages
                </a>
              </li>
              <li>
                <a href="#analytics" className="hover:text-[#0070f3] transition-colors">
                  Live Analytics
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#0070f3] transition-colors">
                  Custom Domains
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Solutions */}
          <div>
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-4">
              Solutions
            </h2>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <a href="#solutions" className="hover:text-[#0070f3] transition-colors">
                  Social Media Growth
                </a>
              </li>
              <li>
                <a href="/pricing" className="hover:text-[#0070f3] transition-colors">
                  Pricing Plans
                </a>
              </li>
              <li>
                <a href="/integrations" className="hover:text-[#0070f3] transition-colors">
                  Integrations Hub
                </a>
              </li>
              <li>
                <a href="/developers" className="hover:text-[#0070f3] transition-colors">
                  REST API &amp; SDKs
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-4">
              Platform
            </h2>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <a href="#login" className="hover:text-[#0070f3] transition-colors">
                  Client Portal
                </a>
              </li>
              <li>
                <a href="#signup" className="hover:text-[#0070f3] transition-colors">
                  Create Account
                </a>
              </li>
              <li>
                <a href="/help" className="hover:text-[#0070f3] transition-colors">
                  Help Center &amp; FAQ
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-[#0070f3] transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-[#0070f3] transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Systems Operational
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div>© 2026 HEA Link Inc. All rights reserved. Built with precision and care.</div>
          <div className="flex items-center gap-1 text-slate-600">
            Crafted for speed, conversion &amp; privacy <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline ml-1" aria-hidden="true" />
          </div>
        </div>
      </div>
    </footer>
  );
}
