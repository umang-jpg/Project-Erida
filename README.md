# ComplianceAutopilot

 ComplianceAutopilot is a hackathon MVP for AI-assisted regulatory compliance review. This starter repo is intentionally optimized for a 2-person team and for demoing IBM BOB as the reasoning engine behind:

- control-by-control compliance analysis
- executive summaries
- grounded compliance chat
- remediation drafting

## Repo Structure

```text
backend/   FastAPI API, framework data, IBM BOB client, local demo persistence
frontend/  React + TypeScript + Vite demo UI
```

## MVP Notes

- The backend uses file-based persistence for a beginner-friendly local MVP.
- The IBM BOB integration is centralized in one service layer so you can replace the fallback logic with live credentials later.
- If IBM BOB credentials are missing, the app still works using seeded and heuristic responses so the team can keep building.

## Backend Quick Start

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API will run on `http://localhost:8000`.

## Frontend Quick Start

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`.

## IBM BOB Configuration

Copy `backend/.env.example` to `backend/.env` and fill in the IBM BOB or OpenAI-compatible endpoint values.

If credentials are absent, the backend will use fallback demo responses while keeping all IBM BOB integration points visible in the product.

## Recommended Demo Flow

1. Open the app and create a session.
2. Upload 2-3 sample documents.
3. Choose `GDPR Essentials`.
4. Run analysis powered by IBM BOB.
5. Review the evidence-backed findings.
6. Ask IBM BOB which gap to fix first.
7. Ask IBM BOB to draft missing policy language.
