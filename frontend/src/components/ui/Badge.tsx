import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'pass' | 'fail' | 'partial' | 'info' | 'critical' | 'high' | 'medium' | 'low';
}

export default function Badge({ children, variant = 'info' }: BadgeProps) {
  const getStyles = () => {
    switch (variant) {
      case 'pass': return 'bg-green-100 text-green-700';
      case 'fail': 
      case 'critical': return 'bg-red-100 text-red-700';
      case 'partial':
      case 'high': return 'bg-amber-100 text-amber-700';
      case 'medium': return 'bg-blue-100 text-blue-700';
      case 'low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStyles()}`}>
      {children}
    </span>
  );
}
