import { Globe, Lock, Sliders, Users2, Cpu, Zap } from 'lucide-react';
import { TiltCard } from '../components/TiltCard';

const FEATURES = [
  {
    icon: <Globe className="w-6 h-6 text-[#0070f3]" />,
    title: 'Custom Branded Domains',
    desc: 'Connect your own domain (e.g. link.yourcompany.com) with automated free SSL certification and DNS verification in under 60 seconds.',
  },
  {
    icon: <Lock className="w-6 h-6 text-emerald-600" />,
    title: 'Password & Expiry Shield',
    desc: 'Protect sensitive preview links with customizable passwords or schedule automated expiration dates after promo windows close.',
  },
  {
    icon: <Sliders className="w-6 h-6 text-[#38bdf8]" />,
    title: 'Visual UTM Campaign Builder',
    desc: 'Automatically append source, medium, campaign, and content tags to maintain 100% clean attribution in Google Analytics 4.',
  },
  {
    icon: <Users2 className="w-6 h-6 text-purple-600" />,
    title: 'Multi-User Team Workspaces',
    desc: 'Invite collaborators, assign role-based permissions (Admin, Editor, Viewer), and manage shared link libraries effortlessly.',
  },
  {
    icon: <Zap className="w-6 h-6 text-amber-500" />,
    title: '99.99% Uptime Cloud SLA',
    desc: 'Distributed across global Anycast edge networks for instant sub-80ms resolution anywhere on the planet with zero downtime.',
  },
  {
    icon: <Cpu className="w-6 h-6 text-[#00c8ff]" />,
    title: 'Enterprise REST API & Webhooks',
    desc: 'Automate link shortening directly within your CI/CD pipelines, mobile applications, or CRM with comprehensive Swagger documentation.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 lg:py-32 overflow-hidden z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#0070f3] text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            Engineered for High-Growth Scale
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight">
            Everything your team needs to <span className="text-[#0070f3]">scale link ops</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            From single creators to global marketing departments, HEA Link provides the reliable
            infrastructure required to power mission-critical customer journeys.
          </p>
        </div>

        {/* 6 Feature Tilt Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <TiltCard key={i} className="p-7 space-y-4 shadow-glass hover:shadow-glass-hover">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                {f.icon}
              </div>
              <h3 className="font-bold text-lg text-[#0b132b]">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
