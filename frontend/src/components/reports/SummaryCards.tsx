import React from 'react';
import { useSessionStore } from '../../store/useSessionStore';

export default function SummaryCards() {
  const { report } = useSessionStore();
  
  if (!report) return null;

  const stats = [
    { label: 'Pass', value: report.summary.pass_count, color: 'text-green-600 bg-green-50' },
    { label: 'Partial', value: report.summary.partial_count, color: 'text-amber-600 bg-amber-50' },
    { label: 'Fail', value: report.summary.fail_count, color: 'text-red-600 bg-red-50' },
    { label: 'Missing', value: report.summary.insufficient_evidence_count, color: 'text-gray-600 bg-gray-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className={`p-5 rounded-2xl flex flex-col items-center justify-center border border-white/20 shadow-sm ${stat.color}`}>
          <span className="text-xs font-bold uppercase tracking-widest opacity-60">{stat.label}</span>
          <strong className="text-4xl font-black mt-1 tracking-tight">{stat.value}</strong>
        </div>
      ))}
    </div>
  );
}
