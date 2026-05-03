import React from 'react';
import { useSessionStore } from '../../store/useSessionStore';

export default function SummaryCards() {
  const { report } = useSessionStore();
  if (!report) return null;

  const stats = [
    { label: 'PASS', value: report.pass_count, color: 'text-ok' },
    { label: 'PARTIAL', value: report.partial_count, color: 'text-warn' },
    { label: 'FAIL', value: report.fail_count, color: 'text-bad' },
    { label: 'MISSING', value: report.insufficient_count, color: 'text-ink-muted' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="panel text-center animate-pulse-glow">
          <div className="panel-label">{s.label}</div>
          <div className={`font-mono text-3xl font-bold ${s.color}`} style={{ textShadow: '0 0 10px currentColor' }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}
