from __future__ import annotations

import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

from sqlmodel import delete

from sqlmodel import select

from app.config import get_settings
from app.db.models import PrincipleResult, Run
from app.db.session import get_session
from app.principles.ucalgary_principles import PRINCIPLES, Principle
from app.services.openai_client import OpenAIClient, OpenAIClientConfig


MEETS_LEVEL_VALUES = {"meets", "partially_meets", "does_not_meet", "insufficient_info"}


def _count_words(s: str) -> int:
    # Basic word count: sequences separated by whitespace.
    return len([w for w in re.split(r"\s+", (s or "").strip()) if w])


def _count_words_in_json(obj: dict[str, Any]) -> int:
    parts: list[str] = []
    for k, v in obj.items():
        if isinstance(v, str):
            parts.append(v)
        elif isinstance(v, (int, float)):
            parts.append(str(v))
        elif v is None:
            continue
        else:
            parts.append(json.dumps(v, ensure_ascii=False))
    return _count_words(" ".join(parts))


def _get_openai() -> OpenAIClient:
    s = get_settings()
    if not s.openai_api_key:
        raise RuntimeError("Missing OPENAI_API_KEY in environment")
    return OpenAIClient(
        OpenAIClientConfig(
            timeout_seconds=s.openai_timeout_seconds,
            max_retries=s.openai_max_retries,
        )
    )


def _course_context_for_run(run: Run) -> str:
    """
    Returns a stable, human-readable course context block that must be included
    in all OpenAI calls for this run.
    """
    level = (run.course_level or "").strip() or "unknown"
    modality = (run.modality or "").strip() or "unknown"
    discipline = (run.discipline or "").strip() or "unknown"
    assessment_type = (run.assessment_type or "").strip() or "unknown"
    lo = (run.learning_outcome or "").strip() or "unknown"
    return (
        "Course context:\n"
        f"- Course level: {level}\n"
        f"- Modality: {modality}\n"
        f"- Discipline: {discipline}\n"
        f"- Assessment type: {assessment_type}\n"
        f"- Learning outcome: {lo}\n"
    )


def _describe_task(*, course_context: str, task_text: str) -> str:
    oai = _get_openai()
    system = (
        "You are an educational assessment analyst. Convert an assessment task into a concise, neutral description.\n"
        "Do not add requirements not present. Use plain language."
    )
    user = (
        f"{course_context}\n"
        "Assessment task:\n"
        f"{task_text}\n\n"
        "Return a concise description (120-200 words)."
    )
    # generous cap; this is not constrained to 50 words
    return oai.responses_text(system=system, user=user, max_output_tokens=450)


def _principle_prompt(
    *,
    course_context: str,
    description: str,
    p: Principle,
    stricter: bool,
) -> tuple[str, str, int]:
    system = (
        "You evaluate an assessment description against ONE assessment principle.\n"
        "Return JSON only (no markdown, no code fences).\n"
        "Only use the information explicitly provided in the course context and assessment description."
        f"use the learning outcome in the {course_context} to speak to how the assessment meets or doesn't meet the principle."
        "Also look for specific markers in the assessment description that supports the principle."
        "If the assessment is poorly structured, poorly written, or poorly designed, it is likely to not meet the principle."
        "The goal is provide feedback on how the assessment meets the principle, and if it doesn't, what are teh next steps to improve the assessment."
    )
    schema = (
        '{\n'
        '  "principle_id": "a..k",\n'
        '  "meets_level": "meets|partially_meets|does_not_meet|insufficient_info",\n'
        '  "evidence": "what in the description supports your rating",\n'
        '  "gaps": "explicit shortcomings evidenced in the provided inputs (not missing info)",\n'
        '  "recommendation": "one concrete improvement suggestion (only if supported by provided inputs)"\n'
        "}"
    )

    constraint = (
        "Constraints:\n"
        "- Total response must be <= 50 words across ALL JSON string values.\n"
        "- Keep each field extremely short.\n"
        "- Assume the ONLY available inputs are: course context (level/modality/discipline/learning outcome) + assessment description.\n"
        "- Do NOT treat absence of other documents/policies/supports/details as a 'gap'.\n"
        "- A 'gap' must be supported by explicit text in the provided inputs (e.g., a stated policy that conflicts with the principle).\n"
        "- If there is not enough information to judge the principle from the available inputs, use meets_level='insufficient_info'.\n"
        "- Never say 'missing', 'not mentioned', 'not stated', 'unclear', 'not provided', etc.\n"
        "- For meets_level='insufficient_info': set evidence/gaps/recommendation to 'N/A'.\n"
    )
    if stricter:
        constraint += "- Use sentence fragments; avoid filler words.\n"

    user = (
        f"{course_context}\n"
        f"Assessment description:\n{description}\n\n"
        f"Principle ({p.id}): {p.title}\n"
        f"Principle description: {p.description}\n\n"
        f"{constraint}\n"
        f"Output JSON schema:\n{schema}\n"
    )

    # Tight output token cap to help enforce <=50 words.
    max_out = 160 if not stricter else 130
    return system, user, max_out


def _evaluate_one_principle(*, course_context: str, description: str, p: Principle) -> dict[str, Any]:
    oai = _get_openai()
    for attempt in range(2):  # initial + 1 retry with stricter instructions
        system, user, max_out = _principle_prompt(
            course_context=course_context,
            description=description,
            p=p,
            stricter=(attempt == 1),
        )
        obj = oai.responses_json(system=system, user=user, max_output_tokens=max_out)

        # Normalize
        obj["principle_id"] = p.id
        meets = (obj.get("meets_level") or "").strip()
        if meets not in MEETS_LEVEL_VALUES:
            obj["meets_level"] = "insufficient_info"

        # Guardrail: do not allow "absence-as-gap" language.
        # If the model talks about missing/unspecified info, treat the principle as not judgeable from inputs.
        def _mentions_absence(s: str) -> bool:
            s = (s or "").lower()
            return any(
                ptn in s
                for ptn in (
                    "missing",
                    "not mentioned",
                    "not stated",
                    "not provided",
                    "not specified",
                    "unclear",
                    "unknown",
                    "no rubric",
                    "no grading",
                    "no policy",
                    "no policies",
                )
            )

        if any(
            isinstance(obj.get(k), str) and _mentions_absence(obj.get(k))  # type: ignore[arg-type]
            for k in ("evidence", "gaps", "recommendation")
        ):
            obj["meets_level"] = "insufficient_info"
            obj["evidence"] = "N/A"
            obj["gaps"] = "N/A"
            obj["recommendation"] = "N/A"

        # Hard word-limit enforcement
        wc = _count_words_in_json(obj)
        if wc <= 50:
            obj["_word_count"] = wc
            return obj
    # If still too long, trim aggressively by truncating strings.
    for key in ("evidence", "gaps", "recommendation"):
        if isinstance(obj.get(key), str):
            words = [w for w in re.split(r"\s+", obj[key].strip()) if w]
            obj[key] = " ".join(words[:10])
    obj["_word_count"] = _count_words_in_json(obj)
    return obj


def _generate_narrative_feedback(
    *,
    course_context: str,
    description: str,
    principle_results: list[dict[str, Any]],
    principles_evaluated: list[Principle],
) -> tuple[str, str]:
    """
    Generate two narrative feedback sections from the principle evaluation results.

    Returns (alignment_text, continue_journey_text).
    """
    oai = _get_openai()

    # Build a summary of results for the prompt
    results_summary_parts: list[str] = []
    counts: dict[str, int] = {"meets": 0, "partially_meets": 0, "does_not_meet": 0, "insufficient_info": 0}

    for p in principles_evaluated:
        result = next((r for r in principle_results if r.get("principle_id") == p.id), None)
        if not result:
            continue
        level = result.get("meets_level", "insufficient_info")
        counts[level] = counts.get(level, 0) + 1
        evidence = result.get("evidence", "N/A")
        gaps = result.get("gaps", "N/A")
        recommendation = result.get("recommendation", "N/A")
        results_summary_parts.append(
            f"Principle ({p.id}): {p.title}\n"
            f"  Description: {p.description}\n"
            f"  Rating: {level}\n"
            f"  Evidence: {evidence}\n"
            f"  Gaps: {gaps}\n"
            f"  Recommendation: {recommendation}"
        )

    executive_summary = (
        f"Executive summary:\n"
        f"- Meets: {counts['meets']} / {len(principles_evaluated)}\n"
        f"- Partially meets: {counts['partially_meets']} / {len(principles_evaluated)}\n"
        f"- Does not meet: {counts['does_not_meet']} / {len(principles_evaluated)}\n"
        f"- Insufficient info: {counts['insufficient_info']} / {len(principles_evaluated)}\n"
    )

    results_block = "\n\n".join(results_summary_parts)

    system = (
        "You are a warm, knowledgeable educational assessment consultant writing narrative feedback for a university instructor.\n"
        "Your tone is encouraging, collegial, and constructive. You write in second person (\"you\", \"your assessment\").\n"
        "You never use bullet points or numbered lists. Write in flowing, well-structured paragraphs.\n"
        "You ground every observation in the specific assessment and course context provided.\n\n"
        "You will produce exactly two sections of feedback in JSON format:\n"
        '1. "alignment" — Celebrate what the assessment does well. Explain which assessment principles are met and WHY, '
        "referencing specific elements of the assessment. The tone should be affirming and encouraging, explicitly naming strengths. "
        "Only discuss principles that are rated 'meets'. If none meet, acknowledge the potential you see and the foundations already present.\n\n"
        '2. "continue_the_journey" — Offer constructive recommendations to strengthen the assessment. '
        "Approach from a place of strength — acknowledge what is already working, then suggest how to build on it. "
        "Focus on principles rated 'partially_meets' or 'does_not_meet'. "
        "Provide concrete, actionable examples tailored to the discipline, course level, and assessment type. "
        "Be helpful and specific — give the instructor ideas they can implement. "
        "If a principle has 'insufficient_info', do NOT treat it as a gap; skip it.\n\n"
        "Return JSON only (no markdown fences):\n"
        '{"alignment": "...", "continue_the_journey": "..."}\n'
        "Each section should be 150-300 words of flowing narrative paragraphs."
    )

    user = (
        f"{course_context}\n"
        f"Assessment description:\n{description}\n\n"
        f"{executive_summary}\n"
        f"Principle-by-principle evaluation results:\n{results_block}\n"
    )

    obj = oai.responses_json(system=system, user=user, max_output_tokens=2000)
    alignment = (obj.get("alignment") or "").strip()
    continue_journey = (obj.get("continue_the_journey") or "").strip()
    return alignment, continue_journey


def evaluate_run(run_id: str) -> None:
    """
    Background task:
    - Determine description (generate if run.input_type == 'task')
    - Run 11 principle evaluations and persist results
    - Mark run completed/failed
    """
    settings = get_settings()
    try:
        with get_session() as session:
            run = session.get(Run, run_id)
            if not run:
                return

            # Clear any prior results for idempotency
            session.exec(delete(PrincipleResult).where(PrincipleResult.run_id == run_id))
            session.commit()

            course_context = _course_context_for_run(run)
            if run.input_type == "task":
                desc = _describe_task(course_context=course_context, task_text=run.original_text)
                run.generated_description = desc
            else:
                desc = run.original_text

            # Capture values we need after the session closes
            selected_principles_csv = run.selected_principles

            run.status = "evaluating"
            run.error = None
            session.add(run)
            session.commit()

        # Determine which principles to evaluate
        if selected_principles_csv:
            selected_ids = set(selected_principles_csv.split(","))
        else:
            selected_ids = {p.id for p in PRINCIPLES}
        principles_to_eval = [p for p in PRINCIPLES if p.id in selected_ids]

        max_workers = max(1, int(settings.eval_max_concurrency))
        futures = {}
        with ThreadPoolExecutor(max_workers=max_workers) as pool:
            for p in principles_to_eval:
                futures[pool.submit(_evaluate_one_principle, course_context=course_context, description=desc, p=p)] = p

            for fut in as_completed(futures):
                p = futures[fut]
                obj = fut.result()
                meets_level = (obj.get("meets_level") or "insufficient_info").strip()
                with get_session() as session:
                    pr = PrincipleResult(
                        run_id=run_id,
                        principle_id=p.id,
                        principle_title=p.title,
                        json_output=json.dumps(obj, ensure_ascii=False, separators=(",", ":")),
                        meets_level=meets_level,
                    )
                    session.add(pr)
                    session.commit()

        # Generate narrative feedback from the collected principle results
        with get_session() as session:
            pr_rows = session.exec(
                select(PrincipleResult).where(PrincipleResult.run_id == run_id)
            ).all()
            collected_results = [json.loads(r.json_output) for r in pr_rows]

        alignment, continue_journey = _generate_narrative_feedback(
            course_context=course_context,
            description=desc,
            principle_results=collected_results,
            principles_evaluated=principles_to_eval,
        )

        # Mark complete and store narrative
        with get_session() as session:
            run = session.get(Run, run_id)
            if run:
                run.narrative_alignment = alignment
                run.narrative_continue_journey = continue_journey
                run.status = "completed"
                session.add(run)
                session.commit()
    except Exception as e:
        with get_session() as session:
            run = session.get(Run, run_id)
            if run:
                run.status = "failed"
                run.error = str(e)
                session.add(run)
                session.commit()

