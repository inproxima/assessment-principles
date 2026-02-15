from __future__ import annotations

from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine

from app.config import get_settings


_settings = get_settings()

# SQLite needs check_same_thread=False for multi-thread usage (we run parallel OpenAI calls).
connect_args = {"check_same_thread": False} if _settings.database_url.startswith("sqlite") else {}
engine = create_engine(_settings.database_url, echo=False, connect_args=connect_args)


def _column_names(table: str) -> set[str]:
    """Return the set of existing column names for *table*, works on SQLite & PostgreSQL."""
    with engine.connect() as conn:
        dialect = engine.dialect.name
        if dialect == "sqlite":
            rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
            # PRAGMA table_info returns rows like: (cid, name, type, notnull, dflt_value, pk)
            return {r[1] for r in rows}
        else:
            # PostgreSQL (and most other engines) – query information_schema
            rows = conn.execute(
                text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_name = :table"
                ),
                {"table": table},
            ).fetchall()
            return {r[0] for r in rows}


def _add_column_if_missing(*, table: str, column: str, ddl_type: str) -> None:
    cols = _column_names(table)
    if column in cols:
        return
    with engine.connect() as conn:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type}"))
        conn.commit()


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    # Lightweight migration: SQLModel create_all doesn't add new columns to existing tables,
    # so we handle that for both SQLite and PostgreSQL.
    _missing_cols = (
        "course_level", "modality", "discipline",
        "assessment_type", "learning_outcome", "selected_principles",
    )
    for col in _missing_cols:
        _add_column_if_missing(table="runs", column=col, ddl_type="TEXT")


def get_session() -> Session:
    return Session(engine)

