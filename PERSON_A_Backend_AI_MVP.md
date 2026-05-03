# Person A - Backend + IBM BOB MVP

## Goal

Own the full FastAPI and IBM BOB path so the frontend always has a stable API to build against.

## Build Order

1. Get `GET /api/health` running locally.
2. Wire the IBM BOB client and verify one live request can return structured output.
3. Confirm built-in frameworks load from JSON.
4. Finish document upload, parsing, and chunk storage.
5. Implement retrieval over stored chunks.
6. Implement report generation with one finding per control.
7. Generate the executive summary through IBM BOB.
8. Implement report-aware chat.
9. Keep the demo seed endpoint ready as backup.

## Files to Own

- `backend/app/main.py`
- `backend/app/config.py`
- `backend/app/schemas.py`
- `backend/app/services/bob_client.py`
- `backend/app/services/document_parser.py`
- `backend/app/services/frameworks.py`
- `backend/app/services/storage.py`
- `backend/app/services/analysis.py`
- `backend/app/services/chat.py`
- `backend/app/services/demo_seed.py`
- `backend/app/data/frameworks/*.json`

## API Contract Checklist

- `GET /api/health`
- `POST /api/sessions`
- `GET /api/sessions`
- `POST /api/documents`
- `GET /api/documents?session_id=...`
- `GET /api/frameworks`
- `GET /api/frameworks/{id}/controls`
- `POST /api/reports`
- `GET /api/reports/{id}/status`
- `GET /api/reports/{id}`
- `GET /api/reports/{id}/summary`
- `POST /api/sessions/{id}/chat`
- `GET /api/sessions/{id}/messages`
- `POST /api/findings/{id}/draft-remediation`
- `POST /api/demo/seed`

## IBM BOB Responsibilities

- `analyze_control(control, evidence_chunks)`
- `generate_executive_summary(report_stats, top_failures)`
- `answer_chat(context, user_message)`
- `draft_remediation(finding)`

All model calls should go through `bob_client.py`. Do not scatter prompt logic across routes.

## Prompt Rules

- Always request structured JSON for control analysis.
- Keep evidence and reasoning separate.
- Require source-aware answers in chat.
- Mention IBM BOB in logs and response metadata where practical.

## Retrieval and Persistence Rules

- Store raw uploaded files under a runtime folder.
- Persist sessions, documents, reports, findings, and messages in the local JSON store for MVP.
- Keep chunk metadata rich enough for future vector search:
  - `document_id`
  - `chunk_index`
  - `content`
  - `source_ref`

## Done Criteria

- One live IBM BOB call works end-to-end when credentials are present.
- Reduced-framework analysis completes and stores findings.
- Summary is generated and attached to the report.
- Chat answers from report context.
- Demo seed can recover the happy path if live analysis is slow.
