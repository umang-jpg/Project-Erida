# Person B - Frontend + IBM BOB Showcase MVP

## Goal

Own the judge-facing experience so the app makes IBM BOB's value obvious within seconds.

## Build Order

1. Set up the React app shell and routing.
2. Build the new session flow.
3. Add document upload and framework selection.
4. Add the run-analysis action and progress state.
5. Build the report dashboard.
6. Add the IBM BOB chat panel.
7. Add empty, loading, and fallback states.
8. Polish the demo path and seeded-data experience.

## Files to Own

- `frontend/src/App.tsx`
- `frontend/src/api.ts`
- `frontend/src/types.ts`
- `frontend/src/styles.css`
- Any future components under `frontend/src/components/`

## UX Rules

- Keep `Powered by IBM BOB` visible near analysis and chat.
- Make evidence text easy to distinguish from AI interpretation.
- Call the assistant `Compliance Copilot powered by IBM BOB`.
- Use one primary call to action for the main demo flow:
  - upload documents
  - select framework
  - run analysis
  - ask IBM BOB

## Report Page Requirements

- Show overall score clearly.
- Show pass, partial, fail, and insufficient evidence counts.
- Show finding rows with severity and confidence.
- Expand a finding to reveal:
  - control description
  - evidence
  - gap
  - remediation
  - `Ask IBM BOB`
  - `Draft Fix with IBM BOB`

## Demo Script Support

- Keep seeded report loading smooth.
- Make live chat feel trustworthy even when the report is seeded.
- Surface backend response metadata if useful for the demo:
  - provider
  - model
  - fallback/live mode

## Done Criteria

- A judge can tell IBM BOB is doing the core reasoning.
- Report and chat feel like one workflow.
- Seeded and live data both render cleanly.
- The app still looks convincing if one backend feature is temporarily unavailable.
