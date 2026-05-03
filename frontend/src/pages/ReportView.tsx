import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { getReport } from '../api';
import ChatPanel from '../components/layout/ChatPanel';
import SummaryCards from '../components/reports/SummaryCards';
import FindingsTable from '../components/reports/FindingsTable';
import ScoreRing from '../components/ui/ScoreRing';
import SeverityBar from '../components/ui/SeverityBar';
import Badge from '../components/ui/Badge';
import { Download, Share2, Printer, Shield } from 'lucide-react';

export default function ReportView() {
  const { id } = useParams();
  const { report, setReport, setBusy } = useSessionStore();

  useEffect(() => {
    async function loadReport() {
      if (!id) return;
      if (report?.id === id) return;

      setBusy(true);
      try {
        const data = await getReport(id);
        setReport(data);
      } catch (err) {
        console.error("Failed to load report:", err);
      } finally {
        setBusy(false);
      }
    }
    loadReport();
  }, [id, setReport, setBusy, report?.id]);

  if (!report) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-8">
        <div className="w-20 h-20 border border-dashed border-cyan-dim rounded-none flex items-center justify-center animate-pulse">
          <Download className="w-10 h-10 text-cyan/20" />
        </div>
        <div>
          <h3 className="font-heading text-xl text-ink tracking-widest uppercase glow-text">Waiting for Data</h3>
          <p className="text-ink-muted max-w-xs font-mono text-xs mt-2">LINK TO ACTIVE SCAN REQUIRED FOR VISUALIZATION.</p>
        </div>
      </div>
    );
  }

  const severityData = [
    { label: 'CRITICAL', value: report.findings.filter(f => f.status === 'fail').length, color: '#ef7a7a' },
    { label: 'HIGH', value: report.findings.filter(f => f.status === 'partial').length, color: '#f0b65a' },
    { label: 'LOW', value: report.findings.filter(f => f.status === 'pass').length, color: '#58c58a' },
  ];

  const handleExportCSV = () => {
    const headers = ['Control ID', 'Status', 'Confidence', 'Gap', 'Remediation'];
    const rows = report.findings.map(f => [
      f.control_id,
      f.status,
      `${f.confidence}%`,
      `"${f.gap.replace(/"/g, '""')}"`,
      `"${f.remediation.replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `report_${report.id}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-full -m-8">
      <div className="flex-1 overflow-y-auto p-8 space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="medium">Final Assessment</Badge>
              <span className="text-[10px] font-mono text-ink-muted uppercase tracking-widest">{new Date(report.created_at).toLocaleDateString()}</span>
            </div>
            <h2 className="font-heading text-4xl tracking-[4px] glow-text uppercase">{report.framework_name || "Compliance"} Dashboard</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={handleExportCSV} className="hud-btn p-2.5">
              <Download className="w-5 h-5" />
            </button>
            <button className="hud-btn p-2.5">
              <Share2 className="w-5 h-5" />
            </button>
            <button onClick={() => window.print()} className="hud-btn primary flex items-center gap-2 px-5 py-2.5">
              <Printer className="w-4 h-4" /> EXPORT PDF
            </button>
          </div>
        </header>

        {/* Top Summary Row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SummaryCards />
          </div>
          <div className="panel flex items-center justify-between">
            <div className="space-y-4 flex-1">
              <div className="panel-label">OVERALL SCORE</div>
              <SeverityBar data={severityData} />
            </div>
            <div className="ml-8">
              <ScoreRing score={report.overall_score ?? 0} />
            </div>
          </div>
        </section>

        {/* Executive Summary */}
        <section className="panel border-l-4 border-purple relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Shield className="w-32 h-32 -rotate-12" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-cyan rounded-full" />
              <h3 className="panel-label !mb-0">GROQ AI EXECUTIVE SUMMARY</h3>
            </div>
            <p className="text-xl text-ink leading-relaxed font-body italic">
              "{report.executive_summary}"
            </p>
          </div>
        </section>

        {/* Detailed Findings Table */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <h3 className="font-heading text-2xl text-ink tracking-widest uppercase">Compliance Controls</h3>
            <p className="text-[10px] text-ink-muted font-mono uppercase tracking-widest">Showing {report.findings.length} signals</p>
          </div>
          <FindingsTable />
        </section>
      </div>

      <ChatPanel />
    </div>
  );
}
