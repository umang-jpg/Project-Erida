import React, { useState, useMemo } from 'react';
import { useSessionStore } from '../../store/useSessionStore';
import { draftRemediation } from '../../api';
import Badge from '../ui/Badge';
import { Search, Filter, ChevronDown, MessageSquare, Wrench } from 'lucide-react';

export default function FindingsTable() {
  const { report, setReport, setBusy, setStatusText, setMessages, currentSession } = useSessionStore();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    // We scroll to chat bar or trigger message
    setMessages(prev => [...prev, {
      id: `local-${Date.now()}`,
      session_id: currentSession.id,
      role: 'user',
      content: question,
      citations: [],
      created_at: new Date().toISOString()
    }]);
    // In a real app, we'd trigger the chat service here too
  };

  const filteredFindings = useMemo(() => {
    if (!report) return [];
    return report.findings.filter(f => {
      const matchesFilter = filter === 'all' || f.status.toLowerCase() === filter.toLowerCase();
      const matchesSearch = f.control_id.toLowerCase().includes(search.toLowerCase()) || 
                            f.control_name.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [report, filter, search]);

  if (!report) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search controls..."
            className="pl-10 pr-4 py-2 w-full bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm"
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
                px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                ${filter === s ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}
              `}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredFindings.map((finding) => (
          <div key={finding.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <button 
              className="w-full p-5 flex justify-between items-center text-left"
              onClick={() => setExpandedId(expandedId === finding.id ? null : finding.id)}
            >
              <div className="flex items-center gap-6">
                <Badge variant={finding.status.toLowerCase() as any}>{finding.status}</Badge>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-gray-900 font-bold">{finding.control_id}</strong>
                    <Badge variant={finding.severity.toLowerCase() as any}>{finding.severity}</Badge>
                  </div>
                  <span className="text-sm text-gray-500">{finding.control_name}</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="hidden md:block text-right">
                  <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Confidence</div>
                  <div className="text-sm font-bold text-gray-900">{finding.confidence}%</div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === finding.id ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {expandedId === finding.id && (
              <div className="px-5 pb-6 border-t border-gray-50 pt-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Control Description</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{finding.control_description}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Evidence Found</h4>
                      <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-gray-700 font-mono leading-relaxed italic">
                        "{finding.evidence || 'No evidence identified.'}"
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">The Gap</h4>
                      <p className="text-sm text-gray-800 font-medium">{finding.gap || 'No critical gaps found.'}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Remediation Step</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">{finding.remediation || 'Compliant. No action needed.'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-50">
                  <button 
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all"
                    onClick={() => handleDraftFix(finding.id)}
                  >
                    <Wrench className="w-4 h-4" /> Draft Fix with IBM BOB
                  </button>
                  <button 
                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
                    onClick={() => handleAskAI(finding)}
                  >
                    <MessageSquare className="w-4 h-4" /> Ask IBM BOB
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {filteredFindings.length === 0 && (
          <div className="p-12 text-center text-gray-400 bg-white border border-dashed rounded-2xl">
            No controls found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}
