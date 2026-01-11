from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db.session import init_db
from app.api.runs import router as runs_router


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(title="Assessment Principles Evaluator", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.on_event("startup")
    def _startup() -> None:
        init_db()

    app.include_router(runs_router)

    return app


app = create_app()

