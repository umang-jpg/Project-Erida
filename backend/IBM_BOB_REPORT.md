# IBM BOB Dev Day Hackathon Submission

**Team:** sudo rm rf  
**Project:** Project Erida  
**Date:** May 2026

---

## 1. Project Overview

**Project Erida** is an AI-powered compliance automation platform that transforms weeks of manual compliance review into minutes of automated analysis. The system ingests organizational documents (privacy policies, security procedures, employee handbooks), analyzes them against regulatory frameworks (GDPR, SOC2, HIPAA), and generates board-ready compliance reports with specific remediation guidance. By leveraging IBM BOB's natural language understanding, Project Erida identifies compliance gaps, provides evidence-based findings, and drafts missing policy language—enabling compliance officers to focus on strategic decisions rather than document review.

---

## 2. How IBM BOB Powers the Product

IBM BOB (powered by Groq's LLM infrastructure) serves as the intelligent core of Project Erida, providing AI-driven analysis across four critical compliance workflows:

### Control-by-Control Compliance Analysis
Each regulatory control (e.g., GDPR Article 30 record-keeping, SOC2 CC6.1 logical access) is individually analyzed against uploaded organizational documents. IBM BOB evaluates whether evidence exists, assesses compliance status (pass/fail/partial), extracts relevant quotes, identifies gaps, and suggests remediation—all with confidence scoring. This granular analysis replaces manual document review that typically takes compliance officers 2-3 weeks per framework.

### Executive Summary Generation
After analyzing all controls, IBM BOB synthesizes findings into a concise, board-ready executive summary. The AI distills complex technical compliance data into plain-English insights suitable for C-suite presentation, highlighting overall compliance posture, critical gaps, and priority actions. This transforms raw audit data into strategic intelligence.

### Compliance Chat Interface
Users interact with IBM BOB through a conversational interface to ask questions about their compliance posture. BOB answers with full context from both the compliance report and source documents, enabling queries like "Which gap should we fix first?" or "Explain GDPR Article 32 in simple terms." This democratizes compliance knowledge across technical and non-technical teams.

### Remediation Drafting
When gaps are identified, IBM BOB drafts specific, actionable policy language to address missing requirements. Instead of generic recommendations, BOB generates ready-to-use text that compliance officers can review and integrate into their documentation, accelerating the remediation cycle from weeks to hours.

---

## 3. Architecture

Project Erida is built as a modern web application with a **FastAPI backend** serving a **React + TypeScript frontend**. The MVP uses **file-based JSON persistence** for rapid prototyping without database overhead. All AI capabilities are powered by **Groq's LLM API** using the **llama3-70b-8192 model**, chosen for its balance of speed, accuracy, and cost-effectiveness for compliance analysis tasks.

AI integration is centralized in [`bob_client.py`](backend/app/services/bob_client.py), which provides a clean abstraction layer for all LLM interactions. The system implements intelligent **fallback mode**: when Groq credentials are absent or API calls fail, the application continues functioning with deterministic mock responses, ensuring the demo remains operational under any conditions. This architecture enables rapid iteration while maintaining production-ready patterns for future scaling.

---

## 4. Prompts Used

### Control Analysis Prompt
```
You are a senior compliance officer.

CONTROL:
ID: {control.control_id}
Name: {control.name}
Description: {control.description}
Severity: {control.severity}

EVIDENCE:
{evidence_text}

Return ONLY valid JSON, no other text:
{"control_id": "{control.control_id}", "status": "pass" or "partial" or "fail" or "insufficient_evidence", "confidence": integer 0-100, "evidence": "quoted text from documents or empty string", "gap": "what is missing or empty string", "remediation": "one paragraph action to fix or empty string"}
```

### Executive Summary Prompt
```
You are a compliance officer writing a 3-4 sentence executive summary for a CISO.

Framework: {stats['framework_name']}
Score: {stats['score']:.0f}%
Pass: {stats['pass_count']}, Fail: {stats['fail_count']}, Partial: {stats['partial_count']} out of {stats['total']} controls
Top gaps: {', '.join([f['control_id'] for f in top_failures[:3]])}

Plain English only, no markdown, no bullet points.
```

### Chat System Prompt
```
You are a senior compliance officer helping a team fix compliance gaps.

Be direct, specific, and practical. Do NOT repeat the same summary every time.

REPORT CONTEXT:
* Overall Score: {report_summary.get('overall_score','N/A')}%
* Failing Controls: {report_summary.get('fail_count',0)}
* Top Gaps: {', '.join(report_summary.get('top_gaps',[])[:3])}

DOCUMENT EVIDENCE:
{document_chunks}

USER QUESTION:
{user_message}

Instructions:
* Answer the question directly
* If asking about gaps → explain clearly
* If asking what to fix → give step-by-step actions
* If asking for explanation → simplify like explaining to a non-expert
* Avoid repeating the same intro sentence
* Be concise but useful

Answer:
```

---

## 5. IBM BOB Integration Points

All IBM BOB interactions are centralized in [`bob_client.py`](backend/app/services/bob_client.py) through four core functions:

### `analyze_control(control: Control, chunks: list[Chunk]) -> dict`
Analyzes a single compliance control against document evidence. Returns structured JSON with status, confidence, evidence quotes, gap description, and remediation guidance. Implements fallback logic for offline operation.

### `generate_executive_summary(stats: dict, top_failures: list) -> str`
Synthesizes compliance statistics into a board-ready executive summary. Takes overall scores, pass/fail counts, and top gaps as input; returns plain-English narrative suitable for C-suite presentation.

### `answer_chat(user_message: str, report_summary: dict, relevant_chunks: list) -> str`
Powers the conversational compliance assistant. Processes user questions with full context from compliance reports and source documents, returning specific, actionable answers tailored to the user's query.

### `draft_remediation(control_name: str, gap_text: str) -> str`
Generates specific policy language to address identified compliance gaps. Takes control name and gap description as input; returns actionable paragraph that compliance officers can integrate into documentation.

---

## 6. Demo Flow

### Happy Path Walkthrough

1. **Upload Privacy Policy**  
   User uploads their organization's privacy policy PDF or text document through the document upload interface.

2. **Select GDPR Essentials Framework**  
   User chooses "GDPR Essentials" from the framework picker, loading 12 core GDPR controls for analysis.

3. **Run Analysis Powered by IBM BOB**  
   Click "Run Analysis" to trigger IBM BOB's control-by-control evaluation. The system analyzes each GDPR requirement against the uploaded policy, extracting evidence and identifying gaps in real-time.

4. **View Findings with Evidence and Remediation**  
   Review the compliance report showing overall score, control-by-control status (pass/fail/partial), specific evidence quotes from documents, identified gaps, and AI-generated remediation suggestions for each failing control.

5. **Ask IBM BOB Which Gap to Fix First**  
   Open the chat panel and ask: "Which compliance gap should we prioritize?" IBM BOB analyzes severity, business impact, and audit risk to recommend the highest-priority remediation.

6. **Ask IBM BOB to Draft Missing Policy Language**  
   Request: "Draft policy language for GDPR Article 30 record-keeping." IBM BOB generates specific, ready-to-use text addressing the identified gap, which can be reviewed and integrated into the privacy policy.

---

## 7. Impact Statement

Project Erida, powered by IBM BOB, reduces compliance framework analysis from 2-3 weeks of manual document review to under 5 minutes of automated processing. By combining natural language understanding with regulatory expertise, the platform enables compliance officers to analyze multiple frameworks simultaneously, identify gaps with evidence-based precision, and generate remediation guidance instantly—transforming compliance from a bottleneck into a competitive advantage. This acceleration allows organizations to maintain continuous compliance posture rather than point-in-time snapshots, fundamentally changing how teams approach regulatory readiness.

---

**Built with IBM BOB | May 2026**