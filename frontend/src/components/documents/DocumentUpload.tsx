import React from 'react';
import { Upload } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';
import { uploadDocument } from '../../api';

export default function DocumentUpload() {
  const { currentSession, setDocuments, setStatusText, setBusy, busy } = useSessionStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !currentSession) return;
    
    const files = Array.from(e.target.files);
    setBusy(true);
    setStatusText(`Uploading ${files.length} document(s)...`);

    try {
      const uploadPromises = files.map(file => uploadDocument(currentSession.id, file));
      const uploadedDocs = await Promise.all(uploadPromises);
      
      setDocuments(prev => [...prev, ...uploadedDocs]);
      setStatusText(`Successfully uploaded ${files.length} document(s)`);
    } catch (err: any) {
      console.error(err);
      setStatusText(`Upload failed: ${err.message}`);
    } finally {
      setBusy(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="relative group">
      <div className={`
        border border-dashed p-10 flex flex-col items-center justify-center transition-all
        ${busy ? 'opacity-30 cursor-not-allowed border-cyan-dim' : 'hover:border-cyan cursor-pointer border-cyan-dim bg-cyan/5'}
      `}>
        <Upload className="w-12 h-12 text-ink-muted group-hover:text-cyan mb-4 transition-colors" />
        <div className="text-center">
          <p className="text-lg font-heading tracking-widest text-ink uppercase">Initialize Ingestion</p>
          <p className="text-xs text-ink-muted mt-2 font-body tracking-wider uppercase">PDF, TXT, or Markdown · MAX 10MB</p>
        </div>
        <input
          type="file"
          multiple
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleFileChange}
          disabled={busy || !currentSession}
          accept=".pdf,.txt,.md"
        />
      </div>
    </div>
  );
}

// Made with IBM BOB
