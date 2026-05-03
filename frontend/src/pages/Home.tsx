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
        <h2 className="text-3xl font-bold">Analysis History</h2>
        <p className="text-gray-500">View and manage your previous compliance assessments.</p>
      </header>

      <div className="grid gap-4">
        {sessions.map((session) => (
          <button
            key={session.id}
            className={`p-4 bg-white border rounded-xl text-left hover:border-primary transition-all flex justify-between items-center ${currentSession?.id === session.id ? 'border-primary ring-1 ring-primary' : 'border-gray-200'}`}
            onClick={async () => {
              setCurrentSession(session);
              setDocuments(await listDocuments(session.id));
              setMessages(await listMessages(session.id));
              setStatusText(`Loaded session: ${session.name}`);
              navigate(`/report/${session.id}`);
            }}
          >
            <div>
              <strong className="block text-lg">{session.name}</strong>
              <span className="text-sm text-gray-500">{new Date(session.created_at).toLocaleString()}</span>
            </div>
            <div className="text-primary font-medium">View Report →</div>
          </button>
        ))}
        {sessions.length === 0 && !busy && (
          <div className="text-center py-12 bg-white border border-dashed rounded-xl text-gray-400">
            No sessions found. Start a new analysis to see it here.
          </div>
        )}
      </div>
    </div>
  );
}
