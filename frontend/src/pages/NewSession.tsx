import React, { useState, useEffect } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { createSession, listFrameworks, createReport } from '../api';
import { useNavigate } from 'react-router-dom';
import DocumentUpload from '../components/documents/DocumentUpload';
import DocumentList from '../components/documents/DocumentList';
import FrameworkPicker from '../components/frameworks/FrameworkPicker';
import ProgressBar from '../components/ui/ProgressBar';

export default function NewSession() {
  const { 
    currentSession, setCurrentSession, 
    setFrameworks, 
    selectedFrameworkId,
    documents,
    setReport,
    setStatusText,
    setBusy,
    busy
  } = useSessionStore();
  
  const [sessionName, setSessionName] = useState("IBM BOB Demo Session");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchFrameworks() {
      const data = await listFrameworks();
      setFrameworks(data);
    }
    fetchFrameworks();
  }, [setFrameworks]);

  const handleCreateSession = async () => {
    setBusy(true);
    try {
      const session = await createSession(sessionName);
      setCurrentSession(session);
      setStatusText("Session created. Upload your evidence documents next.");
    } catch (err: any) {
      console.error(err);
      setStatusText(`Error: ${err.message || "Failed to create session"}`);
    } finally {
      setBusy(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!currentSession || !selectedFrameworkId) return;
    
    setBusy(true);
    setAnalysisProgress(0);
    setStatusText("IBM BOB is analyzing controls against your evidence...");

    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 400);

    try {
      const { report_id } = await createReport(currentSession.id, selectedFrameworkId);
      
      setTimeout(() => {
        clearInterval(interval);
        setAnalysisProgress(100);
        setStatusText("Analysis complete.");
        setTimeout(() => {
          navigate(`/report/${report_id}`);
          setBusy(false);
          setAnalysisProgress(0);
        }, 500);
      }, 3000);
    } catch (err) {
      clearInterval(interval);
      setBusy(false);
      setStatusText("Analysis failed. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header>
        <h2 className="font-heading text-4xl tracking-[4px] glow-text uppercase">Initiate New Scan</h2>
        <p className="text-ink-muted mt-2 text-lg font-body">Configure your compliance session powered by IBM BOB.</p>
      </header>

      {busy && analysisProgress > 0 && (
        <div className="fixed inset-0 bg-base-dark/90 backdrop-blur-md z-50 flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-none border border-cyan/30 border-t-cyan animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center font-heading text-cyan text-xs tracking-widest glow-text">BOB</div>
            </div>
            <div className="space-y-4">
              <h3 className="font-heading text-2xl text-ink tracking-widest">AI ENGINE ACTIVE</h3>
              <p className="text-ink-muted italic font-mono text-xs">"Mapping document chunks to regulatory controls..."</p>
              <ProgressBar progress={analysisProgress} label="SIGNAL PROCESSING" />
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Session */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="flex-shrink-0 w-10 h-10 border border-cyan text-cyan font-mono flex items-center justify-center font-bold">01</span>
          <h3 className="font-heading text-xl text-ink tracking-widest uppercase">Name your Session</h3>
        </div>
        <div className="panel flex gap-4">
          <input 
            className="hud-input flex-1"
            value={sessionName} 
            onChange={(e) => setSessionName(e.target.value)} 
            placeholder="e.g., SOC 2 Annual Audit" 
            disabled={!!currentSession || busy}
          />
          {!currentSession ? (
            <button 
              className="hud-btn primary"
              onClick={handleCreateSession} 
              disabled={busy}
            >
              Start Session
            </button>
          ) : (
            <div className="flex items-center px-6 text-cyan font-bold gap-2 font-mono text-xs tracking-widest">
              <div className="w-2 h-2 rounded-full bg-cyan animate-pulse" /> ACTIVE
            </div>
          )}
        </div>
      </section>

      {/* Step 2: Upload */}
      <section className={`space-y-6 transition-all duration-500 ${!currentSession ? 'opacity-30 blur-[2px] pointer-events-none' : ''}`}>
        <div className="flex items-center gap-4">
          <span className="flex-shrink-0 w-10 h-10 border border-cyan text-cyan font-mono flex items-center justify-center font-bold">02</span>
          <h3 className="font-heading text-xl text-ink tracking-widest uppercase">Evidence Collection</h3>
        </div>
        <div className="space-y-6">
          <DocumentUpload />
          <DocumentList />
        </div>
      </section>

      {/* Step 3: Framework */}
      <section className={`space-y-6 transition-all duration-500 ${documents.length === 0 ? 'opacity-30 blur-[2px] pointer-events-none' : ''}`}>
        <div className="flex items-center gap-4">
          <span className="flex-shrink-0 w-10 h-10 border border-cyan text-cyan font-mono flex items-center justify-center font-bold">03</span>
          <h3 className="font-heading text-xl text-ink tracking-widest uppercase">Target Framework</h3>
        </div>
        <div className="space-y-8">
          <FrameworkPicker />
          <div className="pt-6 border-t border-cyan-dim">
            <button 
              className={`
                w-full hud-btn primary py-5 text-xl tracking-[3px]
                ${selectedFrameworkId 
                  ? '' 
                  : 'opacity-30 cursor-not-allowed'}
              `}
              onClick={handleRunAnalysis} 
              disabled={!selectedFrameworkId || busy}
            >
              RUN IBM BOB COMPLIANCE ENGINE
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
