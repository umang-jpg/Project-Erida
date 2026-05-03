from __future__ import annotations

from datetime import UTC, datetime
from typing import cast

from app.schemas import Document, Finding, FindingKind, Report, Session
from app.services.document_parser import DocumentParser
from app.services.storage import JsonDirectoryStore


DEMO_SESSION_ID = "00000000-aaaa-4aaa-8aaa-aaaaaaaa0001"
DEMO_REPORT_ID = "00000000-bbbb-4bbb-8bbb-bbbbbbbb0001"
_DEMO_DOC_IDS = (
    "00000000-cccc-4ccc-8ccc-cccccccc0001",
    "00000000-cccc-4ccc-8ccc-cccccccc0002",
    "00000000-cccc-4ccc-8ccc-cccccccc0003",
)


def _finding_id(index: int) -> str:
    return f"{0xF0000000 + index:08x}-0000-4000-8000-{index:012x}"


class DemoSeedService:
    def __init__(self, store: JsonDirectoryStore, parser: DocumentParser) -> None:
        self.store = store
        self.parser = parser

    def seed_demo(self) -> dict[str, str]:
        now = datetime.now(UTC)

        session = Session(id=DEMO_SESSION_ID, name="ComplianceAutopilot · GDPR demo", created_at=now)
        self.store.save(
            "sessions",
            session.id,
            session.model_dump(mode="json"),
        )

        doc_payloads: tuple[tuple[str, str, str], ...] = (
            (
                _DEMO_DOC_IDS[0],
                "privacy-policy.pdf",
                _PRIVACY_POLICY_TEXT,
            ),
            (
                _DEMO_DOC_IDS[1],
                "data-processing-agreement.md",
                _DPA_TEXT,
            ),
            (
                _DEMO_DOC_IDS[2],
                "security-procedures.txt",
                _SECURITY_TEXT,
            ),
        )

        for doc_id, filename, raw_text in doc_payloads:
            kind = self.parser.file_kind(filename)
            if kind is None:
                raise RuntimeError(f"Unexpected demo filename: {filename}")
            chunks = self.parser.build_chunks(doc_id, filename, raw_text)
            doc = Document(
                id=doc_id,
                session_id=DEMO_SESSION_ID,
                filename=filename,
                file_type=kind,
                status="ready",
                parsed_text=raw_text,
                chunks=chunks,
                error_message=None,
            )
            self.store.save("documents", doc_id, doc.model_dump(mode="json"))

        findings = _seed_findings(DEMO_REPORT_ID)
        executive = (
            "Overall posture lands at roughly two-thirds satisfactory: foundational transparency, access, correction, portability, retention, lawful basis,"
            " and accountability statements are evidenced in uploaded policies."
            " The largest exposure remains operationalizing objection handling, DPIA thresholds, supervisory breach timelines, subprocessors,"
            " and lawful international transfer safeguards. Prioritize closing processor contract gaps, DPIA narratives, objection workflows,"
            " and tightening breach escalation documentation before diligence review."
        )
        report = Report(
            id=DEMO_REPORT_ID,
            session_id=DEMO_SESSION_ID,
            framework_id="gdpr-essentials-v1",
            status="complete",
            overall_score=64,
            pass_count=11,
            fail_count=5,
            partial_count=4,
            insufficient_count=0,
            executive_summary=executive,
            findings=findings,
            created_at=now,
        )

        self.store.save("reports", DEMO_REPORT_ID, report.model_dump(mode="json"))

        return {"session_id": DEMO_SESSION_ID, "report_id": DEMO_REPORT_ID}


def _seed_findings(report_id: str) -> list[Finding]:
    controls_in_order = [
        ("GDPR-Art-5", "pass"),
        ("GDPR-Art-6", "pass"),
        ("GDPR-Art-7", "pass"),
        ("GDPR-Art-12", "pass"),
        ("GDPR-Art-13", "pass"),
        ("GDPR-Art-14", "pass"),
        ("GDPR-Art-15", "pass"),
        ("GDPR-Art-16", "pass"),
        ("GDPR-Art-17", "pass"),
        ("GDPR-Art-18", "pass"),
        ("GDPR-Art-20", "pass"),
        ("GDPR-Art-21", "fail"),
        ("GDPR-Art-25", "fail"),
        ("GDPR-Art-26", "fail"),
        ("GDPR-Art-28", "fail"),
        ("GDPR-Art-30", "fail"),
        ("GDPR-Art-32", "partial"),
        ("GDPR-Art-33", "partial"),
        ("GDPR-Art-35", "partial"),
        ("GDPR-Art-44", "partial"),
    ]
    evidence_snippets = {
        "GDPR-Art-5": "Section 2 states data is collected for described product operations, retained only while accounts stay active, and secured with industry standard controls.",
        "GDPR-Art-6": "Annex A lists core processing purposes with references to contract performance and consent checkboxes during onboarding.",
        "GDPR-Art-7": "Cookie preference center records granular opt-ins and links to withdraw marketing consent at any time.",
        "GDPR-Art-12": "Plain language summary tables describe processing activities with links to deeper legal sections for specialists.",
        "GDPR-Art-13": "Privacy notice enumerates controller identity, purposes, categories, retention ranges, and an email contact for privacy requests.",
        "GDPR-Art-14": "Indirect collection addendum promises notice within 30 days when personal data is obtained from partners.",
        "GDPR-Art-15": "Support portal documents the SAR workflow including identity checks and 30-day acknowledgement targets.",
        "GDPR-Art-16": "Profile settings let users update core attributes; support tickets cover corrections for derived profile fields.",
        "GDPR-Art-17": "Deletion section explains account closure triggers erasure with exceptions for tax and fraud logs with stated retention windows.",
        "GDPR-Art-18": "Legal hold workflow pauses deletions when litigation flags exist and notifies requesters with expected timelines.",
        "GDPR-Art-20": "Product export allows JSON download of profile, preferences, and recent activity for authenticated users.",
        "GDPR-Art-21": "Marketing opt-out exists but there is no documented path to object to broader product analytics based on legitimate interests.",
        "GDPR-Art-25": "Engineering design reviews mention security but do not evidence privacy impact checkpoints for new data uses.",
        "GDPR-Art-26": "Joint marketing programs reference partners without a published allocation of responsibilities or unified contact path.",
        "GDPR-Art-28": "Processor exhibit is missing binding instructions, deletion assistance triggers, and audit cooperation clauses beyond generic confidentiality.",
        "GDPR-Art-30": "No inventory exists for processing activities, categories of data subjects, or cross-border transfers beyond high-level marketing copy.",
        "GDPR-Art-32": "Encryption is mentioned for data at rest and TLS for transit but key rotation, logging, and vendor assurance evidence are thin.",
        "GDPR-Art-33": "Incident runbook references internal escalation but omits supervisory authority notification timelines and decision records.",
        "GDPR-Art-35": "High risk processing is acknowledged qualitatively yet no structured DPIA record, mitigations, or consultation notes are attached.",
        "GDPR-Art-44": "International customers are served but SCCs, transfer impact assessments, and supplementary measures are not attached to the DPA.",
    }
    gap_text = {
        "GDPR-Art-21": "Legitimate interest balancing test, objection intake channel, and documented responses are absent for non-marketing processing.",
        "GDPR-Art-25": "Missing privacy review gates, data minimization defaults, and engineering checklists tied to new features or datasets.",
        "GDPR-Art-26": "No joint-controller agreement, responsibility matrix, or single point of contact for data subjects.",
        "GDPR-Art-28": "Processor contract lacks mandatory articles on subprocessors, assistance with subject rights, Security exhibit, flow-down terms, and audit rights.",
        "GDPR-Art-30": "Records of processing missing lawful basis per activity, retention schedules, recipient countries, and DPIA cross references.",
        "GDPR-Art-32": "Security narrative lacks detail on key management, vulnerability management cadence, monitoring, and supplier due diligence artifacts.",
        "GDPR-Art-33": "No 72-hour authority notification workflow, evidence of testing, or template communications for high risk incidents.",
        "GDPR-Art-35": "DPIA threshold analysis missing; no documented necessity/proportionality discussion or residual risk sign-off.",
        "GDPR-Art-44": "Transfer mechanism not specified; supplementary measures and importer obligations absent from contractual pack.",
    }
    remediation_text = {
        "GDPR-Art-21": "Publish a legitimate interest assessment, add an objection web form with ticketing, and document decision letters within statutory timelines.",
        "GDPR-Art-25": "Embed privacy review gates in your SDLC with documented minimization defaults and DPIA triggers before launch.",
        "GDPR-Art-26": "Execute a joint-controller agreement with clear responsibility split and surface a single privacy inbox for joint activities.",
        "GDPR-Art-28": "Update processor schedules with Article 28 clauses covering instructions, breach assistance, deletion, audits, and international transfers.",
        "GDPR-Art-30": "Stand up a RoPA template and complete entries for each product surface with retention, transfers, and security measures.",
        "GDPR-Art-32": "Expand security annex with crypto standards, logging, pentest cadence, and vendor SOC review requirements tied to PHI/PII risk.",
        "GDPR-Art-33": "Add regulatory notification playbook with 72-hour timer, RACI, and rehearsed tabletop evidence.",
        "GDPR-Art-35": "Complete DPIAs for higher risk flows, attach mitigation plans, and file consultation outcomes where required.",
        "GDPR-Art-44": "Adopt SCCs or equivalent, perform TIAs, and document supplementary measures such as encryption and access minimization.",
    }

    findings: list[Finding] = []
    for idx, (control_id, status) in enumerate(controls_in_order, start=1):
        conf = _confidence_for(status, idx)
        evidence = evidence_snippets[control_id]
        if status == "pass":
            gap = ""
            remediation = ""
        elif status == "fail":
            gap = gap_text[control_id]
            remediation = remediation_text[control_id]
        else:
            gap = gap_text[control_id]
            remediation = remediation_text[control_id]
        findings.append(
            Finding(
                id=_finding_id(idx),
                report_id=report_id,
                control_id=control_id,
                status=cast(FindingKind, status),
                confidence=conf,
                evidence=evidence,
                gap=gap,
                remediation=remediation,
            )
        )
    return findings


def _confidence_for(status: str, idx: int) -> int:
    base = 60 + ((idx * 11) % 31)
    if status == "pass":
        return min(93, base + 15)
    if status == "fail":
        return max(71, base)
    return min(89, base + 5)


_PRIVACY_POLICY_TEXT = """
Privacy Policy · Example Corp Ltd (Controller)
Effective date: January 2026

Introduction
------------
This policy describes how Example Corp collects, uses, stores, shares, retains, secures,
and destroys personal information when individuals use hosted software, subscribe to newsletters,
engage support, participate in webinars, navigate marketing sites, or interact with integrations.
We endeavor to honor EU/UK GDPR, California CPRA-aligned practices, and other applicable laws.


Core purposes & lawful bases (Article 6)
----------------------------------------
Personal data powers: (i) onboarding and provisioning accounts under contracts with business customers,
(ii) product usage telemetry that keeps services reliable where supported by legitimate interest balanced against user rights,
(iii) precise marketing channels only where opt-in consent is collected with granular toggles withdrawable anytime,
(iv) fulfilling legal bookkeeping, tax enforcement, lawful requests from courts, regulators, auditors,
(v) safeguarding infrastructure by detecting intrusion and fraud using security monitoring with minimization safeguards.

Individuals who represent corporate customers enter personal data incidental to contracting; we mirror instructions from their employers when acting as processor.


Transparency & fairness (Articles 12-14)
---------------------------------------
We publish layered notices: concise tables for executives and detailed annexes attorneys can cite.
Corporate administrators receive onboarding emails pointing to Annex A (purposes, categories, recipients, retention ranges)
and Annex B (subprocessors and transfer tools). When data is received indirectly from integration partners,
we notify affected users within 30 days unless a statutory exception applies and we document the rationale.


Data subject rights (Articles 15-20)
-----------------------------------
Self-service consoles allow access, rectification, export of profile, preferences, recent activity in JSON (portability),
and restricted processing when disputes exist. Erasure requests may be submitted via privacy@example.com;
we confirm identity, queue deletion, and communicate exceptions (tax, anti-fraud, litigation holds) with plain-language reasoning.
Users may withdraw marketing consent through the preference center; transactional notices continue as required by law.


International transfers
----------------------
Global infrastructure may process data in the EU, UK, US, and India. We rely on approved transfer mechanisms with customers
and describe supplemental measures at a high level (encryption, access reviews, vendor checks), though updated SCCs and TIAs
are still being appended to customer contracts during the current procurement cycle.


Security at a glance (Article 32)
--------------------------------
We encrypt sensitive database fields at rest, require TLS 1.2+ for transit, enforce MFA for administrative access,
operate vulnerability scanning, and maintain an incident response roster. Formal key rotation metrics and independent pen-test
summaries are published internally but not yet attached to this external policy.


Contact
-------
Privacy Office: privacy@example.com · Data Protection Lead: dpo@example.com · EU representative: eu-rep@example.com
""".strip()


_DPA_TEXT = """
Data Processing Agreement (DPA) · Example Corp & Customer
Version 0.9 — draft for demo purposes

1. Scope & roles
The parties acknowledge Customer is the controller and Example Corp processes personal data only on documented instructions
unless applicable law requires otherwise (in which case Example Corp informs Customer unless legally prohibited).

2. Details of processing
Categories include account administrators, end users, support ticket content, product analytics events, and audit logs.
Processing supports hosted service delivery, security monitoring, product improvement within consent or contract limitations,
and finance operations. Duration follows the Main Agreement term plus a 90-day wind-down for backups.

3. Confidentiality & personnel
Personnel with access are bound by confidentiality and complete annual privacy training; access follows least privilege with quarterly reviews.

4. Security
Example Corp maintains administrative, technical, and organizational measures including encryption, logging, backup, and vendor reviews.
Customer may request the latest security whitepaper; deeper audit rights are subject to schedule and fees.

5. Subprocessors
A current list is published at trust.example.com/subprocessors with email notice for material changes; Customer may object on reasonable grounds.

6. Cross-border transfers
Transfers rely on appropriate safeguards (SCCs, UK IDTA, or adequacy). Supplementary measures are under legal review; attachment will follow counter-signature.

7. Assistance
Example Corp assists with subject rights where technically feasible, provides breach summaries when discovered, and supports Customer DPIAs on request with additional fees.

8. Return & deletion
Upon termination Example Corp deletes or returns data within 60 days except where law requires retention; Customer may request a deletion certificate.

9. Limitation
This DPA is intentionally incomplete for demo scenarios; legal must finalize Article 28 exhibits, audit mechanics, and transfer impact artifacts.
""".strip()


_SECURITY_TEXT = """
Security & Operations Overview (Internal)
Classification: Internal · Last review: Q1 2026

Access control
--------------
Role-based access governs production systems. Contractors receive time-bound accounts with manager approval.
Quarterly access reviews sample high-risk roles; exceptions require CISO sign-off.

Logging & monitoring
--------------------
Centralized logging captures authentication, configuration changes, and administrative actions. Alerts route to the on-call rotation.
Playbooks document triage; threat intel feeds inform detections.

Backup & availability
---------------------
Customer databases replicate across availability zones. Backups are encrypted, tested quarterly, and retained per policy schedules.

Incident response
----------------
Runbooks exist for ransomware, credential leaks, and third-party compromise. Internal drills occur twice yearly.
Guidance for supervisory notification is under legal refresh to include explicit 72-hour timers and evidence retention.

Vulnerability management
------------------------
Critical CVEs require remediation within 7 days where exploitable; others follow risk-based SLAs tracked in the ITSM tool.

Vendor management
------------------
Critical vendors undergo security review; SOC 2 reports are requested annually. AI subprocessors are being cataloged with data flow diagrams.
""".strip()
