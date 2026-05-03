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

    // Simulate analysis progress
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
      // We run the actual API call
      const createdReport = await createReport(currentSession.id, selectedFrameworkId);
      
      // Ensure progress finishes
      setTimeout(() => {
        clearInterval(interval);
        setAnalysisProgress(100);
        setReport(createdReport);
        setStatusText("Analysis complete.");
        setTimeout(() => {
          navigate(`/report/${currentSession.id}`);
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
        <h2 className="text-4xl font-black text-gray-900 tracking-tight">New Analysis</h2>
        <p className="text-gray-500 mt-2 text-lg">Configure your compliance session powered by IBM BOB.</p>
      </header>

      {/* Analysis Progress Overlay */}
      {busy && analysisProgress > 0 && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-50 flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full border-8 border-blue-50 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center font-bold text-primary">BOB</div>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900">AI Engine Working</h3>
              <p className="text-gray-500 italic">"Mapping document chunks to regulatory controls..."</p>
              <ProgressBar progress={analysisProgress} label="Analysis in progress" />
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Session */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-bold shadow-lg shadow-gray-200">1</span>
          <h3 className="text-2xl font-bold text-gray-900">Name your Session</h3>
        </div>
        <div className="flex gap-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <input 
            className="flex-1 px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium"
            value={sessionName} 
            onChange={(e) => setSessionName(e.target.value)} 
            placeholder="e.g., SOC 2 Annual Audit" 
            disabled={!!currentSession || busy}
          />
          {!currentSession ? (
            <button 
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              onClick={handleCreateSession} 
              disabled={busy}
            >
              Start Session
            </button>
          ) : (
            <div className="flex items-center px-6 text-green-600 font-bold gap-2">
              <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" /> Active
            </div>
          )}
        </div>
      </section>

      {/* Step 2: Upload */}
      <section className={`space-y-6 transition-all duration-500 ${!currentSession ? 'opacity-30 blur-[2px] pointer-events-none' : ''}`}>
        <div className="flex items-center gap-4">
          <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-bold shadow-lg shadow-gray-200">2</span>
          <h3 className="text-2xl font-bold text-gray-900">Evidence Collection</h3>
        </div>
        <div className="space-y-6">
          <DocumentUpload />
          <DocumentList />
        </div>
      </section>

      {/* Step 3: Framework */}
      <section className={`space-y-6 transition-all duration-500 ${documents.length === 0 ? 'opacity-30 blur-[2px] pointer-events-none' : ''}`}>
        <div className="flex items-center gap-4">
          <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-bold shadow-lg shadow-gray-200">3</span>
          <h3 className="text-2xl font-bold text-gray-900">Target Framework</h3>
        </div>
        <div className="space-y-8">
          <FrameworkPicker />
          <div className="pt-6 border-t border-gray-100">
            <button 
              className={`
                w-full py-5 rounded-2xl font-black text-xl tracking-tight transition-all transform
                ${selectedFrameworkId 
                  ? 'bg-primary text-white shadow-xl shadow-blue-200 hover:-translate-y-1 hover:shadow-blue-300' 
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'}
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
