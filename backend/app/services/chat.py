from __future__ import annotations

from app.schemas import Chunk
from app.services.bob_client import BobClient
from app.services.frameworks import FrameworkService
from app.services.storage import JsonDirectoryStore


async def send_message(
    session_id: str,
    user_message: str,
    store: JsonDirectoryStore,
    bob: BobClient,
    framework_service: FrameworkService
) -> str:
    """Send a chat message and get AI response based on report context."""
    # Save user message
    user_msg_id = store.new_uuid4()
    store.save("messages", user_msg_id, {
        "id": user_msg_id,
        "session_id": session_id,
        "role": "user",
        "content": user_message,
        "created_at": store.utc_now_iso()
    })
    
    # Find most recent report for this session
    reports = [r for r in store.list_entities("reports") if r.get("session_id") == session_id]
    if not reports:
        response = "No analysis has been run yet. Please upload documents, select a framework, and run analysis first."
        # Save assistant message
        assistant_msg_id = store.new_uuid4()
        store.save("messages", assistant_msg_id, {
            "id": assistant_msg_id,
            "session_id": session_id,
            "role": "assistant",
            "content": response,
            "created_at": store.utc_now_iso()
        })
        return response
    
    report = reports[0]
    
    # Build report summary
    report_summary = {
        "overall_score": report.get("overall_score"),
        "pass_count": report.get("pass_count", 0),
        "fail_count": report.get("fail_count", 0),
        "partial_count": report.get("partial_count", 0),
        "insufficient_count": report.get("insufficient_count", 0),
        "executive_summary": report.get("executive_summary", ""),
        "top_gaps": [
            f.get("gap", "")
            for f in report.get("findings", [])
            if f.get("status") in ("fail", "partial") and f.get("gap")
        ][:5]
    }
    
    # Load all document chunks for session
    docs = [d for d in store.list_entities("documents") if d.get("session_id") == session_id]
    all_chunks: list[Chunk] = []
    for doc in docs:
        for chunk_dict in doc.get("chunks", []):
            all_chunks.append(Chunk.model_validate(chunk_dict))
    
    # Score chunks against user message
    words = user_message.lower().split()
    scored: list[tuple[int, Chunk]] = []
    for chunk in all_chunks:
        score = sum(1 for w in words if w in chunk.content.lower())
        scored.append((score, chunk))
    
    # Take top 5
    scored.sort(reverse=True, key=lambda x: x[0])
    relevant_chunks = [c for _, c in scored[:5]]
    
    # Get response from bob
    print("=== chat.py calling answer_chat ===")
    response = await bob.answer_chat(user_message, report_summary, relevant_chunks)
    
    # Save assistant message
    assistant_msg_id = store.new_uuid4()
    store.save("messages", assistant_msg_id, {
        "id": assistant_msg_id,
        "session_id": session_id,
        "role": "assistant",
        "content": response,
        "created_at": store.utc_now_iso()
    })
    
    return response

# Made with Bob
