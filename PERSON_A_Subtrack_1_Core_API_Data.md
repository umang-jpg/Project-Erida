# Person A Subtrack 1 - Core API, Data, and Document Pipeline

## Best tool fit

Give this track to the agent that is better at structured backend scaffolding and CRUD/API wiring.

## Goal

Own the non-AI backend foundation so the rest of the product has stable data flow:

- sessions
- documents
- local persistence
- framework loading
- upload/parsing/chunking
- report shell/status plumbing

This track should avoid changing IBM BOB prompt logic unless strictly necessary.

## Primary files to own

- `backend/app/main.py`
- `backend/app/schemas.py`
- `backend/app/config.py`
- `backend/app/services/storage.py`
- `backend/app/services/frameworks.py`
- `backend/app/services/document_parser.py`
- `backend/app/data/frameworks/*.json`
- `backend/.env.example`

## Activities

1. Harden the local JSON store
- Add safe update helpers for nested report/finding/message changes.
- Make list/get/filter behavior predictable and easy to debug.
- Keep data shape consistent with Pydantic models.

2. Improve document ingestion
- Validate allowed file types: `pdf`, `txt`, `md`.
- Return cleaner error states for empty or unreadable files.
- Persist upload metadata more explicitly, including saved path if useful.
- Keep chunk metadata ready for future vector retrieval.

3. Clean up framework loading
- Validate framework JSON shape on load.
- Keep the reduced built-in frameworks stable and demo-ready.
- Add small helper methods if needed for lookup and control access.

4. Strengthen session/document/report shell routes
- Make sure session creation and listing are stable.
- Make document listing work cleanly by session.
- Ensure report status returns correct totals even before full analysis completes.
- Keep route responses aligned with schemas.

5. Prepare a better demo seed path
- Make `POST /api/demo/seed` deterministic.
- Ensure seeded documents, chunks, session, and report are all coherent.
- Keep the seeded flow easy for frontend demo use.

## Constraints

- Do not redesign the IBM BOB service layer.
- Do not move prompt logic into this track.
- Avoid overlapping edits in `backend/app/services/bob_client.py`, `analysis.py`, and `chat.py` unless integration requires a tiny compatibility change.

## Suggested implementation order

1. `storage.py`
2. `document_parser.py`
3. `frameworks.py`
4. `schemas.py`
5. `main.py`
6. `demo_seed.py`

## Definition of done

- Sessions can be created and listed reliably.
- Documents can be uploaded and parsed reliably.
- Frameworks load without manual patching.
- Demo seed creates a stable local dataset.
- API responses are clean enough that frontend work does not need guesswork.

## Handoff notes for integration

- Tell the AI track exactly which fields are guaranteed on documents, chunks, and reports.
- If any schema changes are made, update `PERSON_A_Backend_AI_MVP.md`.
- Keep response field names stable once frontend integration starts.
