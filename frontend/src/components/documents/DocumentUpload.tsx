import React from 'react';
import { Upload } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';

export default function DocumentUpload() {
  const { setFiles, busy } = useSessionStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="relative group">
      <div className={`
        border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all
        ${busy ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-blue-50 cursor-pointer border-gray-200'}
      `}>
        <Upload className="w-12 h-12 text-gray-400 group-hover:text-primary mb-4 transition-colors" />
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Click or drag files to upload</p>
          <p className="text-sm text-gray-500 mt-1">Accepts PDF, TXT, or Markdown (Max 10MB)</p>
        </div>
        <input
          type="file"
          multiple
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleFileChange}
          disabled={busy}
          accept=".pdf,.txt,.md"
        />
      </div>
    </div>
  );
}
