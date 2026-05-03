import type { ChatMessage, ChatResponse, Document, Framework, Report, Session } from "./types";

const API_BASE = "http://localhost:8000/api";

async function parseJson<T>(responsePromise: Promise<Response>): Promise<T> {
  const response = await responsePromise;
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getHealth(): Promise<{ live_mode: boolean; provider: string; model: string }> {
  return parseJson(fetch(`${API_BASE}/health`));
}

export async function listFrameworks(): Promise<Framework[]> {
  return parseJson(fetch(`${API_BASE}/frameworks`));
}

export async function listSessions(): Promise<Session[]> {
  return parseJson(fetch(`${API_BASE}/sessions`));
}

export async function createSession(name: string): Promise<Session> {
  return parseJson(
    fetch(`${API_BASE}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }),
  );
}

export async function getSession(id: string): Promise<Session> {
  return parseJson(fetch(`${API_BASE}/sessions/${id}`));
}


export async function uploadDocuments(sessionId: string, files: File[]): Promise<Document[]> {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  files.forEach((file) => formData.append("files", file));
  return parseJson(
    fetch(`${API_BASE}/documents`, {
      method: "POST",
      body: formData,
    }),
  );
}

export async function listDocuments(sessionId: string): Promise<Document[]> {
  return parseJson(fetch(`${API_BASE}/documents?session_id=${encodeURIComponent(sessionId)}`));
}

export async function createReport(sessionId: string, frameworkId: string): Promise<{ report_id: string }> {
  return parseJson(
    fetch(`${API_BASE}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, framework_id: frameworkId }),
    }),
  );
}

export async function getReport(id: string): Promise<Report> {
  return parseJson(fetch(`${API_BASE}/reports/${id}`));
}

export async function getReportStatus(id: string): Promise<{ status: string; completed_controls: number; total_controls: number; overall_score?: number }> {
  return parseJson(fetch(`${API_BASE}/reports/${id}/status`));
}


export async function seedDemo(): Promise<{ session_id: string; report_id: string }> {
  return parseJson(
    fetch(`${API_BASE}/demo/seed`, {
      method: "POST",
    }),
  );
}


export async function sendChat(sessionId: string, message: string, reportId?: string): Promise<ChatResponse> {
  return parseJson(
    fetch(`${API_BASE}/sessions/${sessionId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, report_id: reportId }),
    }),
  );
}

export async function listMessages(sessionId: string): Promise<ChatMessage[]> {
  return parseJson(fetch(`${API_BASE}/sessions/${sessionId}/messages`));
}

export async function draftRemediation(findingId: string): Promise<{ remediation: string; mode: string }> {
  return parseJson(
    fetch(`${API_BASE}/findings/${findingId}/draft-remediation`, {
      method: "POST",
    }),
  );
}
