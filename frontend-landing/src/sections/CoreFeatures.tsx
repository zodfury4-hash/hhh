import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { TiltCard } from '../components/TiltCard';

const CORE_FEATURES = [
  {
    icon: '🔗',
    title: 'Short Links',
    desc: 'Custom back-halves, branded domains, tags, and editable destinations.',
    href: '#dashboard',
    accent: '#0070f3',
  },
  {
    icon: '▦',
    title: 'Dynamic QR Codes',
    desc: 'Custom brand colours, PNG vector download, and real-time updates.',
    href: '#qr',
    accent: '#00c8ff',
  },
  {
    icon: '📱',
    title: 'Link-in-Bio Pages',
    desc: 'Curate all your links onto one gorgeous mobile profile.',
    href: '#pages',
    accent: '#8b5cf6',
  },
  {
    icon: '📈',
    title: 'Detailed Analytics',
    desc: 'Click metrics over time, device types, geolocations, and referrers.',
    href: '#analytics',
    accent: '#10b981',
  },
];

export function CoreFeatures() {
  return (
    <section className="relative py-20 lg:py-28 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#0070f3] text-xs font-bold uppercase tracking-wider">
            EVERYTHING YOU NEED
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight">
            One platform for every link you share
          </h2>
          <p className="text-base text-slate-600 max-w-xl mx-auto">
            Everything connects seamlessly to give your audience a fast, branded experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CORE_FEATURES.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <TiltCard
                maxTilt={8}
                className="p-6 h-full flex flex-col justify-between shadow-glass hover:shadow-glass-hover rounded-2xl group cursor-pointer transition-all border border-white/80 bg-white/70 backdrop-blur-md"
              >
                <a href={item.href} className="flex flex-col h-full justify-between">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-bold text-[#0b132b] group-hover:text-[#0070f3] transition-colors flex items-center justify-between">
                      <span>{item.title}</span>
                      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-[#0070f3]" />
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100 text-xs font-semibold text-[#0070f3] flex items-center gap-1">
                    <span>Explore tool</span>
                    <span>→</span>
                  </div>
                </a>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
