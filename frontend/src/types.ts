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
  control_name: string;
  control_description: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "pass" | "partial" | "fail" | "insufficient_evidence" | "error";
  confidence: number;
  evidence?: string | null;
  gap?: string | null;
  remediation?: string | null;
  provider: string;
  model: string;
  source_refs: string[];
  created_at: string;
};

export type ReportSummary = {
  total_controls: number;
  pass_count: number;
  partial_count: number;
  fail_count: number;
  insufficient_evidence_count: number;
  score: number;
  executive_summary: string;
  top_gaps: string[];
};

export type Report = {
  id: string;
  session_id: string;
  framework_id: string;
  framework_name: string;
  status: string;
  provider: string;
  model: string;
  created_at: string;
  summary: ReportSummary;
  findings: Finding[];
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
