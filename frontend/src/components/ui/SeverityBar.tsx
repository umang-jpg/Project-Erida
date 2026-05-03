import React from 'react';

interface SeverityBarProps {
  data: { label: string; value: number; color: string }[];
}

export default function SeverityBar({ data }: SeverityBarProps) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="space-y-2">
      <div className="panel-label">SIGNAL ANALYSIS</div>
      <div className="flex h-3 rounded-sm overflow-hidden border border-cyan-dim">
        {data.map((d, i) => (
          <div key={i} title={`${d.label}: ${d.value}`} style={{ width: `${(d.value / total) * 100}%`, background: d.color, boxShadow: `0 0 6px ${d.color}40` }} />
        ))}
      </div>
      <div className="flex gap-4 text-[10px] font-mono text-ink-muted">
        {data.map((d, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: d.color }} />
            {d.label}: {d.value}
          </span>
        ))}
      </div>
    </div>
  );
}
