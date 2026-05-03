import React, { useState, useEffect } from 'react';

interface ScoreRingProps { score: number; size?: number; label?: string; }

export default function ScoreRing({ score, size = 96, label = 'BOB' }: ScoreRingProps) {
  const [val, setVal] = useState(0);
  const r = (size/2) - 8, circ = 2*Math.PI*r, offset = circ*(1 - val/100);
  useEffect(() => { const t = setTimeout(() => setVal(score), 100); return () => clearTimeout(t); }, [score]);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} strokeWidth="4" fill="transparent" stroke="rgba(0,240,255,0.1)" />
        <circle cx={size/2} cy={size/2} r={r} strokeWidth="4" fill="transparent" stroke="#00f0ff"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.5s ease-out', filter: 'drop-shadow(0 0 6px rgba(0,240,255,0.5))' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-lg font-bold glow-text">{Math.round(val)}%</span>
        <span className="text-[8px] font-heading tracking-[3px] text-ink-muted">{label}</span>
      </div>
    </div>
  );
}
