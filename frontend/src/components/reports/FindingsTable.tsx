import React, { useState, useMemo, useEffect } from 'react';
import { useSessionStore } from '../../store/useSessionStore';
import { draftRemediation, listFrameworks } from '../../api';
import Badge from '../ui/Badge';
import { Search, ChevronDown, MessageSquare, Wrench } from 'lucide-react';
import type { Control } from '../../types';

export default function FindingsTable() {
  const { report, setReport, setBusy, setStatusText, setMessages, currentSession } = useSessionStore();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [controls, setControls] = useState<Record<string, Control>>({});

  useEffect(() => {
    async function fetchControls() {
      if (!report) return;
      try {
        const frameworks = await listFrameworks();
        const fw = frameworks.find(f => f.id === report.framework_id);
        if (fw) {
          const mapping = fw.controls.reduce((acc, c) => ({ ...acc, [c.control_id]: c }), {});
          setControls(mapping);
        }
      } catch (err) {
        console.error("Failed to load framework controls:", err);
      }
    }
    fetchControls();
  }, [report?.framework_id]);

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

  const handleAskAI = (finding: any) => {
    if (!currentSession) return;
    const question = `Why did ${finding.control_id} get marked ${finding.status}?`;
    setMessages(prev => [...prev, {
      id: `local-${Date.now()}`,
      session_id: currentSession.id,
      role: 'user',
      content: question,
      citations: [],
      created_at: new Date().toISOString()
    }]);
  };

  const filteredFindings = useMemo(() => {
    if (!report) return [];
    return report.findings.filter(f => {
      const ctrl = controls[f.control_id];
      const matchesFilter = filter === 'all' || f.status.toLowerCase() === filter.toLowerCase();
      const matchesSearch = f.control_id.toLowerCase().includes(search.toLowerCase()) || 
                            (ctrl && ctrl.name.toLowerCase().includes(search.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [report, filter, search, controls]);

  if (!report) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center panel">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan/40" />
          <input 
            type="text"
            placeholder="Search signals..."
            className="hud-input !pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {['all', 'pass', 'partial', 'fail'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`
                hud-btn !py-1 !px-3 text-[10px] tracking-widest
                ${filter === s ? 'primary' : ''}
              `}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredFindings.map((finding) => {
          const ctrl = controls[finding.control_id];
          const isExpanded = expandedId === finding.id;
          return (
            <div key={finding.id} className={`panel hover:border-cyan transition-all group ${isExpanded ? 'scan-line border-cyan' : ''}`}>
              <button 
                className="w-full flex justify-between items-center text-left outline-none"
                onClick={() => setExpandedId(isExpanded ? null : finding.id)}
              >
                <div className="flex items-center gap-6">
                  <Badge variant={finding.status.toLowerCase() as any}>{finding.status}</Badge>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-ink font-heading text-sm tracking-widest group-hover:glow-text uppercase">{finding.control_id}</strong>
                      {ctrl && <Badge variant={ctrl.severity.toLowerCase() as any}>{ctrl.severity}</Badge>}
                    </div>
                    <span className="text-xs text-ink-muted font-mono uppercase tracking-tighter">{ctrl?.name || 'SYNCING CONTROL DATA...'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden md:block text-right">
                    <div className="panel-label !mb-0 !text-[8px]">CONFIDENCE</div>
                    <div className="font-mono text-sm font-bold text-cyan">{finding.confidence}%</div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-cyan/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isExpanded && (
                <div className="pt-6 mt-6 border-t border-cyan-dim space-y-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <div className="panel-label">CONTROL DESCRIPTION</div>
                        <p className="text-sm text-ink-muted leading-relaxed font-body">{ctrl?.description || 'WAITING FOR DATA...'}</p>
                      </div>
                      <div>
                        <div className="panel-label">EVIDENCE LOG</div>
                        <div className="p-4 bg-cyan/5 rounded-sm border border-cyan-dim text-[10px] text-ink font-mono leading-relaxed italic">
                          "{finding.evidence || 'NO SIGNAL DETECTED.'}"
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="panel-label !text-bad">ANALYZED GAP</div>
                        <p className="text-sm text-ink font-medium font-body">{finding.gap || 'NO ANOMALIES FOUND.'}</p>
                      </div>
                      <div>
                        <div className="panel-label !text-cyan">REMEDIATION VECTOR</div>
                        <p className="text-sm text-ink-muted leading-relaxed font-body">{finding.remediation || 'Compliant. No action required.'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-cyan-dim">
                    <button 
                      className="hud-btn primary flex items-center gap-2"
                      onClick={() => handleDraftFix(finding.id)}
                    >
                      <Wrench className="w-4 h-4" /> DRAFT FIX
                    </button>
                    <button 
                      className="hud-btn flex items-center gap-2"
                      onClick={() => handleAskAI(finding)}
                    >
                      <MessageSquare className="w-4 h-4" /> QUERY AI
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {filteredFindings.length === 0 && (
          <div className="panel border-dashed text-center py-12 text-ink-muted font-mono uppercase tracking-widest text-xs">
            NO SIGNALS MATCHING FILTER CRITERIA.
          </div>
        )}
      </div>
    </div>
  );
}
