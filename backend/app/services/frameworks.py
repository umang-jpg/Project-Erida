from __future__ import annotations

import json
from pathlib import Path

from app.schemas import Control, Framework, Report, ReportSummaryPayload

_FRAME_FILENAMES = ("gdpr.json", "soc2.json", "hipaa.json")


class FrameworkService:
    def __init__(self, frameworks_dir: Path) -> None:
        self.frameworks_dir = Path(frameworks_dir)

    def list_frameworks(self) -> list[Framework]:
        results: list[Framework] = []
        for fname in _FRAME_FILENAMES:
            path = self.frameworks_dir / fname
            if not path.exists():
                continue
            payload = json.loads(path.read_text(encoding="utf-8"))
            results.append(Framework.model_validate(payload))
        return results

    def get_framework(self, framework_id: str) -> Framework:
        for framework in self.list_frameworks():
            if framework.id == framework_id:
                return framework
        raise KeyError(f"Framework not found: {framework_id}")

    def controls_for_framework(self, framework_id: str) -> list[Control]:
        return list(self.get_framework(framework_id).controls)


def summarize_report(report: Report, framework: Framework) -> ReportSummaryPayload:
    severity_rank = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    by_id = {c.control_id: c for c in framework.controls}

    gaps: list[tuple[int, str]] = []
    for finding in report.findings:
        if finding.status not in {"fail", "partial"}:
            continue
        control = by_id.get(finding.control_id)
        rank = severity_rank.get(control.severity if control else "low", 3)
        text = finding.gap.strip() if finding.gap else ""
        if not text and control:
            text = control.description[:200]
        gaps.append((rank, text or finding.control_id))
    gaps.sort(key=lambda pair: pair[0])
    top_gaps = [label for _, label in gaps[:5]]

    return ReportSummaryPayload(
        overall_score=report.overall_score,
        pass_count=report.pass_count,
        fail_count=report.fail_count,
        partial_count=report.partial_count,
        insufficient_count=report.insufficient_count,
        executive_summary=report.executive_summary,
        top_gaps=top_gaps,
    )
