from __future__ import annotations

from sqlmodel import select

from app.db.models import PrincipleResult, Report, Run
from app.db.session import get_session
from app.principles.ucalgary_principles import PRINCIPLES


def _format_course_level(course_level: str | None) -> str:
    v = (course_level or "").strip().lower()
    if not v:
        return "_(Not provided)_"
    return v.capitalize()


def _format_modality(modality: str | None) -> str:
    v = (modality or "").strip().lower()
    if not v:
        return "_(Not provided)_"
    if v == "in_person":
        return "In-person"
    return v.replace("_", "-").capitalize()


def _build_report_markdown(*, run: Run, results: list[PrincipleResult], selected_principles_count: int) -> str:
    """
    Build report markdown featuring the two narrative feedback sections.

    The executive summary (counts) is retained internally for PDF/markdown but is not
    the primary content. The user-facing sections are "Alignment" and "Continue the Journey".
    """
    total = selected_principles_count

    lines: list[str] = []
    lines.append("# Assessment Principles Report")
    lines.append("")
    lines.append(f"- Run ID: `{run.id}`")
    lines.append(f"- Input type: `{run.input_type}`")
    lines.append(f"- Source: `{run.source}`")
    lines.append(f"- Model: `{run.model}`")
    lines.append(f"- Principles evaluated: **{total}** / {len(PRINCIPLES)}")
    lines.append("")

    lines.append("## Course context")
    lines.append("")
    lines.append(f"- Course level: **{_format_course_level(run.course_level)}**")
    lines.append(f"- Modality: **{_format_modality(run.modality)}**")
    lines.append(f"- Discipline: **{(run.discipline or '').strip() or '_(Not provided)_'}**")
    lines.append(f"- Assessment type: **{(run.assessment_type or '').strip() or '_(Not provided)_'}**")
    lines.append("")
    lines.append("### Learning outcomes")
    lines.append("")
    lines.append((run.learning_outcome or "").strip() or "_(Not provided)_")
    lines.append("")

    # Narrative feedback sections
    alignment = (run.narrative_alignment or "").strip()
    continue_journey = (run.narrative_continue_journey or "").strip()

    lines.append("## Alignment")
    lines.append("")
    lines.append(alignment or "_(Narrative not yet generated)_")
    lines.append("")

    lines.append("## Continue the Journey")
    lines.append("")
    lines.append(continue_journey or "_(Narrative not yet generated)_")
    lines.append("")

    return "\n".join(lines).strip() + "\n"


def generate_report_for_run(run_id: str) -> str:
    with get_session() as session:
        run = session.get(Run, run_id)
        if not run:
            raise ValueError("Run not found")

        # Determine which principles were selected for this run
        if run.selected_principles:
            selected_ids = set(run.selected_principles.split(","))
        else:
            selected_ids = {p.id for p in PRINCIPLES}

        results = session.exec(
            select(PrincipleResult).where(PrincipleResult.run_id == run_id).order_by(PrincipleResult.principle_id)
        ).all()
        if len(results) != len(selected_ids):
            raise ValueError(f"Run does not yet have {len(selected_ids)} principle results (has {len(results)})")

        report_md = _build_report_markdown(
            run=run,
            results=list(results),
            selected_principles_count=len(selected_ids),
        )

        report = Report(run_id=run_id, report_markdown=report_md)
        session.add(report)
        session.commit()

    return report_md
