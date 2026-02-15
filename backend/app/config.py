from __future__ import annotations

from dataclasses import dataclass
import os

from dotenv import load_dotenv


def _split_csv(value: str) -> list[str]:
    return [v.strip() for v in value.split(",") if v.strip()]


@dataclass(frozen=True)
class Settings:
    openai_api_key: str | None
    openai_model: str
    openai_timeout_seconds: float
    openai_max_retries: int
    database_url: str
    allowed_origins: list[str]
    eval_max_concurrency: int


def get_settings() -> Settings:
    # Load from backend/env.example -> backend/.env pattern, but avoid dotfile creation constraints.
    load_dotenv(override=False)

    return Settings(
        openai_api_key=os.getenv("OPENAI_API_KEY", "").strip() or None,
        openai_model=os.getenv("OPENAI_MODEL", "gpt-5.2").strip(),
        openai_timeout_seconds=float(os.getenv("OPENAI_TIMEOUT_SECONDS", "60").strip()),
        openai_max_retries=int(os.getenv("OPENAI_MAX_RETRIES", "2").strip()),
        database_url=os.getenv("DATABASE_URL", "sqlite:///./app.db").strip(),
        allowed_origins=_split_csv(os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,https://assessment-principles-1.onrender.com")),
        eval_max_concurrency=int(os.getenv("EVAL_MAX_CONCURRENCY", "4").strip()),
    )

