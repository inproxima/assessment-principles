from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlmodel import select

from app.config import get_settings
from app.db.models import PrincipleResult, Report, Run
from app.db.session import get_session
from app.principles.ucalgary_principles import PRINCIPLES
from app.services.extract_text import TextExtractionError, extract_text_from_upload
from app.services.evaluator import evaluate_run
from app.services.report_generator import generate_report_for_run
from app.services.report_pdf import markdown_to_pdf

VALID_PRINCIPLE_IDS = {p.id for p in PRINCIPLES}

router = APIRouter(prefix="/api", tags=["runs"])


@router.get("/principles")
def list_principles() -> list[dict]:
    return [
        {"id": p.id, "title": p.title, "description": p.description}
        for p in PRINCIPLES
    ]


@router.post("/runs")
async def create_run(
    mode: str = Form(...),  # task|description
    course_level: str = Form(...),  # undergraduate|graduate
    modality: str = Form(...),  # online|in_person|hybrid
    discipline: str = Form(...),
    assessment_type: str = Form(...),  # formative|summative
    learning_outcome: str = Form(...),
    text: str | None = Form(None),
    file: UploadFile | None = File(None),
    selected_principles: str | None = Form(None),  # comma-separated: "a,b,c"
) -> dict[str, str]:
    mode = (mode or "").strip().lower()
    if mode not in ("task", "description"):
        raise HTTPException(status_code=400, detail="mode must be 'task' or 'description'")

    course_level = (course_level or "").strip().lower()
    if course_level not in ("undergraduate", "graduate"):
        raise HTTPException(status_code=400, detail="course_level must be 'undergraduate' or 'graduate'")

    modality_norm = (modality or "").strip().lower()
    modality_norm = modality_norm.replace("-", "_").replace(" ", "_")
    if modality_norm == "inperson":
        modality_norm = "in_person"
    if modality_norm == "hybird":  # common typo
        modality_norm = "hybrid"
    if modality_norm not in ("online", "in_person", "hybrid"):
        raise HTTPException(status_code=400, detail="modality must be 'online', 'in_person', or 'hybrid'")

    discipline = (discipline or "").strip()
    if not discipline:
        raise HTTPException(status_code=400, detail="discipline is required")

    assessment_type = (assessment_type or "").strip().lower()
    if assessment_type not in ("formative", "summative"):
        raise HTTPException(status_code=400, detail="assessment_type must be 'formative' or 'summative'")

    learning_outcome = (learning_outcome or "").strip()
    if not learning_outcome:
        raise HTTPException(status_code=400, detail="learning_outcome is required")

    parts: list[str] = []
    source = "text"

    if text and text.strip():
        parts.append(text.strip())

    if file is not None:
        source = "upload"
        data = await file.read()
        try:
            extracted = extract_text_from_upload(
                filename=file.filename,
                content_type=file.content_type,
                data=data,
            )
        except TextExtractionError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        parts.append(extracted)

    original_text = "\n\n".join(parts).strip()
    if not original_text:
        raise HTTPException(status_code=400, detail="Provide 'text' and/or an upload file")

    # Parse and validate selected_principles (default to all if not provided)
    sp_normalized: str | None = None
    if selected_principles and selected_principles.strip():
        sp_ids = [s.strip().lower() for s in selected_principles.split(",") if s.strip()]
        unknown = set(sp_ids) - VALID_PRINCIPLE_IDS
        if unknown:
            raise HTTPException(status_code=400, detail=f"Unknown principle IDs: {', '.join(sorted(unknown))}")
        if not sp_ids:
            raise HTTPException(status_code=400, detail="At least one principle must be selected")
        sp_normalized = ",".join(sorted(set(sp_ids)))

    settings = get_settings()
    run = Run(
        input_type=mode,
        source=source,
        course_level=course_level,
        modality=modality_norm,
        discipline=discipline,
        assessment_type=assessment_type,
        learning_outcome=learning_outcome,
        selected_principles=sp_normalized,
        original_text=original_text,
        model=settings.openai_model,
        status="created",
    )

    with get_session() as session:
        session.add(run)
        session.commit()
        session.refresh(run)

    return {"run_id": run.id}


@router.post("/runs/{run_id}/evaluate")
def start_evaluation(run_id: str, background: BackgroundTasks) -> dict[str, str]:
    with get_session() as session:
        run = session.get(Run, run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")
        if run.status in ("evaluating", "completed"):
            return {"status": run.status}
        run.status = "evaluating"
        run.error = None
        session.add(run)
        session.commit()

    background.add_task(evaluate_run, run_id)
    return {"status": "evaluating"}


@router.get("/runs/{run_id}")
def get_run(run_id: str) -> dict:
    with get_session() as session:
        run = session.get(Run, run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")

        results = session.exec(
            select(PrincipleResult).where(PrincipleResult.run_id == run_id).order_by(PrincipleResult.principle_id)
        ).all()

        report = session.exec(select(Report).where(Report.run_id == run_id).order_by(Report.created_at.desc())).first()

    return {
        "run": run.model_dump(),
        "principle_results": [r.model_dump() for r in results],
        "report": report.model_dump() if report else None,
    }


@router.post("/runs/{run_id}/report")
def create_report(run_id: str) -> dict[str, str]:
    try:
        report_md = generate_report_for_run(run_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return {"report_markdown": report_md}


@router.get("/runs/{run_id}/report.pdf")
def download_report_pdf(run_id: str) -> Response:
    """
    Download a PDF generated from the saved report markdown.
    If no report exists yet, generate it first (may trigger an OpenAI call).
    """
    with get_session() as session:
        run = session.get(Run, run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")

        report = session.exec(select(Report).where(Report.run_id == run_id).order_by(Report.created_at.desc())).first()

    if report is None:
        try:
            report_md = generate_report_for_run(run_id)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
    else:
        report_md = report.report_markdown

    try:
        out = markdown_to_pdf(report_markdown=report_md, filename=f"assessment-report-{run_id}.pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to render PDF: {e}") from e

    return Response(
        content=out.data,
        media_type=out.content_type,
        headers={"Content-Disposition": f'attachment; filename="{out.filename}"'},
    )

