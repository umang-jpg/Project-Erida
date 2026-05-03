export type Framework = {
  id: string;
  name: string;
  version: string;
  description: string;
  controls: Control[];
};

export type Control = {
  control_id: string;
  name: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  category?: string;
};

export type Session = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  session_id: string;
  filename: string;
  content_type: string;
  status: string;
  text: string;
  chunk_count: number;
  created_at: string;
};

export type Finding = {
  id: string;
  report_id: string;
  control_id: string;
  status: "pass" | "partial" | "fail" | "insufficient_evidence";
  confidence: number;
  evidence: string;
  gap: string;
  remediation: string;
};

export type Report = {
  id: string;
  session_id: string;
  framework_id: string;
  framework_name?: string; // Optional helper
  status: "running" | "complete" | "error";
  overall_score: number | null;
  pass_count: number;
  fail_count: number;
  partial_count: number;
  insufficient_count: number;
  executive_summary: string;
  findings: Finding[];
  created_at: string;
};


export type ChatMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  citations: string[];
  provider: string;
  model: string;
  created_at: string;
};

export type ChatResponse = {
  message: ChatMessage;
  mode: "live" | "fallback";
};
