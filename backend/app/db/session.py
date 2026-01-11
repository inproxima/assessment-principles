from __future__ import annotations

from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine

from app.config import get_settings


_settings = get_settings()

# SQLite needs check_same_thread=False for multi-thread usage (we run parallel OpenAI calls).
connect_args = {"check_same_thread": False} if _settings.database_url.startswith("sqlite") else {}
engine = create_engine(_settings.database_url, echo=False, connect_args=connect_args)


def _sqlite_column_names(table: str) -> set[str]:
    with engine.connect() as conn:
        rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
    # PRAGMA table_info returns rows like: (cid, name, type, notnull, dflt_value, pk)
    return {r[1] for r in rows}


def _sqlite_add_column_if_missing(*, table: str, column: str, ddl_type: str) -> None:
    cols = _sqlite_column_names(table)
    if column in cols:
        return
    with engine.connect() as conn:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type}"))
        conn.commit()


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    # Lightweight migration for local SQLite DBs (SQLModel create_all doesn't add columns).
    if engine.dialect.name == "sqlite":
        for col in ("course_level", "modality", "discipline", "assessment_type", "learning_outcome"):
            _sqlite_add_column_if_missing(table="runs", column=col, ddl_type="TEXT")


def get_session() -> Session:
    return Session(engine)

