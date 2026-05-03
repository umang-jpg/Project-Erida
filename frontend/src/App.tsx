import { useEffect, useMemo, useState } from "react";

import {
  createReport,
  createSession,
  draftRemediation,
  getHealth,
  listDocuments,
  listFrameworks,
  listMessages,
  listSessions,
  seedDemo,
  sendChat,
  uploadDocuments,
} from "./api";
import type { ChatMessage, Framework, Report, Session } from "./types";

const starterPrompts = [
  "Which gap should I fix first to unblock enterprise sales?",
  "Why did the deletion control fail?",
  "Draft the missing policy language for data deletion.",
];

export default function App() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sessionName, setSessionName] = useState("IBM BOB Demo Session");
  const [statusText, setStatusText] = useState("Loading app...");
  const [health, setHealth] = useState<{ live_mode: boolean; provider: string; model: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    try {
      const [frameworkData, sessionData, healthData] = await Promise.all([
        listFrameworks(),
        listSessions(),
        getHealth(),
      ]);
      setFrameworks(frameworkData);
      setSessions(sessionData);
      setSelectedFrameworkId(frameworkData[0]?.id ?? "");
      setHealth(healthData);
      setStatusText(healthData.live_mode ? "IBM BOB live mode is connected." : "IBM BOB fallback mode is active.");
    } catch (error) {
      setStatusText(`Startup issue: ${(error as Error).message}`);
    }
  }

  async function handleCreateSession() {
    setBusy(true);
    try {
      const session = await createSession(sessionName);
      setCurrentSession(session);
      setSessions((items) => [session, ...items]);
      setStatusText("Session created. Upload your evidence documents next.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload() {
    if (!currentSession || files.length === 0) return;
    setBusy(true);
    try {
      const uploaded = await uploadDocuments(currentSession.id, files);
      setDocuments(uploaded);
      setStatusText("Documents indexed. IBM BOB is ready to map controls to evidence.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRunAnalysis() {
    if (!currentSession || !selectedFrameworkId) return;
    setBusy(true);
    setStatusText("IBM BOB is analyzing controls against your uploaded evidence...");
    try {
      const createdReport = await createReport(currentSession.id, selectedFrameworkId);
      setReport(createdReport);
      setStatusText("Analysis complete. Review findings and ask IBM BOB follow-up questions.");
      const priorMessages = await listMessages(currentSession.id);
      setMessages(priorMessages);
      const currentDocuments = await listDocuments(currentSession.id);
      setDocuments(currentDocuments);
    } finally {
      setBusy(false);
    }
  }

  async function handleSeedDemo() {
    setBusy(true);
    try {
      const seeded = await seedDemo();
      setCurrentSession(seeded.session);
      setReport(seeded.report);
      setSessions((items) => [seeded.session, ...items]);
      setDocuments(await listDocuments(seeded.session.id));
      setStatusText("Seeded demo loaded. Use chat to keep IBM BOB visibly live in the walkthrough.");
      setMessages(await listMessages(seeded.session.id));
    } finally {
      setBusy(false);
    }
  }

  async function handleSendMessage(prefilled?: string) {
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
          provider: health?.provider ?? "IBM BOB",
          model: health?.model ?? "fallback",
          created_at: new Date().toISOString(),
        },
        response.message,
      ]);
      setChatInput("");
      setStatusText(
        response.mode === "live"
          ? "IBM BOB answered live."
          : "Fallback chat answered. Keep one live IBM BOB call ready before demo day.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDraftFix(findingId: string) {
    setBusy(true);
    try {
      const response = await draftRemediation(findingId);
      setReport((existing) => {
        if (!existing) return existing;
        return {
          ...existing,
          findings: existing.findings.map((finding) =>
            finding.id === findingId ? { ...finding, remediation: response.remediation } : finding,
          ),
        };
      });
      setStatusText(
        response.mode === "live"
          ? "IBM BOB drafted remediation live."
          : "Fallback remediation drafted. Replace with live IBM BOB when credentials are ready.",
      );
    } finally {
      setBusy(false);
    }
  }

  const selectedFramework = useMemo(
    () => frameworks.find((framework) => framework.id === selectedFrameworkId) ?? null,
    [frameworks, selectedFrameworkId],
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">ComplianceAutopilot</p>
          <h1>Compliance Copilot powered by IBM BOB</h1>
          <p className="muted">
            Turn policy documents into evidence-backed compliance findings, executive summaries, and remediation steps.
          </p>
        </div>

        <div className="panel">
          <div className="panel-title-row">
            <h2>Demo Control</h2>
            <span className={`badge ${health?.live_mode ? "ok" : "warn"}`}>
              {health?.live_mode ? "IBM BOB live" : "Fallback mode"}
            </span>
          </div>
          <p className="status-line">{statusText}</p>
          <button className="secondary-button" onClick={handleSeedDemo} disabled={busy}>
            Load Seeded Demo
          </button>
        </div>

        <div className="panel">
          <h2>Sessions</h2>
          <input value={sessionName} onChange={(event) => setSessionName(event.target.value)} placeholder="Session name" />
          <button onClick={handleCreateSession} disabled={busy}>
            Create Session
          </button>
          <div className="list">
            {sessions.map((session) => (
              <button
                key={session.id}
                className={`list-item ${currentSession?.id === session.id ? "active" : ""}`}
                onClick={async () => {
                  setCurrentSession(session);
                  setDocuments(await listDocuments(session.id));
                  setMessages(await listMessages(session.id));
                  setStatusText(`Loaded session: ${session.name}`);
                }}
              >
                <strong>{session.name}</strong>
                <span>{new Date(session.created_at).toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="main">
        <section className="hero panel gradient-panel">
          <div>
            <p className="eyebrow">IBM BOB First Flow</p>
            <h2>Upload evidence. Select a framework. Let IBM BOB explain what is missing.</h2>
          </div>
          <div className="hero-metrics">
            <div>
              <span>Provider</span>
              <strong>{health?.provider ?? "IBM BOB"}</strong>
            </div>
            <div>
              <span>Model</span>
              <strong>{health?.model ?? "fallback"}</strong>
            </div>
          </div>
        </section>

        <section className="grid-two">
          <div className="panel">
            <div className="panel-title-row">
              <h2>1. Upload Documents</h2>
              <span className="badge info">PDF, TXT, MD</span>
            </div>
            <input
              type="file"
              multiple
              accept=".pdf,.txt,.md"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
            <button onClick={handleUpload} disabled={!currentSession || files.length === 0 || busy}>
              Upload to Current Session
            </button>
            <div className="list compact">
              {documents.map((document) => (
                <div key={document.id} className="list-item">
                  <strong>{document.filename}</strong>
                  <span>{document.status} · {document.chunk_count} chunks</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title-row">
              <h2>2. Choose Framework</h2>
              <span className="badge info">Built-in</span>
            </div>
            <div className="card-grid">
              {frameworks.map((framework) => (
                <button
                  key={framework.id}
                  className={`framework-card ${framework.id === selectedFrameworkId ? "selected" : ""}`}
                  onClick={() => setSelectedFrameworkId(framework.id)}
                >
                  <strong>{framework.name}</strong>
                  <span>{framework.description}</span>
                  <small>{framework.controls.length} controls</small>
                </button>
              ))}
            </div>
            {selectedFramework && (
              <div className="framework-preview">
                <h3>{selectedFramework.name} Controls</h3>
                <ul>
                  {selectedFramework.controls.map((control) => (
                    <li key={control.control_id}>
                      <strong>{control.control_id}</strong> {control.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button onClick={handleRunAnalysis} disabled={!currentSession || !selectedFrameworkId || busy}>
              Run IBM BOB Analysis
            </button>
          </div>
        </section>

        {report && (
          <section className="panel">
            <div className="panel-title-row">
              <div>
                <p className="eyebrow">Report</p>
                <h2>{report.framework_name} Assessment</h2>
              </div>
              <div className="score-ring">
                <span>{report.summary.score}%</span>
              </div>
            </div>

            <div className="summary-grid">
              <SummaryCard label="Pass" value={report.summary.pass_count} tone="ok" />
              <SummaryCard label="Partial" value={report.summary.partial_count} tone="warn" />
              <SummaryCard label="Fail" value={report.summary.fail_count} tone="bad" />
              <SummaryCard label="Insufficient" value={report.summary.insufficient_evidence_count} tone="info" />
            </div>

            <div className="executive-summary">
              <p className="eyebrow">IBM BOB Executive Summary</p>
              <p>{report.summary.executive_summary}</p>
            </div>

            <div className="finding-list">
              {report.findings.map((finding) => (
                <details key={finding.id} className="finding-card">
                  <summary>
                    <div>
                      <strong>{finding.control_id}</strong>
                      <span>{finding.control_name}</span>
                    </div>
                    <div className="finding-meta">
                      <span className={`badge ${finding.status}`}>{finding.status}</span>
                      <span className={`badge severity-${finding.severity}`}>{finding.severity}</span>
                      <span>{finding.confidence}% confidence</span>
                    </div>
                  </summary>
                  <div className="finding-body">
                    <p><strong>Description:</strong> {finding.control_description}</p>
                    <p><strong>Evidence:</strong> {finding.evidence ?? "No direct evidence returned."}</p>
                    <p><strong>Gap:</strong> {finding.gap ?? "No gap recorded."}</p>
                    <p><strong>Remediation:</strong> {finding.remediation ?? "No remediation drafted yet."}</p>
                    <p><strong>Sources:</strong> {finding.source_refs.join(", ") || "No sources attached."}</p>
                    <div className="action-row">
                      <button onClick={() => handleSendMessage(`Why did ${finding.control_id} get marked ${finding.status}?`)}>
                        Ask IBM BOB
                      </button>
                      <button className="secondary-button" onClick={() => handleDraftFix(finding.id)}>
                        Draft Fix with IBM BOB
                      </button>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}
      </main>

      <aside className="chatbar">
        <div className="panel chat-panel">
          <div className="panel-title-row">
            <div>
              <p className="eyebrow">Chat</p>
              <h2>Compliance Copilot powered by IBM BOB</h2>
            </div>
            <span className="badge info">Grounded answers</span>
          </div>

          <div className="prompt-row">
            {starterPrompts.map((prompt) => (
              <button key={prompt} className="chip" onClick={() => handleSendMessage(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <div className="chat-log">
            {messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.role}`}>
                <span className="chat-role">{message.role === "assistant" ? "IBM BOB" : "You"}</span>
                <p>{message.content}</p>
                {message.citations.length > 0 && <small>Citations: {message.citations.join(" · ")}</small>}
              </div>
            ))}
          </div>

          <div className="chat-input-row">
            <textarea
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask why a control failed, what to fix first, or draft policy language..."
            />
            <button onClick={() => handleSendMessage()} disabled={!currentSession || busy}>
              Ask IBM BOB
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`summary-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
