from __future__ import annotations

import asyncio

from app.schemas import Chunk, Control
from app.services.bob_client import BobClient
from app.services.frameworks import FrameworkService
from app.services.storage import JsonDirectoryStore


async def run_analysis(
    report_id: str,
    session_id: str,
    framework_id: str,
    store: JsonDirectoryStore,
    bob: BobClient,
    framework_service: FrameworkService
) -> None:
    """Run compliance analysis in background. Updates report incrementally."""
    try:
        # Load all documents for session
        docs = [d for d in store.list_entities("documents") if d.get("session_id") == session_id]
        
        # Flatten all chunks from all documents
        all_chunks: list[Chunk] = []
        for doc in docs:
            for chunk_dict in doc.get("chunks", []):
                all_chunks.append(Chunk.model_validate(chunk_dict))
        
        # Load controls (first 8 only)
        controls = framework_service.controls_for_framework(framework_id)[:8]
        framework = framework_service.get_framework(framework_id)
        
        # Process each control
        for control in controls:
            try:
                # Score chunks against control description
                words = control.description.lower().split()
                scored: list[tuple[int, Chunk]] = []
                for chunk in all_chunks:
                    score = sum(1 for w in words if w in chunk.content.lower())
                    scored.append((score, chunk))
                
                # Take top 5 by score, or first 5 if all scores are 0
                scored.sort(reverse=True, key=lambda x: x[0])
                top_chunks = [c for _, c in scored[:5]]
                if not top_chunks and all_chunks:
                    top_chunks = all_chunks[:5]
                
                # Call bob to analyze control
                result = await bob.analyze_control(control, top_chunks)
                
                # Create finding dict
                finding = {
                    "id": store.new_uuid4(),
                    "report_id": report_id,
                    "control_id": control.control_id,
                    "status": result["status"],
                    "confidence": result["confidence"],
                    "evidence": result.get("evidence", ""),
                    "gap": result.get("gap", ""),
                    "remediation": result.get("remediation", "")
                }
                
                # Load current report, append finding, save back immediately
                report = store.load("reports", report_id)
                if report:
                    report["findings"].append(finding)
                    store.save("reports", report_id, report)
                
                # Delay between controls to stay under Groq rate limits
                await asyncio.sleep(2.0)
                
            except Exception as e:
                print(f"Error processing control {control.control_id}: {e}")
                continue
        
        # After loop: load final report and calculate stats
        report = store.load("reports", report_id)
        if not report:
            return
        
        findings = report.get("findings", [])
        
        # Count statuses
        pass_count = sum(1 for f in findings if f.get("status") == "pass")
        fail_count = sum(1 for f in findings if f.get("status") == "fail")
        partial_count = sum(1 for f in findings if f.get("status") == "partial")
        insufficient_count = sum(1 for f in findings if f.get("status") == "insufficient_evidence")
        
        # Calculate overall score
        total = len(findings)
        overall_score = (pass_count + 0.5 * partial_count) / max(total, 1) * 100
        
        # Get top failures
        top_failures = [
            {"control_id": f["control_id"]}
            for f in findings
            if f.get("status") in ("fail", "partial")
        ][:3]
        
        # Generate executive summary
        summary = await bob.generate_executive_summary(
            {
                "framework_name": framework.name,
                "total": total,
                "pass_count": pass_count,
                "fail_count": fail_count,
                "partial_count": partial_count,
                "insufficient_count": insufficient_count,
                "score": overall_score
            },
            top_failures
        )
        
        # Update report with final stats
        store.update("reports", report_id, {
            "status": "complete",
            "overall_score": overall_score,
            "pass_count": pass_count,
            "fail_count": fail_count,
            "partial_count": partial_count,
            "insufficient_count": insufficient_count,
            "executive_summary": summary
        })
        
    except Exception as e:
        print(f"Analysis error for report {report_id}: {e}")
        try:
            store.update("reports", report_id, {"status": "error"})
        except Exception:
            pass

# Made with Bob
