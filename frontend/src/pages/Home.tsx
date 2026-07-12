import React, { useEffect } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { listSessions, listDocuments, listMessages } from '../api';
import { useNavigate } from 'react-router-dom';

const HUDButton = ({ text, onClick }: { text: string, onClick: () => void }) => (
  <button onClick={onClick} className="hud-targeting-btn scale-90">
    <span className="bracket-left">
      <span className="tick top"></span>
      <span className="tick bottom"></span>
    </span>
    <span className="btn-line left"></span>
    <span className="btn-text">{text}</span>
    <span className="btn-line right"></span>
    <span className="bracket-right">
      <span className="tick top"></span>
      <span className="tick bottom"></span>
    </span>
  </button>
);

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
        <p 
          className="uppercase"
          style={{ 
            fontSize: '10px', 
            letterSpacing: '0.4em', 
            color: 'var(--text-muted)',
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 300,
            marginTop: '4px'
          }}
        >
          SCAN HISTORY · COMPLIANCE INTELLIGENCE ARCHIVE
        </p>
      </header>

      <div className="grid gap-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="group relative bg-[var(--space-surface)] border-l-2 border-l-[var(--orange)] border-t border-r border-b border-[var(--orange-dim)] p-[16px_20px] transition-all duration-200 hover:bg-[var(--orange)]/[0.04] hover:border-l-[var(--orange-glow)] flex justify-between items-center cursor-pointer"
            onClick={async () => {
              setCurrentSession(session);
              setDocuments(await listDocuments(session.id));
              setMessages(await listMessages(session.id));
              navigate(`/report/${session.id}`);
            }}
          >
            <div>
              <strong className="block text-[15px] font-heading font-[600] tracking-[0.1em] text-[var(--text-primary)]">
                {session.name.toUpperCase()}
              </strong>
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                {new Date(session.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <HUDButton text="VIEW REPORT →" onClick={() => {}} />
          </div>
        ))}
        {sessions.length === 0 && !busy && (
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div 
              className="w-[48px] height-[48px] border border-[var(--orange)] rounded-full animate-pulse-glow"
              style={{ width: '48px', height: '48px' }}
            />
            <div className="text-center space-y-1">
              <h3 className="font-heading font-[600] text-[13px] tracking-[0.4em] text-[var(--orange)] uppercase">
                NO SESSIONS DETECTED
              </h3>
              <p className="font-mono text-[10px] tracking-[0.3em] text-[var(--text-muted)] uppercase">
                INITIATE A NEW SCAN TO BEGIN ANALYSIS
              </p>
            </div>
            <div className="pt-4">
              <HUDButton text="BEGIN NEW SCAN" onClick={() => navigate('/new')} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
