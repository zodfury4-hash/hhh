import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export function GlassCard({
  children,
  className = '',
  interactive = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={`bg-white shadow-lg border border-slate-200 rounded-2xl ${
        interactive ? 'bg-white shadow-lg border border-slate-200-interactive' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
