# Person A Subtrack 2 - IBM BOB Analysis, Summary, and Chat

## Best tool fit

Give this track to the agent that is stronger at prompts, API integrations, fallback logic, and response shaping.

## Goal

Own the full IBM BOB reasoning layer so the demo clearly shows live AI value:

- control analysis
- executive summaries
- chat answers
- remediation drafting
- fallback/live mode behavior

This track should avoid broad changes to document ingestion and storage unless needed for analysis inputs.

## Primary files to own

- `backend/app/services/bob_client.py`
- `backend/app/services/analysis.py`
- `backend/app/services/chat.py`
- `backend/app/main.py`
- `backend/app/schemas.py`

## Activities

1. Harden the IBM BOB client
- Keep all model calls centralized.
- Improve live-mode request handling and error messages.
- Add safe retry behavior for transient failures.
- Preserve fallback mode so the app still works without credentials.

2. Improve control analysis
- Make `analyze_control` outputs more consistent.
- Ensure every finding returns:
  - status
  - confidence
  - evidence
  - gap
  - remediation
  - provider/model metadata
- Handle single-control failure without breaking the full report.

3. Improve summary generation
- Make executive summary text feel board/CISO ready.
- Ensure summary uses real report statistics and top gaps.
- Keep fallback summaries believable for demo mode.

4. Improve report generation flow
- Keep the reduced control-run limit configurable.
- Make retrieval-to-analysis flow clearer and easier to debug.
- Ensure findings are attached to the report in a frontend-friendly format.

5. Improve chat and remediation drafting
- Make chat answers cite report context and source refs when available.
- Make “what to fix first” and “draft policy text” queries work especially well.
- Improve `draft_remediation` so it produces stronger operational language.

6. Expose IBM BOB clearly in API responses
- Keep provider/model metadata visible.
- Keep live vs fallback mode visible where useful for demo storytelling.

## Constraints

- Do not take over core upload/parser/storage refactors unless blocked.
- Avoid broad changes to framework data files.
- Coordinate carefully if `main.py` or `schemas.py` must change, because those are the main shared touchpoints with Subtrack 1.

## Suggested implementation order

1. `bob_client.py`
2. `analysis.py`
3. `chat.py`
4. small `schemas.py` updates if needed
5. small `main.py` route adjustments if needed

## Definition of done

- One live IBM BOB call works cleanly when credentials are configured.
- Fallback mode still produces usable demo behavior.
- Analysis returns usable findings for the reduced control set.
- Executive summary feels polished enough to show judges.
- Chat can answer:
  - why a control failed
  - what to fix first
  - draft missing policy language

## Handoff notes for integration

- Coordinate with the Core API/Data track before changing shared response shapes.
- Keep all IBM BOB behavior inside service-layer functions rather than route handlers.
- If a new field is added to findings or chat responses, document it in `PERSON_A_Backend_AI_MVP.md`.
