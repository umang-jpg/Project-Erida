import { create } from 'zustand';
import type { Session, Framework, Report, ChatMessage } from '../types';

interface SessionState {
  // App State
  sessions: Session[];
  currentSession: Session | null;
  frameworks: Framework[];
  selectedFrameworkId: string;
  files: File[];
  documents: any[];
  report: Report | null;
  messages: ChatMessage[];
  statusText: string;
  busy: boolean;

  // Actions
  setSessions: (sessions: Session[] | ((prev: Session[]) => Session[])) => void;
  setCurrentSession: (session: Session | null) => void;
  setFrameworks: (frameworks: Framework[]) => void;
  setSelectedFrameworkId: (id: string) => void;
  setFiles: (files: File[]) => void;
  setDocuments: (documents: any[] | ((prev: any[]) => any[])) => void;
  setReport: (report: Report | null | ((prev: Report | null) => Report | null)) => void;
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  setStatusText: (text: string) => void;
  setBusy: (busy: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  currentSession: null,
  frameworks: [],
  selectedFrameworkId: '',
  files: [],
  documents: [],
  report: null,
  messages: [],
  statusText: 'Loading app...',
  busy: false,

  setSessions: (sessions) => set((state) => ({ 
    sessions: typeof sessions === 'function' ? sessions(state.sessions) : sessions 
  })),
  setCurrentSession: (session) => set({ currentSession: session }),
  setFrameworks: (frameworks) => set({ frameworks }),
  setSelectedFrameworkId: (selectedFrameworkId) => set({ selectedFrameworkId }),
  setFiles: (files) => set({ files }),
  setDocuments: (documents) => set((state) => ({ 
    documents: typeof documents === 'function' ? documents(state.documents) : documents 
  })),
  setReport: (report) => set((state) => ({ 
    report: typeof report === 'function' ? report(state.report) : report 
  })),
  setMessages: (messages) => set((state) => ({ 
    messages: typeof messages === 'function' ? messages(state.messages) : messages 
  })),
  setStatusText: (statusText) => set({ statusText }),
  setBusy: (busy) => set({ busy }),
}));
