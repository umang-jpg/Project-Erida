# ComplianceAutopilot — AI-Powered Regulatory Compliance Engine
## Product Requirements Document (Hackathon MVP Edition)
**IBM Bob Dev Day Hackathon | May 2026**
**Team size:** 2 | **Stack:** Python + React | **Mode:** Parallel dev, two branches, merge at end

---

## 0. One-Line Pitch

> ComplianceAutopilot ingests your documents, policies, and codebase — and tells you exactly what is non-compliant, why it is non-compliant, and what to do about it — before a regulator does.

---

## 1. The Problem

Compliance work is one of the most expensive, slow, and error-prone functions in any regulated industry. Whether a company is subject to GDPR, HIPAA, SOC 2, ISO 27001, PCI-DSS, or internal policy frameworks, the status quo looks like this:

- A small team of compliance analysts manually reads documents, policies, and audit trails.
- They cross-reference these against regulatory frameworks line-by-line.
- They produce spreadsheets of gaps, risks, and remediation steps.
- This process takes weeks per audit cycle and costs enormous man-hours.
- Findings are stale the moment a codebase or policy document changes.
- There is no continuous compliance — only periodic, expensive audits.

The result: companies are always playing catch-up. Violations are discovered late, remediation is rushed, and the same gaps appear audit after audit because there is no intelligent system that watches for drift.

**ComplianceAutopilot solves this.** It is a continuous, AI-powered compliance engine that watches your documents and code, understands regulatory requirements, identifies gaps in real time, and generates actionable remediation steps — without a human analyst in the loop for every finding.

---

## 2. The Solution

ComplianceAutopilot is a web application that:

1. Accepts uploaded documents (policies, contracts, audit logs, codebases) or connects to a repository.
2. Lets users select or upload a compliance framework (GDPR articles, HIPAA safeguards, SOC 2 criteria, custom policy checklists).
3. Runs an AI analysis pipeline that maps document content against framework requirements.
4. Produces a structured compliance report with: a pass/fail status per requirement, a confidence score, the exact evidence (or lack thereof) from the document, and a remediation suggestion.
5. Stores findings in a persistent database so teams can track compliance posture over time.
6. Lets users chat with the compliance AI to ask follow-up questions about specific findings.

---

## 3. Target Users

### Primary: Compliance Analyst / CISO
- Needs to produce audit-ready evidence quickly.
- Wants to reduce manual document review from days to minutes.
- Wants a clear view of what passes, what fails, and what needs work.

### Secondary: Engineering Team Lead
- Needs to understand whether code changes break compliance posture.
- Wants to run a compliance check before shipping a feature.
- Wants to see specific lines or sections flagged, not vague warnings.

### Secondary: Startup Founder / Head of Operations
- Has no dedicated compliance team.
- Needs to become SOC 2 or GDPR compliant for enterprise sales.
- Has no idea what is missing or where to start.

---

## 4. Core Concepts and Terminology

### Framework
A structured set of compliance requirements organized into controls or articles. Examples: GDPR (99 articles), HIPAA (Administrative, Physical, Technical Safeguards), SOC 2 (Trust Service Criteria), PCI-DSS, ISO 27001. Each control has an ID, a description, and often a severity level.

### Evidence Document
Any file a user uploads or connects that contains information relevant to a compliance assessment. This can be a privacy policy PDF, a data retention policy Word doc, a security audit log, a terms of service page, a codebase, a configuration file, or a vendor contract.

### Control
A single requirement within a framework. For example, GDPR Article 17 is the right to erasure. A control has a pass/fail status after analysis.

### Finding
The result of mapping a specific control against the available evidence. A finding contains:
- Which control it relates to.
- Status: Pass, Fail, Partial, or Insufficient Evidence.
- Confidence score (0–100).
- The supporting evidence chunk (quoted text or code snippet).
- A remediation suggestion if status is not Pass.

### Compliance Report
A full collection of findings across all controls for a given set of documents. Reports are versioned and timestamped.

### Remediation Plan
An auto-generated artifact listing all failing or partial controls with specific, actionable steps to fix them. Think of it as a to-do list that a junior engineer or compliance officer can execute.

---

## 5. Feature Specifications

### Feature 1: Document Ingestion

**What it does:**
Users upload one or more documents to analyze. The system accepts PDFs, plain text files, Markdown files, Word documents, and code files. It also accepts a GitHub repository URL for code-level compliance checks.

**Detailed behavior:**
- File upload UI accepts drag-and-drop and file picker.
- Accepts: `.pdf`, `.txt`, `.md`, `.docx`, `.py`, `.js`, `.ts`, `.json`, `.yaml`, `.env.example`, `.html`.
- Maximum file size: 10 MB per file for MVP.
- Multiple files can be uploaded in a single session.
- Files are stored in Supabase Storage (or as base64 blobs in the database for MVP).
- Each uploaded file is given a unique ID and tagged with its MIME type and original filename.
- Files are parsed immediately on upload:
  - PDFs: text extracted page by page using `pdfplumber`.
  - DOCX: text extracted using `python-docx`.
  - Code files: stored as plain text with language tag inferred from extension.
  - Plain text and Markdown: stored as-is.
- Extracted text is chunked into overlapping segments of ~500 tokens with ~100 token overlap.
- Chunks are embedded using the IBM Watson / OpenAI-compatible embedding API and stored in Supabase with `pgvector`.
- Users see a file list panel showing upload status: Uploading → Parsing → Indexed → Ready.
- Users can remove files from a session before running analysis.

**API surface:**
- `POST /api/documents` — upload a file, trigger parsing and indexing pipeline.
- `GET /api/documents` — list all documents in the current session.
- `DELETE /api/documents/{doc_id}` — remove a document.
- `GET /api/documents/{doc_id}/status` — check indexing status.

---

### Feature 2: Framework Selection

**What it does:**
Users choose which compliance framework to analyze against. For MVP, we ship with 3 built-in frameworks and allow users to upload a custom checklist.

**Built-in frameworks for MVP:**
1. **GDPR Essentials** — 20 key articles mapped to plain-English controls (Article 5 data minimization, Article 13 transparency, Article 17 right to erasure, Article 25 privacy by design, Article 30 records of processing, Article 32 security of processing, Article 33 breach notification, Article 35 DPIA, etc.)
2. **SOC 2 Type II Trust Service Criteria** — the 5 TSCs broken into ~40 controls covering availability, security, confidentiality, processing integrity, and privacy.
3. **HIPAA Security Rule Safeguards** — Administrative, Physical, and Technical Safeguards broken into ~30 required and addressable specifications.

**Custom framework upload:**
- Users upload a `.csv` or `.json` file describing their own framework.
- CSV format: columns `control_id`, `control_name`, `description`, `severity` (Critical / High / Medium / Low).
- JSON format: array of control objects with the same fields.
- System validates the file and loads it as a named framework for the session.

**UI behavior:**
- Framework picker shows cards for each built-in option with a short description and icon.
- Clicking a card selects it and shows a preview of its controls in a collapsible list.
- "Upload Custom" button opens a file picker.
- Users can select only one framework per analysis run (multi-framework is a post-MVP feature).

**API surface:**
- `GET /api/frameworks` — list all available frameworks (built-in + user-uploaded).
- `POST /api/frameworks` — upload and validate a custom framework.
- `GET /api/frameworks/{framework_id}/controls` — return all controls in a framework with IDs and descriptions.

---

### Feature 3: Compliance Analysis Engine

**What it does:**
The core AI pipeline. Takes the indexed document chunks and maps them against each control in the selected framework. Produces a finding for every control.

**Detailed behavior:**

**Step 1: Retrieval**
For each control, perform a semantic similarity search against the pgvector index to retrieve the top 5 most relevant document chunks. This gives the AI the best available evidence for that control.

**Step 2: Classification**
For each control, send a structured prompt to the AI model with:
- The control ID, name, and full description.
- The top-k retrieved chunks (with source file and page/line references).
- Instructions to classify the control as: Pass, Fail, Partial, or Insufficient Evidence.
- Instructions to provide a confidence score 0–100.
- Instructions to quote the specific evidence passage if status is Pass or Partial.
- Instructions to explain why the requirement is not met if status is Fail.
- Instructions to provide a concrete, single-paragraph remediation step if status is Fail or Partial.

**Step 3: Structured Output**
The model returns a JSON object per control:
```json
{
  "control_id": "GDPR-Art-17",
  "status": "Partial",
  "confidence": 72,
  "evidence": "Section 4.3 of the privacy policy states: 'Users may request deletion of their account by contacting support@example.com.' However, no SLA for deletion response time is specified and no automated deletion mechanism is documented.",
  "gap": "Missing: defined response SLA, automated data deletion process, and documentation of what data is retained post-deletion for legal obligations.",
  "remediation": "Add a Data Deletion SLA section to the privacy policy committing to a 30-day response window. Document which data categories are retained post-deletion and the legal basis for retention. Implement or reference an automated account deletion workflow in the data handling documentation."
}
```

**Step 4: Persistence**
All findings are saved to the database tied to a `report_id` for the current analysis run. This allows retrieving historical reports and comparing compliance posture over time.

**Step 5: Summary Generation**
After all controls are processed, generate a top-level summary:
- Total controls analyzed.
- Pass count, Fail count, Partial count, Insufficient Evidence count.
- Overall compliance score: `(Pass + 0.5 * Partial) / Total * 100`.
- Top 3 most critical gaps (sorted by severity of the control + Fail/Partial status).
- One-paragraph executive summary suitable for a CISO or board presentation.

**Processing model:**
- Analysis runs asynchronously in the background after the user clicks "Run Analysis."
- Frontend polls the analysis status endpoint and updates a progress bar per control as findings come in.
- Controls are processed in parallel batches of 5 to respect rate limits.
- Each control analysis is independently retried on failure before being marked as error.

**API surface:**
- `POST /api/reports` — start a new analysis run (accepts `session_id`, `framework_id`, list of `document_ids`).
- `GET /api/reports/{report_id}/status` — return progress (controls completed / total, current control being analyzed).
- `GET /api/reports/{report_id}` — return the full completed report with all findings.
- `GET /api/reports/{report_id}/summary` — return just the summary object.
- `GET /api/reports` — list all historical reports for the user.

---

### Feature 4: Compliance Report Dashboard

**What it does:**
The primary output surface of the application. A rich, scannable report UI that shows every finding, lets users filter and sort, and gives a clear top-level compliance score.

**Dashboard sections:**

**Header bar:**
- Report name (editable).
- Framework name and version.
- Analysis timestamp.
- Overall compliance score displayed as a large percentage with a colored ring (green above 80%, amber 50–79%, red below 50%).
- "Download Report" button (PDF export).
- "Share" button (generates a shareable link — post-MVP).

**Summary cards row:**
- Four cards: Pass count (green), Partial count (amber), Fail count (red), Insufficient Evidence count (gray).
- Clicking a card filters the findings list below to that status.

**Findings table:**
- One row per control.
- Columns: Control ID, Control Name, Severity (color-coded badge: Critical / High / Medium / Low), Status (color-coded badge), Confidence (percentage bar), Actions.
- Sortable by each column.
- Filterable by status, severity, and keyword search over control name.
- Clicking a row expands it into a detail panel showing:
  - Full control description.
  - Evidence text (quoted, with source file and page reference).
  - Gap explanation (if Fail or Partial).
  - Remediation suggestion (if Fail or Partial).
  - "Add to Remediation Plan" button.
  - "Ask AI" button (opens the chat panel pre-populated with a question about this control).

**Severity distribution chart:**
- Horizontal stacked bar chart showing Pass/Partial/Fail breakdown per severity tier.
- Built with Recharts or Chart.js.

**Top gaps panel:**
- Sidebar showing the top 5 most critical failing controls.
- Each gap shows: control ID, short description, status, one-line remediation preview.

**API surface:**
- Feeds off `GET /api/reports/{report_id}` and `GET /api/reports/{report_id}/summary`.

---

### Feature 5: Remediation Plan Generator

**What it does:**
Takes all Fail and Partial findings and generates a structured, prioritized remediation plan as a document users can download, share, or export to task trackers.

**Detailed behavior:**
- "Generate Remediation Plan" button appears on the report dashboard once analysis is complete.
- The plan groups remediation steps by:
  - Severity (Critical items first).
  - Theme (e.g., all data retention issues together, all access control issues together — grouped by AI using semantic clustering).
- Each item in the plan contains:
  - Control ID and name.
  - Current status (Fail / Partial).
  - Severity badge.
  - Full remediation text from the finding.
  - Estimated effort tag: Quick Win (< 1 day), Medium (1–5 days), Complex (5+ days) — assigned by AI based on remediation text.
  - Owner field (user can fill in manually).
  - Status field: To Do / In Progress / Done (user can update).
- The plan is persisted in the database and linked to the report.
- Users can mark items as Done and track remediation progress.
- Remediation plan can be exported as:
  - PDF document.
  - CSV (for import into Jira, Linear, Asana, etc.).
  - Markdown (for GitHub Issues).

**API surface:**
- `POST /api/reports/{report_id}/remediation-plan` — generate and persist the plan.
- `GET /api/reports/{report_id}/remediation-plan` — retrieve the plan.
- `PATCH /api/remediation-items/{item_id}` — update owner, status, or notes on an item.
- `GET /api/reports/{report_id}/remediation-plan/export` — export as PDF or CSV.

---

### Feature 6: AI Compliance Chat

**What it does:**
A conversational interface that lets users ask follow-up questions about their compliance report, specific controls, or general regulatory questions, with full context of their uploaded documents.

**Detailed behavior:**
- Chat panel is always visible in the right sidebar of the report view.
- Chat is document-aware: the AI can retrieve chunks from the indexed documents to answer questions.
- Chat is report-aware: the AI has access to all findings in the current report.
- Users can ask things like:
  - "Why did Article 30 fail?"
  - "What do I need to do to achieve full GDPR compliance?"
  - "Is there any mention of encryption in our policy documents?"
  - "Which findings should I fix first if I have limited time?"
  - "Summarize the three most critical gaps in plain English for my CEO."
  - "Draft a data retention policy section that would satisfy GDPR Article 5(1)(e)."
- Responses stream in real time (SSE or WebSocket).
- Each message from the AI cites the specific document and section it drew evidence from.
- Users can click a citation to highlight the relevant chunk in the document viewer (post-MVP).
- Chat history is persisted per report session.
- "Ask AI about this control" button on each finding row pre-populates the chat with the control context.

**System prompt strategy:**
The AI is given:
- The full framework control list (condensed).
- All findings for the current report (structured JSON).
- Retrieved chunks from the indexed documents relevant to the user's question.
- Role instruction: "You are a senior compliance officer and regulatory attorney. You are helping a team understand and fix their compliance gaps. Be specific, cite evidence, and provide actionable next steps."

**API surface:**
- `POST /api/sessions/{session_id}/chat` — send a message, stream back response.
- `GET /api/sessions/{session_id}/messages` — retrieve full chat history.

---

### Feature 7: Document Viewer

**What it does:**
Lets users view the original uploaded documents alongside their compliance findings, so they can understand exactly where the evidence came from.

**Detailed behavior:**
- Split view: findings on the left, document text on the right.
- When a finding is expanded, clicking "View in Document" scrolls the document viewer to the relevant section and highlights the evidence chunk.
- Document viewer supports:
  - Rendered text with line numbers for code files.
  - Paginated text for PDFs.
  - Section-collapsed view for long documents.
- Search within document (Ctrl+F style).

**For MVP:** A simple text display panel is sufficient. Full document rendering (PDF viewer, syntax highlighting) is a polish item.

---

### Feature 8: Session and Report History

**What it does:**
Lets users return to previous analysis runs, compare compliance posture over time, and track remediation progress.

**Detailed behavior:**
- Dashboard home page shows a list of past sessions.
- Each session shows: documents analyzed, framework used, overall score, date.
- Users can open any past report.
- Comparison view (post-MVP): side-by-side score delta between two reports.
- Sessions belong to a user account (authenticated via Supabase Auth).

**API surface:**
- `GET /api/sessions` — list all sessions for the authenticated user.
- `POST /api/sessions` — create a new session.
- `GET /api/sessions/{session_id}` — get session details including linked documents, frameworks, and reports.

---

### Feature 9: Export and Sharing

**What it does:**
Lets users get their compliance report out of the tool and into other systems.

**Export formats:**
- **PDF Report:** A polished, formatted compliance report with cover page, summary, findings table, and remediation plan. Generated server-side using `weasyprint` or `reportlab`.
- **CSV:** Raw findings table as a spreadsheet-importable format.
- **Markdown:** Formatted findings as a Markdown document suitable for a GitHub repo wiki or Notion page.
- **JSON:** Raw findings JSON for integration with other tools or custom scripts.

**Sharing (post-MVP):**
- Generate a shareable read-only link to a report.
- Link recipient sees a read-only version of the report dashboard (no document upload access).

**API surface:**
- `GET /api/reports/{report_id}/export?format=pdf|csv|md|json` — stream the export file.

---

## 6. Data Models

### User
```
id: UUID (primary key)
email: string
created_at: timestamp
```

### Session
```
id: UUID (primary key)
user_id: UUID (foreign key)
name: string
created_at: timestamp
updated_at: timestamp
```

### Document
```
id: UUID (primary key)
session_id: UUID (foreign key)
filename: string
file_type: enum (pdf, docx, txt, md, code)
storage_path: string
parsed_text: text
chunk_count: integer
indexing_status: enum (uploading, parsing, indexing, ready, error)
created_at: timestamp
```

### DocumentChunk
```
id: UUID (primary key)
document_id: UUID (foreign key)
chunk_index: integer
text: text
token_count: integer
embedding: vector(1536)
metadata: jsonb (page number, line range, section heading)
```

### Framework
```
id: UUID (primary key)
name: string
version: string
description: text
is_builtin: boolean
created_by: UUID (null for built-ins)
created_at: timestamp
```

### Control
```
id: UUID (primary key)
framework_id: UUID (foreign key)
control_id: string (e.g., "GDPR-Art-17")
name: string
description: text
severity: enum (critical, high, medium, low)
category: string (optional grouping)
```

### Report
```
id: UUID (primary key)
session_id: UUID (foreign key)
framework_id: UUID (foreign key)
status: enum (running, complete, error)
overall_score: float
pass_count: integer
fail_count: integer
partial_count: integer
insufficient_count: integer
executive_summary: text
created_at: timestamp
completed_at: timestamp
```

### Finding
```
id: UUID (primary key)
report_id: UUID (foreign key)
control_id: UUID (foreign key)
status: enum (pass, fail, partial, insufficient_evidence)
confidence: integer (0-100)
evidence: text
gap_explanation: text
remediation: text
chunk_ids: UUID[] (source chunks used as evidence)
created_at: timestamp
```

### RemediationPlan
```
id: UUID (primary key)
report_id: UUID (foreign key)
created_at: timestamp
```

### RemediationItem
```
id: UUID (primary key)
plan_id: UUID (foreign key)
finding_id: UUID (foreign key)
priority_order: integer
effort_estimate: enum (quick_win, medium, complex)
owner: string (nullable)
status: enum (todo, in_progress, done)
notes: text
```

### ChatMessage
```
id: UUID (primary key)
session_id: UUID (foreign key)
role: enum (user, assistant)
content: text
citations: jsonb (array of chunk IDs and source references)
created_at: timestamp
```

---

## 7. Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for bundling
- **Tailwind CSS** for styling
- **Zustand** for global state management
- **React Query (TanStack Query)** for data fetching and caching
- **Recharts** for compliance score charts and severity breakdowns
- **React Dropzone** for file upload
- **Lucide React** for icons
- **React Hot Toast** for notifications

### Backend
- **Python 3.12+**
- **FastAPI** for the API layer
- **Pydantic v2** for request/response validation
- **SQLAlchemy 2.0** (async) for ORM
- **Alembic** for database migrations
- **asyncio + httpx** for async HTTP and model calls
- **pdfplumber** for PDF text extraction
- **python-docx** for Word document parsing
- **tree-sitter** for code file parsing (optional for MVP, nice to have)
- **tiktoken** for token counting and chunking
- **numpy** for embedding operations
- **Celery + Redis** OR **asyncio background tasks** for async analysis jobs (use FastAPI BackgroundTasks for MVP simplicity)

### Database and Storage
- **Supabase Postgres** as primary database
- **pgvector** extension for embedding storage and similarity search
- **Supabase Storage** for raw uploaded file blobs
- **Supabase Auth** for user authentication (email/password or magic link)

### AI / Models
- **IBM Watson AI / Claude / OpenAI-compatible** for compliance classification and chat (abstract behind an adapter so the model can be swapped)
- **Embedding model:** `text-embedding-3-small` or IBM Watson equivalent for chunk embeddings
- **Chat model:** `claude-sonnet-4-20250514` or IBM model for compliance analysis and chat

### Infrastructure
- **Local development:** `uvicorn` for backend, `vite dev` for frontend
- **No containerization needed for hackathon** — run both processes directly
- **Environment variables** via `.env` files

---

## 8. System Architecture

```
┌──────────────────────────────────────────────────────┐
│                    React Frontend                    │
│   Upload Panel | Report Dashboard | Chat | History  │
└────────────────────────┬─────────────────────────────┘
                         │ HTTP + SSE
┌────────────────────────▼─────────────────────────────┐
│                   FastAPI Backend                    │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Documents  │  │   Analysis   │  │    Chat     │ │
│  │   Service   │  │   Service    │  │   Service   │ │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                │                 │        │
│  ┌──────▼──────┐  ┌──────▼───────┐         │        │
│  │  Indexing   │  │  Retrieval   │         │        │
│  │  Service    │  │  Service     │◄────────┘        │
│  └──────┬──────┘  └──────┬───────┘                  │
└─────────┼────────────────┼───────────────────────────┘
          │                │
┌─────────▼────────────────▼───────────────────────────┐
│              Supabase                                │
│  ┌──────────────┐  ┌───────────┐  ┌───────────────┐ │
│  │   Postgres   │  │ pgvector  │  │    Storage    │ │
│  │  (all tables)│  │(embeddings│  │  (raw files)  │ │
│  └──────────────┘  └───────────┘  └───────────────┘ │
└──────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────┐
│              AI Model Layer (adapter)                │
│   IBM Watson / Claude / OpenAI-compatible endpoint   │
└──────────────────────────────────────────────────────┘
```

### Backend Module Structure

```
backend/
  app/
    main.py                  # FastAPI app entry point
    config.py                # Environment config via pydantic-settings
    api/
      documents.py           # Document upload and management routes
      frameworks.py          # Framework listing and upload routes
      reports.py             # Analysis report routes
      sessions.py            # Session management routes
      chat.py                # Chat routes with streaming
      remediation.py         # Remediation plan routes
      export.py              # Export routes
    services/
      indexing.py            # File parsing, chunking, embedding pipeline
      retrieval.py           # pgvector similarity search
      analysis.py            # Core compliance analysis engine
      chat.py                # Chat prompt assembly and model call
      remediation.py         # Remediation plan generation
      export.py              # Report export to PDF, CSV, MD, JSON
    models/
      db.py                  # SQLAlchemy ORM models
    schemas/
      documents.py           # Pydantic request/response schemas
      reports.py
      chat.py
      frameworks.py
    db/
      connection.py          # Async database connection and session
      migrations/            # Alembic migration files
    adapters/
      model_adapter.py       # Abstract AI model interface
      ibm_adapter.py         # IBM Watson implementation
      openai_adapter.py      # OpenAI-compatible fallback
    data/
      frameworks/
        gdpr.json            # Built-in GDPR control definitions
        soc2.json            # Built-in SOC 2 control definitions
        hipaa.json           # Built-in HIPAA control definitions
    utils/
      chunking.py            # Text chunking utilities
      token_counter.py       # Token counting helpers
      file_parser.py         # MIME-type routing for file parsing
```

### Frontend Module Structure

```
apps/web/
  src/
    components/
      ui/                    # Shared UI primitives (Button, Badge, Card, etc.)
      layout/
        AppShell.tsx         # Main layout wrapper
        Sidebar.tsx          # Left nav
        ChatPanel.tsx        # Right chat drawer
      documents/
        DocumentUpload.tsx   # Drag-and-drop upload area
        DocumentList.tsx     # Uploaded files list with status
      frameworks/
        FrameworkPicker.tsx  # Framework selection cards
        ControlPreview.tsx   # Collapsible control list
      reports/
        ReportDashboard.tsx  # Main report view
        SummaryCards.tsx     # Pass/Fail/Partial/Insufficient cards
        FindingsTable.tsx    # Sortable/filterable findings table
        FindingDetail.tsx    # Expanded finding with evidence and remediation
        ScoreRing.tsx        # Circular compliance score visualization
        SeverityChart.tsx    # Stacked bar chart
        TopGaps.tsx          # Top 5 critical gaps sidebar
      remediation/
        RemediationPlan.tsx  # Full remediation plan view
        RemediationItem.tsx  # Single item with owner/status controls
      chat/
        ChatInput.tsx        # Message input bar
        ChatMessage.tsx      # Single message with citations
        ChatHistory.tsx      # Scrollable message list
    pages/
      Home.tsx               # Session list / landing page
      NewSession.tsx         # Upload + framework selection
      ReportView.tsx         # Full report + chat view
      RemediationView.tsx    # Remediation plan view
    store/
      sessionStore.ts        # Zustand: active session state
      reportStore.ts         # Zustand: active report and findings
      chatStore.ts           # Zustand: chat history
      documentStore.ts       # Zustand: uploaded documents
    hooks/
      useReport.ts           # React Query hooks for report data
      useDocuments.ts        # React Query hooks for document ops
      useChat.ts             # SSE streaming hook for chat
      useAnalysis.ts         # Polling hook for analysis progress
    lib/
      api.ts                 # Axios/fetch API client
      supabase.ts            # Supabase client
      constants.ts           # App-wide constants
    App.tsx
    main.tsx
```

---

## 9. API Contract Reference

### Documents

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/documents` | Upload a file. Multipart form. Returns `document_id`. |
| GET | `/api/documents` | List documents. Query: `session_id`. |
| GET | `/api/documents/{id}` | Get document metadata and status. |
| GET | `/api/documents/{id}/status` | Polling endpoint for indexing status. |
| DELETE | `/api/documents/{id}` | Remove a document and its chunks. |

### Frameworks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/frameworks` | List all frameworks (built-in + user uploaded). |
| POST | `/api/frameworks` | Upload custom framework (CSV or JSON). |
| GET | `/api/frameworks/{id}/controls` | List all controls in a framework. |

### Sessions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sessions` | List sessions for the authenticated user. |
| POST | `/api/sessions` | Create a new session. |
| GET | `/api/sessions/{id}` | Get session details. |

### Reports

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/reports` | Start a new analysis run. Body: `session_id`, `framework_id`, `document_ids`. |
| GET | `/api/reports/{id}` | Get complete report with all findings. |
| GET | `/api/reports/{id}/status` | Polling endpoint for analysis progress. |
| GET | `/api/reports/{id}/summary` | Get just the summary object. |
| GET | `/api/reports` | List all reports for the session. Query: `session_id`. |
| GET | `/api/reports/{id}/export` | Export report. Query: `format=pdf\|csv\|md\|json`. |

### Remediation

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/reports/{id}/remediation-plan` | Generate and persist a remediation plan. |
| GET | `/api/reports/{id}/remediation-plan` | Get the remediation plan with all items. |
| PATCH | `/api/remediation-items/{id}` | Update item owner, status, notes. |

### Chat

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sessions/{id}/chat` | Send a message. Response is SSE stream. |
| GET | `/api/sessions/{id}/messages` | Get full chat history. |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Returns `{"status": "ok"}`. |

---

## 10. Prompt Engineering

### Control Analysis Prompt

```
You are a senior compliance officer and regulatory attorney with deep expertise in {framework_name}.

You will evaluate whether the following compliance control is satisfied based on the provided evidence documents.

CONTROL:
ID: {control_id}
Name: {control_name}
Description: {control_description}
Severity: {severity}

EVIDENCE FROM DOCUMENTS:
{top_k_chunks_formatted_with_source_references}

INSTRUCTIONS:
1. Determine the status of this control based ONLY on the evidence provided.
   Status must be one of:
   - "pass": The control is clearly and fully satisfied by the evidence.
   - "partial": The control is partially satisfied. Some requirements are met but gaps exist.
   - "fail": The control is not satisfied. Required elements are missing or contradicted.
   - "insufficient_evidence": There is not enough evidence in the provided documents to make a determination.

2. Assign a confidence score 0-100 reflecting how certain you are of your determination.

3. If status is "pass" or "partial": quote the specific passage that provides evidence, including the source document and page/section reference.

4. If status is "fail" or "partial": describe specifically what is missing or inadequate.

5. If status is "fail" or "partial": provide a single concrete paragraph describing what action would fix this gap.

Return your response ONLY as valid JSON matching this schema, with no additional text:
{
  "control_id": string,
  "status": "pass" | "partial" | "fail" | "insufficient_evidence",
  "confidence": integer,
  "evidence": string | null,
  "gap": string | null,
  "remediation": string | null
}
```

### Executive Summary Prompt

```
You are a senior compliance officer preparing a brief for a CISO or board.

Here is the compliance analysis result:
- Framework: {framework_name}
- Total controls analyzed: {total}
- Pass: {pass_count} | Partial: {partial_count} | Fail: {fail_count} | Insufficient Evidence: {insufficient_count}
- Overall compliance score: {score}%

Top failing controls (by severity):
{top_failing_controls}

Write a 3-4 sentence executive summary in plain, non-technical English that:
1. States the overall compliance posture.
2. Names the 2-3 most critical gaps without jargon.
3. States the key next step.

Return only the summary text with no markdown formatting.
```

### Chat System Prompt

```
You are a senior compliance officer and regulatory attorney helping a team understand and improve their compliance posture.

CURRENT FRAMEWORK: {framework_name}
CURRENT REPORT SUMMARY: {report_summary_json}

You have access to the following evidence documents (indexed and retrievable):
{document_list}

When answering:
- Be specific and cite exact sections from the documents or findings.
- If the user asks about a specific control, refer to its finding status and evidence.
- If drafting policy language, make it practical and production-ready.
- If asked about priority, sort by severity (Critical first) then by ease of fix.
- Always be actionable. Do not give vague guidance.
- When citing a document passage, format it as: [DocumentName, Page X / Line Y] "quoted text"
```

---

## 11. Built-in Framework Data Structure

Each built-in framework is stored as a JSON file in `backend/app/data/frameworks/`.

Example for GDPR (abbreviated):

```json
{
  "id": "gdpr-essentials-v1",
  "name": "GDPR Essentials",
  "version": "1.0",
  "description": "Key GDPR articles mapped to practical compliance controls for data controllers.",
  "controls": [
    {
      "control_id": "GDPR-Art-5",
      "name": "Principles of Personal Data Processing",
      "description": "Personal data must be processed lawfully, fairly and transparently. Collected for specified, explicit and legitimate purposes. Adequate, relevant and limited to what is necessary. Accurate and kept up to date. Kept in identifiable form only as long as necessary. Processed with appropriate security.",
      "severity": "critical",
      "category": "Data Processing Principles"
    },
    {
      "control_id": "GDPR-Art-13",
      "name": "Information to be Provided at Collection",
      "description": "At the time of data collection, the controller must provide: identity of controller, contact details, purposes and legal basis of processing, legitimate interests if applicable, recipients of data, intention to transfer to third countries, retention period, data subject rights, right to withdraw consent, right to lodge a complaint, whether provision is statutory requirement, and existence of automated decision-making.",
      "severity": "high",
      "category": "Transparency"
    },
    {
      "control_id": "GDPR-Art-17",
      "name": "Right to Erasure (Right to be Forgotten)",
      "description": "Data subjects have the right to request erasure of personal data. Controller must erase data without undue delay when: data is no longer necessary, consent is withdrawn, data subject objects, data has been unlawfully processed, erasure required for legal compliance. Controller must inform third parties of erasure request. Process and timeline must be documented.",
      "severity": "high",
      "category": "Data Subject Rights"
    }
  ]
}
```

---

## 12. MVP Scope Definition

### P0 — Must ship

These are the features that make ComplianceAutopilot a demonstrable, differentiated product:

1. Document upload and parsing pipeline (PDF, TXT, MD for MVP).
2. Framework selection with all three built-in frameworks loaded.
3. Compliance analysis engine: retrieval + AI classification + finding persistence.
4. Report dashboard: summary cards, findings table, expanded finding detail.
5. Compliance score display.
6. AI chat panel with document-aware responses.
7. Supabase Auth (email/password login).
8. Session and report persistence.

### P1 — Ship if time allows

1. Remediation plan generator and tracker.
2. PDF export of compliance report.
3. Custom framework upload (CSV/JSON).
4. Document status polling UI with progress bar per file.
5. Analysis progress bar (per-control live updates).
6. Code file upload and analysis support.

### Deferred — Post-hackathon

1. GitHub repository connector.
2. Continuous monitoring (scheduled re-analysis on document change).
3. Multi-framework comparison.
4. Shareable report links.
5. DOCX upload support.
6. Jira/Linear integration for remediation items.
7. Audit trail and change history.
8. Team collaboration features.
9. Slack notifications for new findings.
10. SOC 2 automated evidence collection from cloud providers.

---

## 13. Team Split and Branch Strategy

This project is built by two developers working in parallel. The repo has a `main` branch, a `dev` branch, and two feature branches. All work happens in feature branches and merges into `dev` at integration points. Final merge to `main` before demo.

### Repository Setup

```
main           ← stable, demo-ready
dev            ← integration branch
feature/dev-a  ← Developer A's branch
feature/dev-b  ← Developer B's branch
```

### Developer A — Backend and AI Engine

Developer A owns all Python backend work. This is the critical path because nothing in the frontend works without the API.

**Primary responsibilities:**
- FastAPI app scaffold and project setup.
- Database models and Alembic migrations.
- Supabase connection and pgvector setup.
- Document ingestion service (upload, parse, chunk, embed).
- Retrieval service (pgvector similarity search).
- Compliance analysis engine (control-by-control AI pipeline).
- Chat service (prompt assembly, streaming response).
- Remediation plan generator.
- Export service (PDF, CSV, JSON).
- All API routes and request/response schemas.
- Built-in framework JSON files.
- `.env.example` and README for backend setup.

**Suggested build order for Developer A:**
1. Project scaffold + Supabase setup + health check.
2. DB models + migrations + pgvector enabled.
3. Document upload route + file parser + chunker + embedder.
4. Retrieval service.
5. Framework loader (built-in JSON files).
6. Analysis engine (control loop, prompt, finding persistence).
7. Report routes (start, status, full report, summary).
8. Chat route with streaming.
9. Session and auth wiring.
10. Remediation plan + export (P1).

### Developer B — Frontend and UX

Developer B owns the React frontend. This is the demo layer — what judges see. Make it look impressive.

**Primary responsibilities:**
- Vite + React + TypeScript + Tailwind project scaffold.
- App shell layout: sidebar, main content, right chat panel.
- Document upload UI (drag-and-drop, file list, status indicators).
- Framework picker (cards, control preview).
- New session flow (upload → select framework → analyze).
- Report dashboard (summary cards, findings table, expanded finding, score ring, severity chart).
- Analysis progress UI (polling, per-control progress).
- Chat panel (input, streaming messages, citations).
- Session history / home page.
- Zustand stores and React Query hooks wired to backend API.
- Loading states, empty states, error states.
- Toast notifications.
- Remediation plan UI (P1).

**Suggested build order for Developer B:**
1. Vite scaffold + Tailwind + Zustand + React Query setup.
2. App shell with layout and routing.
3. Document upload component.
4. Framework picker component.
5. New session page wiring upload + framework + trigger analysis.
6. Analysis progress polling UI.
7. Report dashboard with summary cards and findings table.
8. Expanded finding detail with evidence and remediation.
9. Score ring and severity chart.
10. Chat panel with streaming.
11. Session history / home page.
12. Remediation plan view (P1).

### Integration Points

Developers should sync at these milestones:
1. **After scaffold:** Both can start immediately once monorepo structure is agreed.
2. **After `/api/health` + `/api/documents`:** Developer B can build upload UI against real API.
3. **After analysis engine:** Developer B can build the full report dashboard.
4. **Before demo:** Full merge to `dev`, integration test, fix broken wiring, merge to `main`.

### API Contract First

Developer A should prioritize getting mock API responses working (even with hardcoded data) as early as possible so Developer B can build UI against real endpoints without waiting for full backend completion. FastAPI makes this trivial — return a hardcoded response object from any route in seconds.

---

## 14. Environment Configuration

### Backend `.env`
```
DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=[KEY]
SUPABASE_SERVICE_ROLE_KEY=[KEY]
AI_MODEL_API_KEY=[IBM_WATSON_OR_OPENAI_KEY]
AI_MODEL_BASE_URL=[IBM_WATSON_BASE_URL_OR_OPENAI]
AI_MODEL_NAME=claude-sonnet-4-20250514
EMBEDDING_MODEL_NAME=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
MAX_CHUNK_TOKENS=500
CHUNK_OVERLAP_TOKENS=100
RETRIEVAL_TOP_K=5
CORS_ORIGINS=http://localhost:5173
```

### Frontend `.env`
```
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://[PROJECT].supabase.co
VITE_SUPABASE_ANON_KEY=[KEY]
```

---

## 15. Demo Script (Happy Path)

This is the 4-minute walkthrough you run for judges. Practice it until it is muscle memory.

**Scene 1: The Problem (30 seconds)**
"A company needs to demonstrate GDPR compliance before a major enterprise deal closes. Their compliance team would normally spend two weeks manually reviewing their privacy policy, data processing documentation, and security procedures. With ComplianceAutopilot, we can do this in under two minutes."

**Scene 2: Upload Documents (45 seconds)**
- Open ComplianceAutopilot. Show the clean, professional UI.
- Drag and drop three pre-prepared files: `privacy-policy.pdf`, `data-processing-agreement.md`, `security-procedures.txt`.
- Watch the status badges change: Uploading → Parsing → Indexed → Ready.
- "The system has parsed, chunked, and indexed all three documents. It now understands the content semantically."

**Scene 3: Select Framework (20 seconds)**
- Click "GDPR Essentials" framework card.
- Show the control preview expanding to show the 20 controls.
- Click "Run Analysis."

**Scene 4: Watch Analysis (30 seconds)**
- Show the progress bar moving through controls.
- "The AI is now mapping every control in the GDPR framework against our documents, retrieving the most relevant sections for each requirement, and making a compliance determination with evidence."

**Scene 5: The Report (90 seconds)**
- Analysis complete. Show the score ring: e.g., 64% compliance.
- Walk through the summary cards: 11 Pass, 4 Partial, 5 Fail.
- Open the findings table. Sort by severity — show a Critical failing control.
- Click to expand: show the evidence quote (exact text from their uploaded document), the gap explanation, and the remediation suggestion.
- "In 30 seconds, I now know exactly why Article 17 is failing, where in the document the issue is, and what text I need to add to fix it."

**Scene 6: Chat (45 seconds)**
- Type in the chat: "Which gap should I fix first to unblock our enterprise deal?"
- Show the AI streaming back a specific, prioritized answer with document citations.
- Type: "Draft the missing data deletion SLA clause for our privacy policy."
- Show production-ready legal language appear in seconds.

**Scene 7: Remediation Plan (20 seconds)**
- Click "Generate Remediation Plan."
- Show the plan sorted by severity with effort estimates.
- "Every failing control now has an owner field and a Done checkbox. This becomes the team's compliance sprint backlog."

---

## 16. Pre-Seeded Demo Data

To guarantee a smooth demo, prepare these assets in advance and commit them to the repo under `demo/`:

- `demo/privacy-policy.pdf` — A realistic but intentionally incomplete privacy policy document. Should pass ~50% of GDPR controls and fail key ones like Article 17 (no deletion SLA), Article 30 (no records of processing), Article 35 (no DPIA mention).
- `demo/data-processing-agreement.md` — A partial DPA. Should provide some evidence for Article 28 controls.
- `demo/security-procedures.txt` — A simple internal security policy. Should satisfy some SOC 2 security TSC controls.
- `demo/seed_report.json` — A pre-generated analysis result that can be loaded as a fallback if the live analysis fails during the demo.

The backend should expose a `POST /api/demo/seed` endpoint in development mode that loads the demo session instantly without re-running the analysis.

---

## 17. Judging Alignment

**Theme: "Turn idea into impact faster with IBM Bob"**

ComplianceAutopilot aligns with this theme as follows:
- The idea is: our documents need to be GDPR compliant.
- The impact is: a prioritized remediation plan with specific fixes.
- IBM Bob / AI accelerates this from weeks of manual review to minutes.
- The entire analysis pipeline, chat, and remediation generation is powered by AI.

**Scoring alignment:**

| Criteria | How we score |
|---|---|
| Completeness and feasibility | Full end-to-end flow from upload to remediation plan. Real AI analysis. Real database. Real export. Clearly feasible — compliance document analysis is a well-understood AI use case. |
| Effectiveness and efficiency | Reduces a 2-week manual audit to 2 minutes. Every AI call is purposeful. The retrieval-augmented approach means findings are grounded in actual document evidence, not hallucinated. |
| Creativity and innovation | Applying RAG and structured AI analysis to compliance automation is novel in a hackathon context. The chat interface for asking compliance questions is a compelling UX differentiator. |
| Use of IBM Bob | AI model used for: document chunk classification (per-control analysis), executive summary generation, remediation suggestion generation, and conversational compliance Q&A. IBM Bob is the engine of every core feature. |

---

## 18. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI model rate limits slow analysis for 20+ controls | High | High | Process controls in batches of 5 with delay. Cache results. Have demo seed data ready. |
| pgvector setup on Supabase takes too long | Medium | High | Enable it first thing. Test with a dummy embedding before building anything else. |
| Document parsing fails on complex PDFs | Medium | Medium | Test with pdfplumber on demo docs early. Have plain text fallback (paste raw text into UI). |
| Frontend and backend branch conflict at merge | Medium | High | Agree on API contracts day one. Developer A exposes mock endpoints early. Merge incrementally, not all at once. |
| Analysis produces poor findings due to prompt issues | Medium | High | Test prompts against demo docs in isolation first using the AI API directly. Iterate prompts before wiring into the pipeline. |
| Demo environment crashes live | Low | Critical | Seed the demo report. Have a screenshot backup. Practice the flow 5+ times before the presentation. |
| Export PDF generation is slow or broken | Low | Low | PDF export is P1. Skip it if time runs out. CSV export is simpler and sufficient for demo. |

---

## 19. Definition of Done

ComplianceAutopilot MVP is done when:

1. A user can create an account and log in.
2. A user can upload at least one document and see it indexed successfully.
3. A user can select a built-in compliance framework.
4. A user can trigger an analysis and see it complete with real AI-generated findings.
5. The report dashboard shows a compliance score, summary cards, and a findings table.
6. A user can expand a finding and see the evidence, gap, and remediation suggestion.
7. A user can ask a question in the chat panel and receive a relevant, document-grounded answer.
8. All findings are persisted and retrievable on page refresh.
9. The app does not crash during the demo happy path.

---

## 20. Suggested Prompt for Codex / Cursor

### For architecture and planning:

```
We are building ComplianceAutopilot, an AI-powered compliance analysis tool.

Stack:
- FastAPI (Python 3.12+)
- React 18 + TypeScript + Vite + Tailwind CSS
- Supabase Postgres + pgvector for embeddings
- Supabase Auth for authentication
- Supabase Storage for file blobs
- IBM Watson / Claude / OpenAI-compatible AI model for analysis and chat

Current task: [paste one ticket or feature from this PRD]

Please produce:
1. A minimal implementation plan (5-10 bullet steps)
2. The specific files to create or edit with their paths
3. Any API contracts or Pydantic schemas needed
4. Key risks specific to this task
5. Hardcoded stub responses I can use for early frontend wiring

MVP only. No over-engineering. No speculative abstractions.
```

### For Cursor (implementation):

```
Implement this feature in the current codebase.

Constraints:
- Python-first backend using FastAPI and SQLAlchemy async
- React frontend with TypeScript, Tailwind, Zustand, and React Query
- Supabase for all persistence
- Keep it clean and minimal
- List every file you create or edit

Feature:
[paste the feature spec from this PRD]
```

---

*ComplianceAutopilot PRD — Hackathon MVP Edition — Last updated May 2026*
