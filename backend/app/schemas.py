from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional, Union

from pydantic import BaseModel, Field

# -----------------------------------------------------------------------------
# Domain models (locked field names — keep stable for frontend / future AI layer)
# -----------------------------------------------------------------------------

DocumentStatus = Literal["uploading", "parsing", "ready", "error"]
ReportWorkflowStatus = Literal["running", "complete", "error"]
FindingKind = Literal["pass", "fail", "partial", "insufficient_evidence"]
Severity = Literal["critical", "high", "medium", "low"]
ChatRole = Literal["user", "assistant"]


class Chunk(BaseModel):
    document_id: str
    chunk_index: int
    content: str
    source_ref: str


class Session(BaseModel):
    id: str
    name: str
    created_at: datetime


class Document(BaseModel):
    id: str
    session_id: str
    filename: str
    file_type: Literal["pdf", "txt", "md"]
    status: DocumentStatus
    parsed_text: Optional[str] = None
    chunks: list[Chunk] = Field(default_factory=list)
    error_message: Optional[str] = None


class Control(BaseModel):
    control_id: str
    name: str
    description: str
    severity: Severity
    category: str


class Framework(BaseModel):
    id: str
    name: str
    version: str
    description: str
    controls: list[Control]


class Finding(BaseModel):
    id: str
    report_id: str
    control_id: str
    status: FindingKind
    confidence: int = Field(ge=0, le=100)
    evidence: str
    gap: str
    remediation: str


class Report(BaseModel):
    id: str
    session_id: str
    framework_id: str
    status: ReportWorkflowStatus
    overall_score: Optional[float] = None
    pass_count: int = 0
    fail_count: int = 0
    partial_count: int = 0
    insufficient_count: int = 0
    executive_summary: str = ""
    findings: list[Finding] = Field(default_factory=list)
    created_at: datetime


class ChatMessage(BaseModel):
    id: str
    session_id: str
    role: ChatRole
    content: str
    created_at: datetime


# -----------------------------------------------------------------------------
# Requests / auxiliary API shapes (small, explicitly named)
# -----------------------------------------------------------------------------


class SessionCreateRequest(BaseModel):
    name: str = Field(default="New session", min_length=1, max_length=200)


class SessionDetail(Session):
    document_ids: list[str] = Field(default_factory=list)


class ReportCreateRequest(BaseModel):
    session_id: str
    framework_id: str


class ReportCreateResponse(BaseModel):
    report_id: str


class DocumentStatusPayload(BaseModel):
    id: str
    status: DocumentStatus
    chunk_count: int


class ReportStatusPayload(BaseModel):
    status: ReportWorkflowStatus
    completed_controls: int
    total_controls: int
    overall_score: Optional[float] = None


class ReportSummaryPayload(BaseModel):
    overall_score: Optional[float] = None
    pass_count: int
    fail_count: int
    partial_count: int
    insufficient_count: int
    executive_summary: str
    top_gaps: list[str]


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    mode: Literal["file-store"] = "file-store"


class DemoSeedResponse(BaseModel):
    session_id: str
    report_id: str
