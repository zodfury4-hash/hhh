import React, { useRef, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useIsMobile } from '../hooks/useIsMobile';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}

export function TiltCard({
  children,
  className = '',
  maxTilt = 8,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 50, opacity: 0 });
  const isReduced = useReducedMotion();
  const isMobile = useIsMobile();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReduced || isMobile || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    setRot({
      x: -normY * maxTilt,
      y: normX * maxTilt,
    });
    setGlow({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.16,
    });
  };

  const handleMouseLeave = () => {
    setRot({ x: 0, y: 0 });
    setGlow({ x: 50, y: 50, opacity: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
        transition: 'transform 0.15s ease-out',
      }}
      className={`relative glass-panel rounded-2xl overflow-hidden ${className}`}
      {...props}
    >
      {/* Dynamic Cursor-Follow Radial Glow */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: glow.opacity,
          background: `radial-gradient(400px circle at ${glow.x}% ${glow.y}%, rgba(0, 112, 243, 0.25), transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}
