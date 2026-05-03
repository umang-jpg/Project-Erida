# ComplianceAutopilot (Project Erida)
### The Mission Control for Regulatory Compliance

**ComplianceAutopilot** is a high-fidelity hackathon MVP designed to transform regulatory compliance from a manual spreadsheet exercise into an immersive, AI-powered mission. Utilizing a "Holographic HUD" interface, it leverages **IBM BOB** and **IBM watsonx.ai** to automate evidence mapping, gap analysis, and remediation drafting.

---

## 🛰️ System Overview

Project Erida provides a real-time situational awareness dashboard for compliance officers. Instead of static reports, operators engage with an interactive "Cockpit" that visualizes security posture as live signals.

### Key Features
*   **Holographic HUD**: A stunning, motion-heavy glassmorphism interface inspired by futuristic ship control panels.
*   **IBM BOB Compliance Engine**: The core reasoning engine that maps document chunks to regulatory controls (SOC 2, HIPAA, GDPR).
*   **Compliance Copilot (watsonx.ai)**: An interactive AI assistant that answers operator queries using grounded evidence from the ingested audit data.
*   **Remediation Vectors**: Automated drafting of policy language and technical fixes for identified compliance gaps.
*   **Visual Signal Analysis**: Dynamic circular score rings and severity breakdown bars for instant executive visibility.

---

## 🏗️ Technical Architecture

```text
backend/   FastAPI, IBM BOB Client, watsonx.ai Integration, Local Persistence
frontend/  React 18 + TypeScript + Vite + Tailwind (HUD Design System)
```

### Core Technologies
*   **IBM BOB**: Powers the control-by-control analysis and semantic evidence mapping.
*   **IBM watsonx.ai**: Orchestrates the interactive chat experience and generates complex remediation drafting.
*   **HUD Design System**: Custom-built Vanilla CSS framework with Orbitron/Rajdhani typography and animated starfield overlays.

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```
*API runs on `http://localhost:8000`*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*UI runs on `http://localhost:5173` (or `5174` if default is occupied)*

### 3. Configuration
Copy `backend/.env.example` to `backend/.env` and provide your IBM credentials. If credentials are absent, the system operates in **Demo Mode** using seeded heuristic responses.

---

## 🎮 Recommended Demo Flow

1.  **Initiate Scan**: Create a new session (e.g., "SOC 2 Readiness").
2.  **Ingest Signal Source**: Upload 2-3 sample evidence documents (PDF/TXT/MD).
3.  **Target Framework**: Select a compliance framework (e.g., GDPR Essentials).
4.  **Execute Analysis**: Run the IBM BOB engine and watch the HUD process signals in real-time.
5.  **Assessment Dashboard**: 
    *   Review the **Overall Score** and **Severity Analysis**.
    *   Read the **Executive Summary** synthesized by IBM watsonx.ai.
    *   Expand findings to see **Evidence Logs** and **Analyzed Gaps**.
6.  **Remediation Vector**: Click "Draft Fix" to have IBM BOB generate missing policy language.
7.  **Copilot Query**: Ask the Copilot: *"Why did our Access Control signal fail?"* or *"Summarize my top 3 risks."*
8.  **Mission Report**: Export the final dashboard as a PDF or CSV for audit documentation.

---

*Developed for the IBM BOB Hackathon.*
