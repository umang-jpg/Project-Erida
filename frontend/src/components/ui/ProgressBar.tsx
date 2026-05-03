import React from 'react';

interface ProgressBarProps { progress: number; label?: string; }

export default function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-[10px] font-heading tracking-[3px] text-ink-muted uppercase">
        <span>{label || 'ENERGY LEVEL'}</span>
        <span className="font-mono text-cyan">{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-2 bg-base-light rounded-sm overflow-hidden border border-cyan-dim">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, rgba(0,240,255,0.3), #00f0ff)',
            boxShadow: '0 0 10px rgba(0,240,255,0.4)',
          }}
        />
      </div>
    </div>
  );
}
