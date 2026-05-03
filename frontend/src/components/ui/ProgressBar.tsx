import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
}

export default function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-400">
        <span>{label || 'Processing'}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(15,98,254,0.3)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
