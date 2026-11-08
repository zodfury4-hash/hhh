import { motion } from 'framer-motion';
import { QrCode, Users } from 'lucide-react';
import { Counter } from './Counter';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useIsMobile } from '../hooks/useIsMobile';

interface HudCardProps {
  mousePosition: { x: number; y: number };
}

export function HudCards({ mousePosition }: HudCardProps) {
  const isReduced = useReducedMotion();
  const isMobile = useIsMobile();

  // Different parallax depth multipliers
  const p1 = isMobile || isReduced ? { x: 0, y: 0 } : { x: mousePosition.x * 16, y: mousePosition.y * 14 };
  const p2 = isMobile || isReduced ? { x: 0, y: 0 } : { x: -mousePosition.x * 22, y: -mousePosition.y * 18 };
  const p3 = isMobile || isReduced ? { x: 0, y: 0 } : { x: mousePosition.x * 12, y: -mousePosition.y * 14 };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10">
      {/* 1. Real-time Analytics Card (Top Left) */}
      <motion.div
        animate={{
          x: p1.x,
          y: isReduced ? p1.y : [p1.y, p1.y - 8, p1.y],
        }}
        transition={{
          y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
          x: { type: 'spring', stiffness: 100, damping: 20 },
        }}
        className="absolute top-[5%] sm:top-[7%] lg:top-[8%] -left-14 sm:-left-16 lg:-left-24 glass-panel rounded-2xl px-4 py-3 flex items-center gap-3 shadow-glass"
      >
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-end justify-center p-2 gap-1">
          <span className="w-1.5 h-3 bg-[#0070f3] rounded-sm animate-pulse" />
          <span className="w-1.5 h-5 bg-[#38bdf8] rounded-sm animate-pulse [animation-delay:200ms]" />
          <span className="w-1.5 h-4 bg-[#00c8ff] rounded-sm animate-pulse [animation-delay:400ms]" />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500">Real-time Analytics</div>
          <div className="text-sm font-bold text-emerald-600 flex items-center gap-1">
            <span>↗</span>
            <Counter target={245} prefix="+" suffix="%" />
          </div>
        </div>
      </motion.div>

      {/* 2. Create QR Codes Card (Bottom Left) */}
      <motion.div
        animate={{
          x: p2.x,
          y: isReduced ? p2.y : [p2.y, p2.y + 10, p2.y],
        }}
        transition={{
          y: { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 },
          x: { type: 'spring', stiffness: 100, damping: 20 },
        }}
        className="absolute bottom-[14%] left-[0%] sm:left-[4%] glass-panel rounded-2xl px-4 py-3 flex items-center gap-3 shadow-glass"
      >
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#0070f3]">
          <QrCode className="w-5 h-5 text-[#0070f3]" />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500">Create</div>
          <div className="text-sm font-bold text-[#0b132b]">QR Codes</div>
        </div>
      </motion.div>

      {/* 3. Track Clicks Card (Right) */}
      <motion.div
        animate={{
          x: p3.x,
          y: isReduced ? p3.y : [p3.y, p3.y - 7, p3.y],
        }}
        transition={{
          y: { duration: 3.0, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
          x: { type: 'spring', stiffness: 100, damping: 20 },
        }}
        className="absolute top-[28%] right-[0%] sm:right-[4%] glass-panel rounded-2xl px-4 py-3 flex items-center gap-3 shadow-glass"
      >
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-[#0070f3]">
          <Users className="w-5 h-5 text-[#0070f3]" />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500">Track</div>
          <div className="text-sm font-bold text-[#0070f3]">Clicks & Bio</div>
        </div>
      </motion.div>
    </div>
  );
}
