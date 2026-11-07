import { motion } from 'framer-motion';
import { TiltCard } from '../components/TiltCard';

const STEPS = [
  {
    num: '01',
    title: '1. Paste Long URL',
    desc: 'Drop any long, cumbersome link into HEA Link to instantly compress it into a high-speed branded short URL.',
    badge: 'Step 1',
  },
  {
    num: '02',
    title: '2. Customize & Brand',
    desc: 'Pick a custom back-half, generate a QR code, add an expiry date, or configure password protection.',
    badge: 'Step 2',
  },
  {
    num: '03',
    title: '3. Share & Track',
    desc: 'Share anywhere across social, email, or physical media and watch real-time clicks flood into your analytics dashboard.',
    badge: 'Step 3',
  },
];

export function StepsSection() {
  return (
    <section id="steps" className="relative py-20 lg:py-28 z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#0070f3] text-xs font-bold uppercase tracking-wider">
            HOW IT WORKS
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight">
            Get started in three easy steps
          </h2>
          <p className="text-base text-slate-600 max-w-xl mx-auto">
            From creation to real-time analytics in under 60 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {STEPS.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
            >
              <TiltCard
                maxTilt={6}
                className="p-8 h-full rounded-3xl bg-white/70 backdrop-blur-md border border-white/80 shadow-glass hover:shadow-glass-hover transition-all flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl sm:text-4xl font-black text-[#0070f3]/25 font-mono">
                      {step.num}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#0070f3] border border-blue-100">
                      {step.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#0b132b]">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>
                <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-[#0070f3] to-[#00d2ff]" />
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
