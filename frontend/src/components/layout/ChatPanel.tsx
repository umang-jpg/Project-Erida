import React, { useState } from 'react';
import { useSessionStore } from '../../store/useSessionStore';
import { sendChat } from '../../api';

export default function ChatPanel() {
  const { currentSession, report, messages, setMessages, busy, setBusy } = useSessionStore();
  const [chatInput, setChatInput] = useState("");

  const starterPrompts = [
    "Which gap should I fix first?",
    "Why did the deletion control fail?",
    "Draft policy language for encryption.",
  ];

  const handleSendMessage = async (prefilled?: string) => {
    if (!currentSession) return;
    const content = prefilled ?? chatInput;
    if (!content.trim()) return;

    setBusy(true);
    try {
      const response = await sendChat(currentSession.id, content, report?.id);
      setMessages((items) => [
        ...items,
        {
          id: `local-${Date.now()}`,
          session_id: currentSession.id,
          role: "user",
          content,
          citations: [],
          created_at: new Date().toISOString(),
        },
        response.message,
      ]);
      setChatInput("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col h-full shadow-2xl">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Compliance Copilot</h2>
        <p className="text-xs text-primary font-bold uppercase tracking-wider">Powered by IBM BOB</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {starterPrompts.map((prompt) => (
            <button 
              key={prompt} 
              className="text-[10px] px-2 py-1 bg-gray-100 rounded-full hover:bg-primary hover:text-white transition-colors"
              onClick={() => handleSendMessage(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        {messages.map((message) => (
          <div key={message.id} className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] font-bold text-gray-400 mb-1">
              {message.role === 'assistant' ? 'IBM BOB' : 'YOU'}
            </span>
            <div className={`max-w-[90%] p-3 rounded-2xl text-sm ${message.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
              <p>{message.content}</p>
              {message.citations && message.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200/20 text-[10px] opacity-70">
                  Citations: {message.citations.join(' · ')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="relative">
          <textarea
            className="w-full p-3 pr-12 bg-white border border-gray-200 rounded-xl resize-none text-sm outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask IBM BOB..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button 
            className="absolute bottom-3 right-3 p-1 text-primary hover:bg-blue-50 rounded-lg transition-colors"
            onClick={() => handleSendMessage()}
            disabled={busy}
          >
            <svg className="w-6 h-6 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
