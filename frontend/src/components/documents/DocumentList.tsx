import React from 'react';
import { FileText, CheckCircle2, Clock } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';

export default function DocumentList() {
  const { documents, files } = useSessionStore();

  const allFiles = [...files.map(f => ({ filename: f.name, id: f.name, status: 'indexing' })), ...documents];

  if (allFiles.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="panel-label">Source Signal Nodes</h4>
      <div className="grid gap-2">
        {allFiles.map((doc, i) => (
          <div key={`${doc.id}-${i}`} className="panel flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-cyan" />
              <span className="text-xs font-mono text-ink uppercase tracking-tighter">{doc.filename}</span>
            </div>
            <div className="flex items-center gap-2">
              {doc.status === 'ready' || !doc.status ? (
                <span className="hud-badge pass">READY</span>
              ) : (
                <span className="hud-badge medium flex items-center gap-1">
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
