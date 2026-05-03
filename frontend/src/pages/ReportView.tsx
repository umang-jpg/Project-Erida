import React from 'react';
import { useSessionStore } from '../store/useSessionStore';
import ChatPanel from '../components/layout/ChatPanel';
import SummaryCards from '../components/reports/SummaryCards';
import FindingsTable from '../components/reports/FindingsTable';
import { Download, Share2, Printer } from 'lucide-react';

export default function ReportView() {
  const { report } = useSessionStore();

  if (!report) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-8">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
          <Download className="w-10 h-10 text-gray-200" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">No Report Active</h3>
          <p className="text-gray-500 max-w-xs">Please run an analysis or select an existing session from history to view results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full -m-8">
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8 space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-100 text-primary text-[10px] font-bold uppercase rounded">Final Assessment</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date().toLocaleDateString()}</span>
            </div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">{report.framework_name} Dashboard</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-primary hover:border-primary transition-all">
              <Download className="w-5 h-5" />
            </button>
            <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-primary hover:border-primary transition-all">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors">
              <Printer className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </header>

        {/* Top Summary Row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SummaryCards />
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overall Score</h4>
              <div className="text-3xl font-black text-gray-900">{report.summary.score}%</div>
              <p className="text-[10px] text-green-600 font-bold uppercase">Condition: Healthy</p>
            </div>
            <div className="relative">
              <svg className="w-20 h-20 -rotate-90">
                <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                <circle 
                  cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  className="text-primary"
                  strokeDasharray={2 * Math.PI * 32}
                  strokeDashoffset={2 * Math.PI * 32 * (1 - report.summary.score / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-primary">BOB</div>
            </div>
          </div>
        </section>

        {/* Executive Summary */}
        <section className="bg-white p-8 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Shield className="w-32 h-32 -rotate-12" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full" />
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest">IBM BOB Executive Summary</h3>
            </div>
            <p className="text-xl text-gray-800 leading-relaxed font-medium italic">
              "{report.summary.executive_summary}"
            </p>
          </div>
        </section>

        {/* Detailed Findings Table */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Compliance Controls</h3>
            <p className="text-xs text-gray-400 font-medium">Showing {report.findings.length} findings from latest audit</p>
          </div>
          <FindingsTable />
        </section>
      </div>

      <ChatPanel />
    </div>
  );
}

function Shield(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
  );
}
