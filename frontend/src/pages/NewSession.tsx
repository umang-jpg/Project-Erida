import React, { useState, useEffect } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { createSession, listFrameworks, uploadDocuments, createReport } from '../api';
import { useNavigate } from 'react-router-dom';

export default function NewSession() {
  const { 
    currentSession, setCurrentSession, 
    frameworks, setFrameworks, 
    selectedFrameworkId, setSelectedFrameworkId,
    files, setFiles,
    documents, setDocuments,
    setReport,
    setStatusText,
    setBusy,
    busy
  } = useSessionStore();
  
  const [sessionName, setSessionName] = useState("IBM BOB Demo Session");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchFrameworks() {
      const data = await listFrameworks();
      setFrameworks(data);
      if (data.length > 0 && !selectedFrameworkId) {
        setSelectedFrameworkId(data[0].id);
      }
    }
    fetchFrameworks();
  }, [setFrameworks, selectedFrameworkId, setSelectedFrameworkId]);

  const handleCreateSession = async () => {
    setBusy(true);
    try {
      const session = await createSession(sessionName);
      setCurrentSession(session);
      setStatusText("Session created. Upload your evidence documents next.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async () => {
    if (!currentSession || files.length === 0) return;
    setBusy(true);
    try {
      const uploaded = await uploadDocuments(currentSession.id, files);
      setDocuments(uploaded);
      setStatusText("Documents indexed. IBM BOB is ready to map controls to evidence.");
    } finally {
      setBusy(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!currentSession || !selectedFrameworkId) return;
    setBusy(true);
    setStatusText("IBM BOB is analyzing controls against your uploaded evidence...");
    try {
      const createdReport = await createReport(currentSession.id, selectedFrameworkId);
      setReport(createdReport);
      navigate(`/report/${currentSession.id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-bold">New Compliance Analysis</h2>
        <p className="text-gray-500">Step-by-step setup for your regulatory assessment.</p>
      </header>

      {/* Step 1: Session */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">1</span>
          <h3 className="text-xl font-semibold">Name your Session</h3>
        </div>
        <div className="flex gap-4">
          <input 
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
            value={sessionName} 
            onChange={(e) => setSessionName(e.target.value)} 
            placeholder="e.g., SOC 2 Audit Q2" 
          />
          <button 
            className="bg-primary text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
            onClick={handleCreateSession} 
            disabled={busy}
          >
            Create
          </button>
        </div>
      </section>

      {/* Step 2: Upload */}
      <section className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 transition-opacity ${!currentSession ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">2</span>
          <h3 className="text-xl font-semibold">Upload Evidence</h3>
        </div>
        <input 
          type="file" 
          multiple 
          accept=".pdf,.txt,.md" 
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))} 
        />
        <button 
          className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-black transition-colors"
          onClick={handleUpload} 
          disabled={files.length === 0 || busy}
        >
          Upload & Index Documents
        </button>
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="text-sm flex justify-between p-2 bg-gray-50 rounded">
              <span>{doc.filename}</span>
              <span className="text-green-600 font-medium">Ready</span>
            </div>
          ))}
        </div>
      </section>

      {/* Step 3: Framework */}
      <section className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6 transition-opacity ${documents.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">3</span>
          <h3 className="text-xl font-semibold">Choose Framework</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {frameworks.map((f) => (
            <button
              key={f.id}
              className={`p-4 border rounded-xl text-left transition-all ${selectedFrameworkId === f.id ? 'border-primary bg-blue-50 ring-1 ring-primary' : 'border-gray-200 hover:border-primary'}`}
              onClick={() => setSelectedFrameworkId(f.id)}
            >
              <strong className="block">{f.name}</strong>
              <p className="text-xs text-gray-500 mt-1">{f.description}</p>
            </button>
          ))}
        </div>
        <button 
          className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          onClick={handleRunAnalysis} 
          disabled={!selectedFrameworkId || busy}
        >
          Run IBM BOB Analysis
        </button>
      </section>
    </div>
  );
}
