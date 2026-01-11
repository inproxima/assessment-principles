from __future__ import annotations

from dataclasses import dataclass
import json
import sys
import time
from typing import Any

from openai import OpenAI
import openai


@dataclass(frozen=True)
class OpenAIClientConfig:
    timeout_seconds: float
    max_retries: int


class OpenAIClient:
    def __init__(self, cfg: OpenAIClientConfig):
        self._cfg = cfg
        # The OpenAI client automatically picks up OPENAI_API_KEY from the environment.
        # We keep SDK retries disabled and handle retries/backoff in this wrapper.
        try:
            self._client = OpenAI(timeout=cfg.timeout_seconds, max_retries=0)
        except Exception as e:
            raise RuntimeError(
                "Failed to initialize OpenAI client.\n"
                f"- python: {sys.executable}\n"
                f"- openai: {getattr(openai, '__version__', 'unknown')}\n"
                "Common fixes:\n"
                "- Ensure OPENAI_API_KEY is set\n"
                "- Run the backend from the repo venv:\n"
                "  backend/venv/bin/python -m pip install -r backend/requirements.txt\n"
                "  backend/venv/bin/python -m uvicorn app.main:app --reload --port 8000\n"
            ) from e

        if not hasattr(self._client, "responses"):
            raise RuntimeError(
                "Your installed openai Python package does not support the Responses API.\n"
                f"- python: {sys.executable}\n"
                f"- openai: {getattr(openai, '__version__', 'unknown')}\n"
                "Fix: run the backend using the repo venv (which pins openai==2.15.0):\n"
                "- backend/venv/bin/python -m pip install -r backend/requirements.txt\n"
                "- backend/venv/bin/python -m uvicorn app.main:app --reload --port 8000\n"
            )

    def responses_text(
        self,
        *,
        system: str,
        user: str,
        max_output_tokens: int,
    ) -> str:
        """
        Uses the Responses API and returns concatenated output text.
        Retries (simple backoff) are handled here so higher-level code stays clean.
        """
        last_err: Exception | None = None
        for attempt in range(self._cfg.max_retries + 1):
            try:
                resp = self._client.responses.create(
                    model="gpt-5.2",
                    input=f"{system}\n\n{user}",
                    max_output_tokens=max_output_tokens,
                )
                text = (getattr(resp, "output_text", None) or "").strip()
                if text:
                    return text
                # Fallback: attempt to extract from response JSON
                return json.dumps(resp.model_dump(), ensure_ascii=False)
            except Exception as e:
                last_err = e
                if attempt >= self._cfg.max_retries:
                    break
                time.sleep(min(2**attempt, 8))
        raise RuntimeError(f"OpenAI call failed after retries: {last_err}") from last_err

    def responses_json(
        self,
        *,
        system: str,
        user: str,
        max_output_tokens: int,
    ) -> dict[str, Any]:
        text = self.responses_text(
            system=system,
            user=user,
            max_output_tokens=max_output_tokens,
        )
        try:
            return json.loads(text)
        except Exception:
            # Some models wrap JSON in fences; attempt a minimal cleanup.
            cleaned = text.strip()
            cleaned = cleaned.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            return json.loads(cleaned)

