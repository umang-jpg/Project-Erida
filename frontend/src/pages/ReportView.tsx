import React from 'react';
import { useSessionStore } from '../store/useSessionStore';
import ChatPanel from '../components/layout/ChatPanel';
import { draftRemediation } from '../api';

export default function ReportView() {
  const { report, setReport, setBusy, setStatusText } = useSessionStore();

  const handleDraftFix = async (findingId: string) => {
    setBusy(true);
    try {
      const response = await draftRemediation(findingId);
      setReport((existing) => {
        if (!existing) return existing;
        return {
          ...existing,
          findings: existing.findings.map((finding) =>
            finding.id === findingId ? { ...finding, remediation: response.remediation } : finding,
          ),
        };
      });
      setStatusText("Remediation drafted by IBM BOB.");
    } finally {
      setBusy(false);
    }
  };

  if (!report) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <p>No report loaded. Run an analysis from the New Analysis page.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full -m-8"> {/* Negative margin to overflow AppShell padding */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{report.framework_name} Assessment</h2>
            <p className="text-gray-500">Continuous AI Audit · {new Date().toLocaleDateString()}</p>
          </div>
          <div className="w-20 h-20 rounded-full border-8 border-primary flex items-center justify-center font-bold text-xl">
            {report.summary.score}%
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Pass" value={report.summary.pass_count} color="text-green-600 bg-green-50" />
          <StatCard label="Partial" value={report.summary.partial_count} color="text-amber-600 bg-amber-50" />
          <StatCard label="Fail" value={report.summary.fail_count} color="text-red-600 bg-red-50" />
          <StatCard label="Missing" value={report.summary.insufficient_evidence_count} color="text-gray-600 bg-gray-50" />
        </div>

        {/* Executive Summary */}
        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">IBM BOB Executive Summary</h3>
          <p className="text-lg text-gray-800 leading-relaxed italic">"{report.summary.executive_summary}"</p>
        </section>

        {/* Findings List */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold">Detailed Findings</h3>
          <div className="space-y-4">
            {report.findings.map((finding) => (
              <details key={finding.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden group">
                <summary className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors list-none">
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(finding.status)}`}>
                      {finding.status}
                    </span>
                    <div>
                      <strong className="block text-gray-900">{finding.control_id}</strong>
                      <span className="text-sm text-gray-500">{finding.control_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">{finding.confidence}% confidence</span>
                    <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </summary>
                <div className="p-6 border-t border-gray-100 space-y-6 text-sm">
                  <div>
                    <h4 className="font-bold text-gray-400 uppercase text-[10px] mb-2">Evidence Found</h4>
                    <div className="p-4 bg-gray-50 rounded-lg font-mono text-xs border border-gray-100">
                      {finding.evidence || "No evidence identified in documents."}
                    </div>
                  </div>
                  {finding.gap && (
                    <div>
                      <h4 className="font-bold text-gray-400 uppercase text-[10px] mb-2 text-red-500">Compliance Gap</h4>
                      <p className="text-gray-700">{finding.gap}</p>
                    </div>
                  )}
                  {finding.remediation && (
                    <div>
                      <h4 className="font-bold text-gray-400 uppercase text-[10px] mb-2 text-primary">Remediation Steps</h4>
                      <p className="text-gray-700">{finding.remediation}</p>
                    </div>
                  )}
                  <div className="flex gap-4 pt-4">
                    <button 
                      className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:shadow-md transition-all"
                      onClick={() => handleDraftFix(finding.id)}
                    >
                      Draft Fix with IBM BOB
                    </button>
                    <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors">
                      View Documents
                    </button>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>

      <ChatPanel />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`p-4 rounded-2xl flex flex-col items-center justify-center ${color}`}>
      <span className="text-xs font-bold uppercase tracking-wider opacity-60">{label}</span>
      <strong className="text-3xl font-black mt-1">{value}</strong>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'pass': return 'bg-green-100 text-green-700';
    case 'partial': return 'bg-amber-100 text-amber-700';
    case 'fail': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}
