import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useIsMobile } from '../hooks/useIsMobile';

export function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const isReduced = useReducedMotion();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isReduced || isMobile || typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest('button, a, input, [role="button"], .interactive-hover');
        setIsHovered(!!interactive);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isReduced, isMobile, isVisible]);

  if (isReduced || isMobile || !isVisible) return null;

  return (
    <>
      {/* Outer Spring Ring */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-[#0070f3]/60 pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2"
        animate={{
          x: pos.x,
          y: pos.y,
          scale: isHovered ? 1.6 : 1,
          backgroundColor: isHovered ? 'rgba(0, 112, 243, 0.08)' : 'transparent',
          borderColor: isHovered ? '#0070f3' : 'rgba(0, 112, 243, 0.45)',
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 25, mass: 0.2 }}
      />
      {/* Inner Dot */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-[#0070f3] pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2"
        animate={{
          x: pos.x,
          y: pos.y,
          scale: isHovered ? 0.5 : 1,
        }}
        transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      />
    </>
  );
}
