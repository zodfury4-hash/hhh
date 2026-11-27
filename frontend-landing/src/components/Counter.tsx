import { useEffect, useState } from 'react';

interface CounterProps {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export function Counter({ target, prefix = '', suffix = '', duration = 1200 }: CounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);
      start = Math.round(ease * target);
      setCount(start);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    const animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [target, duration]);

  return (
    <span>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}
