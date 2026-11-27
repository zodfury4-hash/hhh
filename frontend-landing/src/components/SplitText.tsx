import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface SplitTextProps {
  children: string;
  className?: string;
  delay?: number;
}

export function SplitText({ children, className = '', delay = 0 }: SplitTextProps) {
  const isReduced = useReducedMotion();
  const words = children.split(' ');

  if (isReduced) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={`inline-block ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-top mr-[0.26em]">
          <motion.span
            className="inline-block"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{
              duration: 0.65,
              delay: delay + i * 0.05,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
