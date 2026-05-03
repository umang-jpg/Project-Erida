import React from 'react';

export default function RemediationView() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-heading text-xl tracking-[4px] glow-text uppercase">Remediation Plan</h2>
        <p className="text-ink-muted text-sm font-body">Track and execute fixes for identified compliance gaps.</p>
      </header>
      <div className="panel text-center py-12">
        <div className="panel-label">Awaiting Data</div>
        <p className="text-ink-muted font-mono text-sm uppercase tracking-widest">Select a finding from the dashboard to generate a remediation vector.</p>
      </div>
    </div>
  );
}
