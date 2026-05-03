import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'pass' | 'fail' | 'partial' | 'info' | 'critical' | 'high' | 'medium' | 'low';
}

export default function Badge({ children, variant = 'info' }: BadgeProps) {
  return <span className={`hud-badge ${variant}`}>{children}</span>;
}
