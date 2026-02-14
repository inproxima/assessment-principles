from __future__ import annotations

import json
from typing import Any

from sqlmodel import select

from app.db.models import PrincipleResult, Report, Run
from app.db.session import get_session
from app.principles.ucalgary_principles import PRINCIPLES, Principle, get_principle


def _safe_json_loads(s: str) -> dict[str, Any]:
    try:
        obj = json.loads(s)
        if isinstance(obj, dict):
            return obj
    except Exception:
        pass
    return {}


def _label(meets_level: str) -> str:
    return {
        "meets": "Meets",
        "partially_meets": "Partially meets",
        "does_not_meet": "Does not meet",
        "insufficient_info": "Insufficient info",
    }.get(meets_level, meets_level)


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


def _escape_table_cell(s: str) -> str:
    # Minimal escaping for markdown tables.
    return (s or "").replace("|", "\\|").replace("\n", " ").strip()


def _build_report_markdown(*, run: Run, results: list[PrincipleResult], selected_principles: list[Principle]) -> str:
    """
    Deterministic report markdown.
    This ensures the markdown ALWAYS contains all required sections and all selected principles,
    so PDF export (generated from markdown) is complete.
    """
    by_id = {r.principle_id: r for r in results}
    description = (run.generated_description or run.original_text or "").strip()
    total = len(selected_principles)

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

    lines.append("## Assessment description")
    lines.append("")
    lines.append(description or "_(No description available)_")
    lines.append("")

    counts: dict[str, int] = {}
    for r in results:
        counts[r.meets_level] = counts.get(r.meets_level, 0) + 1

    lines.append("## Executive summary")
    lines.append("")
    lines.append(f"- Meets: **{counts.get('meets', 0)}** / {total}")
    lines.append(f"- Partially meets: **{counts.get('partially_meets', 0)}** / {total}")
    lines.append(f"- Does not meet: **{counts.get('does_not_meet', 0)}** / {total}")
    lines.append(f"- Insufficient info: **{counts.get('insufficient_info', 0)}** / {total}")
    lines.append("")

    lines.append("## Summary table")
    lines.append("")
    lines.append("| ID | Rating | Principle |")
    lines.append("| --- | --- | --- |")
    for p in selected_principles:
        r = by_id[p.id]
        lines.append(f"| {p.id} | {_escape_table_cell(_label(r.meets_level))} | {_escape_table_cell(p.title)} |")
    lines.append("")

    lines.append("## Principle-by-principle results")
    lines.append("")
    for p in selected_principles:
        r = by_id[p.id]
        obj = _safe_json_loads(r.json_output)
        lines.append(f"### ({p.id}) {p.title}")
        lines.append("")
        lines.append(f"- Rating: **{_label(r.meets_level)}**")
        ev = (obj.get("evidence") or "").strip()
        gaps = (obj.get("gaps") or "").strip()
        rec = (obj.get("recommendation") or "").strip()
        if ev:
            lines.append(f"- Evidence: {ev}")
        if gaps:
            lines.append(f"- Gaps: {gaps}")
        if rec:
            lines.append(f"- Recommendation: {rec}")
        lines.append("")

    strengths = [pid for pid, r in by_id.items() if r.meets_level == "meets"]
    improvements = [pid for pid, r in by_id.items() if r.meets_level in ("partially_meets", "does_not_meet")]
    unknowns = [pid for pid, r in by_id.items() if r.meets_level == "insufficient_info"]

    lines.append("## Summary")
    lines.append("")
    if strengths:
        titles = [get_principle(pid).title for pid in strengths]
        lines.append("### Strong alignment")
        lines.extend([f"- ({pid}) {title}" for pid, title in zip(strengths, titles)])
        lines.append("")
    if improvements:
        titles = [get_principle(pid).title for pid in improvements]
        lines.append("### Improve / address gaps")
        lines.extend([f"- ({pid}) {title}" for pid, title in zip(improvements, titles)])
        lines.append("")
    if unknowns:
        titles = [get_principle(pid).title for pid in unknowns]
        lines.append("### Insufficient information (clarify in task/brief)")
        lines.extend([f"- ({pid}) {title}" for pid, title in zip(unknowns, titles)])
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
        selected_principles = [p for p in PRINCIPLES if p.id in selected_ids]

        results = session.exec(
            select(PrincipleResult).where(PrincipleResult.run_id == run_id).order_by(PrincipleResult.principle_id)
        ).all()
        if len(results) != len(selected_principles):
            raise ValueError(f"Run does not yet have {len(selected_principles)} principle results (has {len(results)})")

        report_md = _build_report_markdown(run=run, results=list(results), selected_principles=selected_principles)

        report = Report(run_id=run_id, report_markdown=report_md)
        session.add(report)
        session.commit()

    return report_md

