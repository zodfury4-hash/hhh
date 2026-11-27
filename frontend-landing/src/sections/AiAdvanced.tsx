import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Copy, Check, ArrowRight } from 'lucide-react';
import { TiltCard } from '../components/TiltCard';

const ADVANCED = [
  {
    icon: '🤖',
    title: 'AI Assistant',
    desc: 'Analyzes past click traffic and recommends memorable, high-converting slugs.',
  },
  {
    icon: '🔒',
    title: 'Password & Expiry',
    desc: 'Protect confidential links or let promotional campaigns expire automatically.',
  },
  {
    icon: '🌐',
    title: 'Dynamic Routing',
    desc: 'Redirect users based on country, device language, or mobile operating system.',
  },
  {
    icon: '🏷️',
    title: 'UTM Builder',
    desc: 'Campaign-ready tracking parameters built in seconds for GA4 and attribution.',
  },
  {
    icon: '👥',
    title: 'Team Workspaces',
    desc: 'Role-based access controls and permissions with complete enterprise audit trails.',
  },
  {
    icon: '🛡️',
    title: 'Safe Link Preview',
    desc: 'Protects users by showing a clean redirect gateway preview before routing.',
  },
];

export function AiAdvanced() {
  const [inputUrl, setInputUrl] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSuggest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) {
      setSuggestion('Please paste a destination URL first.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      try {
        let clean = inputUrl.trim().toLowerCase();
        if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
          clean = 'https://' + clean;
        }
        const parsed = new URL(clean);
        const pathPart = parsed.pathname.split('/').filter(Boolean).pop() || '';
        const hostPart = parsed.hostname.replace('www.', '').split('.')[0];
        
        const candidate = (pathPart || hostPart || 'smart')
          .replace(/[^a-z0-9]/gi, '-')
          .slice(0, 12);
        
        const randomNum = Math.floor(100 + Math.random() * 900);
        const slug = `${candidate || 'link'}-${randomNum}`;
        setSuggestion(`hea.link/${slug}`);
      } catch {
        const rand = Math.random().toString(36).substring(2, 8);
        setSuggestion(`hea.link/ai-${rand}`);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleCopy = () => {
    if (!suggestion || suggestion.startsWith('Please')) return;
    navigator.clipboard.writeText(`https://${suggestion}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="ai" className="relative py-24 lg:py-32 z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: AI Interactive Box */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#0070f3] text-xs font-bold uppercase tracking-wider">
                ONLY ON HEA LINK
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b132b] tracking-tight">
                Smarter links with <span className="text-[#0070f3]">advanced controls</span>
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Protect links, expire them, and let AI suggest a readable, high-converting back-half. Try it now:
              </p>
            </div>

            {/* Interactive AI Suggest Form */}
            <div className="p-6 rounded-2xl bg-white/75 backdrop-blur-md border border-white/80 shadow-glass space-y-4">
              <form onSubmit={handleSuggest} className="space-y-3">
                <label htmlFor="aiUrl" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Test AI Back-Half Generator
                </label>
                <div className="relative">
                  <input
                    id="aiUrl"
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="Enter long link (e.g. https://example.com/docs)..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:border-transparent transition-all"
                  />
                </div>
                <button
                  id="aiBtn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-[#0070f3] hover:bg-blue-600 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>{loading ? 'Analyzing with AI...' : 'Suggest Smart Back-Half →'}</span>
                </button>
              </form>

              {/* AI Output Box */}
              {suggestion && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  id="aiOut"
                  className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/60 flex items-center justify-between text-xs sm:text-sm font-semibold text-[#0070f3]"
                >
                  <span className="truncate mr-2 font-mono">✨ {suggestion}</span>
                  {!suggestion.startsWith('Please') && (
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="p-1.5 rounded-lg bg-white border border-blue-200 text-slate-700 hover:text-[#0070f3] transition-colors shrink-0 shadow-sm"
                      title="Copy Suggested Slug"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Column: 6 Advanced Feature Cards Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4" id="adv">
            {ADVANCED.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
              >
                <TiltCard
                  maxTilt={6}
                  className="p-5 h-full rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 shadow-glass hover:shadow-glass-hover transition-all space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-base text-[#0b132b]">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
