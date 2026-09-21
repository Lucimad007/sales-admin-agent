from __future__ import annotations

import os

from agent.settings import settings


def enable_tracing() -> None:
    """Opt-in LangSmith. No-op without LANGSMITH_API_KEY / LANGCHAIN_API_KEY."""
    key = (settings.langsmith_api_key or os.environ.get("LANGCHAIN_API_KEY") or "").strip()
    if not key:
        return
    os.environ.setdefault("LANGCHAIN_TRACING_V2", "true")
    os.environ["LANGCHAIN_API_KEY"] = key
    os.environ.setdefault("LANGCHAIN_PROJECT", settings.langsmith_project)
