import React from 'react';
import { FileText, CheckCircle2, Clock } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';

export default function DocumentList() {
  const { documents, files } = useSessionStore();

  const allFiles = [...files.map(f => ({ filename: f.name, id: f.name, status: 'indexing' })), ...documents];

  if (allFiles.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Uploaded Documents</h4>
      <div className="grid gap-2">
        {allFiles.map((doc, i) => (
          <div key={`${doc.id}-${i}`} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-gray-700">{doc.filename}</span>
            </div>
            <div className="flex items-center gap-2">
              {doc.status === 'ready' || !doc.status ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                  <CheckCircle2 className="w-3 h-3" /> READY
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  <Clock className="w-3 h-3 animate-spin" /> INDEXING
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
