from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from pathlib import Path

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import Settings, get_settings
from app.schemas import (
    DemoSeedResponse,
    Document,
    DocumentStatusPayload,
    Framework,
    HealthResponse,
    Report,
    ReportCreateRequest,
    ReportCreateResponse,
    ReportStatusPayload,
    ReportSummaryPayload,
    Session,
    SessionCreateRequest,
    SessionDetail,
)
from app.services.analysis import run_analysis
from app.services.bob_client import BobClient
from app.services.chat import send_message as chat_send_message
from app.services.demo_seed import DemoSeedService
from app.services.document_parser import DocumentParser
from app.services.frameworks import FrameworkService, summarize_report
from app.services.storage import JsonDirectoryStore






class ChatRequest(BaseModel):
    message: str

def get_framework(settings: Settings = Depends(get_settings)):
    return get_framework_service(settings)


def get_store(settings: Settings = Depends(get_settings)) -> JsonDirectoryStore:
    return JsonDirectoryStore(settings.data_root)


def get_framework_service(settings: Settings = Depends(get_settings)) -> FrameworkService:
    return FrameworkService(settings.frameworks_dir)


def get_document_parser(settings: Settings = Depends(get_settings)) -> DocumentParser:
    return DocumentParser(settings.chunk_size_chars, settings.chunk_overlap_chars)


def get_demo_seed(
    store: JsonDirectoryStore = Depends(get_store),
    parser: DocumentParser = Depends(get_document_parser),
) -> DemoSeedService:
    return DemoSeedService(store, parser)


def get_bob(settings: Settings = Depends(get_settings)) -> BobClient:
    print("=== get_bob() CALLED ===")
    return BobClient(settings)


app = FastAPI(title="ComplianceAutopilot API", version="0.2.0")

_settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse()


@app.post("/api/sessions", response_model=Session)
async def create_session(
    payload: SessionCreateRequest,
    store: JsonDirectoryStore = Depends(get_store),
) -> Session:
    session_id = store.new_uuid4()
    now = datetime.now(timezone.utc)
    session = Session(id=session_id, name=payload.name, created_at=now)
    store.save("sessions", session_id, session.model_dump(mode="json"))
    return session


@app.get("/api/sessions", response_model=list[Session])
async def list_sessions(store: JsonDirectoryStore = Depends(get_store)) -> list[Session]:
    rows = store.list_entities("sessions")
    return [Session.model_validate(row) for row in rows]


@app.get("/api/sessions/{session_id}", response_model=SessionDetail)
async def get_session(session_id: str, store: JsonDirectoryStore = Depends(get_store)) -> SessionDetail:
    raw = store.load("sessions", session_id)
    if raw is None:
        raise HTTPException(status_code=404, detail="Session not found.")
    session = Session.model_validate(raw)
    doc_ids = [row["id"] for row in store.list_entities("documents") if row.get("session_id") == session_id]
    return SessionDetail(**session.model_dump(), document_ids=doc_ids)


@app.post("/api/documents", response_model=Document)
async def upload_document(
    session_id: str = Query(..., description="Session that will own the uploaded file"),
    file: UploadFile = File(...),
    store: JsonDirectoryStore = Depends(get_store),
    parser: DocumentParser = Depends(get_document_parser),
) -> Document:
    if store.load("sessions", session_id) is None:
        raise HTTPException(status_code=404, detail="Session not found.")

    filename = Path(file.filename or "").name
    if not filename:
        raise HTTPException(status_code=400, detail="Filename is required.")

    file_type = parser.file_kind(filename)
    if file_type is None:
        raise HTTPException(status_code=400, detail="Only .pdf, .txt, and .md uploads are supported for this MVP.")

    document_id = store.new_uuid4()
    uploading_doc = Document(
        id=document_id,
        session_id=session_id,
        filename=filename,
        file_type=file_type,
        status="uploading",
        parsed_text=None,
        chunks=[],
        error_message=None,
    )
    store.save("documents", document_id, uploading_doc.model_dump(mode="json"))

    raw = await file.read()
    safe_name = f"{document_id}_{filename}"
    (store.uploads_dir / safe_name).write_bytes(raw)

    parsing_doc = uploading_doc.model_copy(update={"status": "parsing"})
    store.save("documents", document_id, parsing_doc.model_dump(mode="json"))

    outcome = parser.parse_document(document_id, filename, raw)
    if outcome.error_message:
        error_doc = parsing_doc.model_copy(
            update={"status": "error", "error_message": outcome.error_message},
        )
        store.save("documents", document_id, error_doc.model_dump(mode="json"))
        return error_doc

    ready_doc = parsing_doc.model_copy(
        update={
            "status": "ready",
            "parsed_text": outcome.parsed_text,
            "chunks": outcome.chunks,
        },
    )
    store.save("documents", document_id, ready_doc.model_dump(mode="json"))
    return ready_doc


@app.get("/api/documents", response_model=list[Document])
async def list_documents(
    session_id: str = Query(...),
    store: JsonDirectoryStore = Depends(get_store),
) -> list[Document]:
    rows = [row for row in store.list_entities("documents") if row.get("session_id") == session_id]
    return [Document.model_validate(row) for row in rows]


@app.get("/api/documents/{document_id}/status", response_model=DocumentStatusPayload)
async def document_status(
    document_id: str,
    store: JsonDirectoryStore = Depends(get_store),
) -> DocumentStatusPayload:
    raw = store.load("documents", document_id)
    if raw is None:
        raise HTTPException(status_code=404, detail="Document not found.")
    doc = Document.model_validate(raw)
    return DocumentStatusPayload(id=doc.id, status=doc.status, chunk_count=len(doc.chunks))


@app.get("/api/frameworks", response_model=list[Framework])
async def list_frameworks(service: FrameworkService = Depends(get_framework_service)) -> list[Framework]:
    return service.list_frameworks()


@app.get("/api/frameworks/{framework_id}/controls")
async def list_controls(framework_id: str, service: FrameworkService = Depends(get_framework_service)) -> list[dict]:
    try:
        return [control.model_dump() for control in service.controls_for_framework(framework_id)]
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/api/reports", response_model=ReportCreateResponse)
async def create_report(
    payload: ReportCreateRequest,
    background_tasks: BackgroundTasks,
    store: JsonDirectoryStore = Depends(get_store),
    frameworks: FrameworkService = Depends(get_framework_service),
) -> ReportCreateResponse:
    if store.load("sessions", payload.session_id) is None:
        raise HTTPException(status_code=404, detail="Session not found.")
    try:
        framework = frameworks.get_framework(payload.framework_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    report_id = store.new_uuid4()
    now = datetime.now(timezone.utc)
    report = Report(
        id=report_id,
        session_id=payload.session_id,
        framework_id=framework.id,
        status="running",
        overall_score=None,
        pass_count=0,
        fail_count=0,
        partial_count=0,
        insufficient_count=0,
        executive_summary="",
        findings=[],
        created_at=now,
    )
    store.save("reports", report_id, report.model_dump(mode="json"))
    
    # Add background task for analysis
    store_instance = JsonDirectoryStore(get_settings().data_root)
    background_tasks.add_task(
        run_analysis,
        report_id,
        payload.session_id,
        framework.id,
        store_instance,
        BobClient(get_settings()),
        get_framework_service(get_settings())
    )
    
    return ReportCreateResponse(report_id=report_id)


@app.get("/api/reports/{report_id}/status", response_model=ReportStatusPayload)
async def report_status(
    report_id: str,
    store: JsonDirectoryStore = Depends(get_store),
    frameworks: FrameworkService = Depends(get_framework_service),
) -> ReportStatusPayload:
    raw = store.load("reports", report_id)
    if raw is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    report = Report.model_validate(raw)
    try:
        framework = frameworks.get_framework(report.framework_id)
    except KeyError:
        framework = None
    total_controls = len(framework.controls) if framework else len(report.findings)
    completed = len(report.findings) if report.status == "complete" else 0
    return ReportStatusPayload(
        status=report.status,
        completed_controls=completed,
        total_controls=total_controls or 1,
        overall_score=report.overall_score,
    )


@app.get("/api/reports/{report_id}", response_model=Report)
async def get_report(report_id: str, store: JsonDirectoryStore = Depends(get_store)) -> Report:
    raw = store.load("reports", report_id)
    if raw is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    return Report.model_validate(raw)


@app.get("/api/reports/{report_id}/summary", response_model=ReportSummaryPayload)
async def get_report_summary(
    report_id: str,
    store: JsonDirectoryStore = Depends(get_store),
    frameworks: FrameworkService = Depends(get_framework_service),
) -> ReportSummaryPayload:
    raw = store.load("reports", report_id)
    if raw is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    report = Report.model_validate(raw)
    try:
        framework = frameworks.get_framework(report.framework_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return summarize_report(report, framework)


@app.post("/api/demo/seed", response_model=DemoSeedResponse)
async def seed_demo(demo_seed: DemoSeedService = Depends(get_demo_seed)) -> DemoSeedResponse:
    payload = demo_seed.seed_demo()
    return DemoSeedResponse(session_id=payload["session_id"], report_id=payload["report_id"])


@app.post("/api/sessions/{session_id}/chat")
async def chat(
    session_id: str,
    body: ChatRequest,
    store: JsonDirectoryStore = Depends(get_store),
    bob: BobClient = Depends(get_bob),
    fw = Depends(get_framework)
) -> dict:
    response = await chat_send_message(session_id, body.message, store, bob, fw)
    return {
        "role": "assistant",
        "content": response,
        "provider": "Groq"
    }


@app.get("/api/sessions/{session_id}/messages")
async def get_messages(session_id: str, store: JsonDirectoryStore = Depends(get_store)) -> list:
    all_msgs = store.list_entities("messages")
    return [m for m in all_msgs if m.get("session_id") == session_id]


@app.post("/api/findings/{finding_id}/draft-remediation")
async def draft_remediation(finding_id: str, store: JsonDirectoryStore = Depends(get_store)) -> dict:
    bob = get_bob()
    for report in store.list_entities("reports"):
        for f in report.get("findings", []):
            if f.get("id") == finding_id:
                text = await bob.draft_remediation(f.get("control_id", ""), f.get("gap", ""))
                return {"remediation": text, "provider": "Groq"}
    raise HTTPException(status_code=404, detail="Finding not found.")
