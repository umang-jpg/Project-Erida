import React, { useEffect } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { listSessions, listDocuments, listMessages } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const { sessions, setSessions, currentSession, setCurrentSession, setDocuments, setMessages, setStatusText, busy } = useSessionStore();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSessions() {
      try {
        const data = await listSessions();
        setSessions(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchSessions();
  }, [setSessions]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-heading text-xl tracking-[4px] glow-text uppercase">Mission Log</h2>
        <p className="text-ink-muted text-sm font-body">Previous compliance scans and assessments.</p>
      </header>

      <div className="grid gap-4">
        {sessions.map((session) => (
          <button
            key={session.id}
            className={`panel scan-line text-left hover:border-cyan transition-all flex justify-between items-center group ${currentSession?.id === session.id ? 'border-cyan border-l-4' : 'border-cyan-dim'}`}
            onClick={async () => {
              setCurrentSession(session);
              setDocuments(await listDocuments(session.id));
              setMessages(await listMessages(session.id));
              setStatusText(`Loaded session: ${session.name}`);
              navigate(`/report/${session.id}`);
            }}
          >
            <div>
              <strong className="block text-lg font-heading tracking-wider text-ink group-hover:glow-text uppercase">{session.name}</strong>
              <span className="text-xs font-mono text-ink-muted">{new Date(session.created_at).toLocaleString()}</span>
            </div>
            <div className="hud-btn text-[10px] tracking-widest group-hover:border-cyan">View Report →</div>
          </button>
        ))}
        {sessions.length === 0 && !busy && (
          <div className="panel border-dashed text-center py-12 text-ink-muted font-mono">
            NO PRIOR SESSIONS DETECTED. INITIATE NEW SCAN TO BEGIN.
          </div>
        )}
      </div>
    </div>
  );
}
