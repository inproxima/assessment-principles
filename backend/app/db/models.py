from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Run(SQLModel, table=True):
    __tablename__ = "runs"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    created_at: datetime = Field(default_factory=_utcnow, index=True)

    input_type: str  # task|description
    source: str  # text|upload

    # Course context (required at input-time; nullable for backward compatibility with existing DB rows)
    course_level: Optional[str] = None  # undergraduate|graduate
    modality: Optional[str] = None  # online|in_person|hybrid
    discipline: Optional[str] = None
    assessment_type: Optional[str] = None  # formative|summative
    learning_outcome: Optional[str] = None

    original_text: str
    generated_description: Optional[str] = None

    model: str
    status: str = Field(default="created", index=True)  # created|evaluating|completed|failed
    error: Optional[str] = None


class PrincipleResult(SQLModel, table=True):
    __tablename__ = "principle_results"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    created_at: datetime = Field(default_factory=_utcnow, index=True)

    run_id: str = Field(index=True, foreign_key="runs.id")
    principle_id: str = Field(index=True)  # a..k
    principle_title: str

    json_output: str
    meets_level: str = Field(index=True)


class Report(SQLModel, table=True):
    __tablename__ = "reports"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    created_at: datetime = Field(default_factory=_utcnow, index=True)

    run_id: str = Field(index=True, foreign_key="runs.id")
    report_markdown: str

