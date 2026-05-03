import React, { useState, useRef, useEffect } from 'react';
import { useSessionStore } from '../../store/useSessionStore';
import { sendChat } from '../../api';
import { Send, Terminal, Cpu } from 'lucide-react';

export default function ChatPanel() {
  const { messages, setMessages, currentSession, report, busy, setBusy } = useSessionStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !currentSession || busy) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      session_id: currentSession.id,
      role: 'user' as const,
      content: input,
      citations: [],
      created_at: new Date().toISOString(),
      provider: 'user',
      model: 'user'
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setBusy(true);

    try {
      const response = await sendChat(currentSession.id, input, report?.id);
      setMessages((prev) => [...prev, response.message]);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="w-[360px] flex flex-col bg-base-dark/90 border-l border-cyan-dim h-full">
      <div className="p-6 border-b border-cyan-dim flex items-center justify-between">
        <div>
          <h3 className="font-heading text-sm tracking-[3px] glow-text uppercase">Compliance Copilot</h3>
          <p className="text-[10px] font-mono text-ink-muted tracking-widest mt-1 uppercase">Direct Link: IBM BOB</p>
        </div>
        <Cpu className="text-cyan w-5 h-5 animate-pulse" />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`p-3 rounded-sm border transition-all ${
              m.role === 'assistant' 
                ? 'bg-purple/5 border-purple/20' 
                : 'bg-cyan/10 border-cyan-dim'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className={`font-heading text-[9px] tracking-[2px] ${m.role === 'assistant' ? 'text-purple' : 'text-cyan'}`}>
                {m.role === 'assistant' ? 'IBM BOB' : 'OPERATOR'}
              </span>
              <span className="text-[8px] font-mono text-ink-muted opacity-50">
                {new Date(m.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm text-ink font-body leading-relaxed">{m.content}</p>
            {m.citations && m.citations.length > 0 && (
              <div className="mt-2 pt-2 border-t border-purple/10 flex flex-wrap gap-2">
                {m.citations.map((c, i) => (
                  <span key={i} className="font-mono text-[9px] text-purple">[{c}]</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="p-3 bg-purple/5 border border-purple/20 rounded-sm">
            <div className="font-heading text-[9px] tracking-[2px] text-purple mb-1">IBM BOB</div>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-purple rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-purple rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-purple rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-cyan-dim space-y-3">
        <div className="flex flex-wrap gap-2">
          {['Summary', 'Top Gaps', 'Fix Plan'].map(label => (
            <button 
              key={label}
              onClick={() => setInput(`Give me a ${label.toLowerCase()} of the audit.`)}
              className="hud-btn !py-1 !px-2 !text-[9px] !tracking-widest"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative">
          <textarea
            className="hud-input !pr-10 max-h-32 min-h-[44px]"
            rows={1}
            placeholder="INPUT COMMAND..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || busy}
            className="absolute right-2 bottom-2 p-1.5 text-cyan hover:glow-text disabled:opacity-20 transition-all"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2 text-[8px] font-mono text-ink-muted opacity-50 tracking-[2px] uppercase">
          <Terminal size={10} /> Encryption: watsonx.ai active
        </div>
      </div>
    </aside>
  );
}
