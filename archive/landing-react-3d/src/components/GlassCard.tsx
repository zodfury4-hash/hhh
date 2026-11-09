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
      className={`glass-panel rounded-2xl ${
        interactive ? 'glass-panel-interactive' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
