from __future__ import annotations

import json
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command
from pydantic import BaseModel, Field

from agent.crm import CrmClient
from agent.graph import compile_graph
from agent.settings import settings
from agent.tools import crm_var
from agent.trace import enable_tracing

graph_app = None


def _db_uri() -> str:
    url = settings.database_url.replace("postgres://", "postgresql://", 1)
    if "search_path" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}options=-csearch_path%3Dlanggraph"
    return url


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global graph_app
    enable_tracing()
    checkpointer: Any = MemorySaver()
    try:
        from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

        saver = AsyncPostgresSaver.from_conn_string(_db_uri())
        checkpointer = await saver.__aenter__()
        await checkpointer.setup()
        graph_app = compile_graph(checkpointer)
        yield
        await saver.__aexit__(None, None, None)
        return
    except Exception:
        graph_app = compile_graph(MemorySaver())
        yield


app = FastAPI(title="Tally", lifespan=lifespan)


class ChatIn(BaseModel):
    message: str | None = None
    threadId: str | None = None
    thread_id: str | None = None
    user_id: str
    api_base: str
    internal_token: str
    decision: str | None = None
    request_origin: str | None = None


class ResumeIn(ChatIn):
    decision: str = Field(pattern="^(approve|reject)$")


def _assert_token(token: str | None) -> None:
    if not settings.agent_internal_token or token != settings.agent_internal_token:
        raise HTTPException(status_code=401, detail="Invalid internal token")


def sse(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _stream_text(chunk: Any) -> str:
    content = getattr(chunk, "content", None)
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        bits: list[str] = []
        for part in content:
            if isinstance(part, str):
                bits.append(part)
            elif isinstance(part, dict):
                bits.append(str(part.get("text") or ""))
            else:
                bits.append(str(getattr(part, "text", "") or ""))
        return "".join(bits)
    return ""


def _is_reasoner_stream(event: dict[str, Any]) -> bool:
    tags = event.get("tags") or []
    if "memory" in tags or "internal" in tags:
        return False
    node = (event.get("metadata") or {}).get("langgraph_node")
    if node:
        return node == "reasoner"
    return True


async def _memories(api_base: str, token: str, user_id: str) -> list[dict[str, str]]:
    try:
        crm = CrmClient(api_base, token, user_id)
        payload = await crm.get("/agent/memories")
        rows = payload.get("data") or []
        return [{"key": r["key"], "value": r["value"]} for r in rows]
    except Exception:
        return []


async def stream_graph(payload: ChatIn, resume: bool) -> AsyncIterator[bytes]:
    assert graph_app is not None
    thread_id = payload.thread_id or payload.threadId or f"thread:{payload.user_id}"
    yield sse("thread", {"threadId": thread_id}).encode()

    if not settings.llm_api_key:
        yield sse("error", {"message": "OPENCODE_GO_API_KEY is not configured"}).encode()
        yield sse("done", {"ok": False}).encode()
        return

    crm_var.set(CrmClient(payload.api_base, payload.internal_token, payload.user_id))
    config = {"configurable": {"thread_id": thread_id}}
    memories = await _memories(payload.api_base, payload.internal_token, payload.user_id)

    if resume:
        incoming: Any = Command(resume={"decision": payload.decision})
    else:
        incoming = {
            "messages": [HumanMessage(content=payload.message or "")],
            "user_id": payload.user_id,
            "thread_id": thread_id,
            "api_base": payload.api_base,
            "internal_token": payload.internal_token,
            "ui_parts": [],
            "memories": memories,
        }

    try:
        async for event in graph_app.astream_events(incoming, config, version="v2"):
            kind = event.get("event")
            if kind == "on_chat_model_stream":
                if not _is_reasoner_stream(event):
                    continue
                text = _stream_text(event.get("data", {}).get("chunk"))
                if text:
                    yield sse("token", {"text": text}).encode()
            elif kind == "on_tool_start":
                yield sse("tool", {"name": event.get("name"), "status": "start"}).encode()
            elif kind == "on_tool_end":
                yield sse("tool", {"name": event.get("name"), "status": "end"}).encode()

        state = await graph_app.aget_state(config)
        interrupts = getattr(state, "interrupts", None) or []
        if interrupts:
            raw = interrupts[0]
            value = getattr(raw, "value", raw)
            if isinstance(value, dict):
                yield sse("interrupt", value).encode()
                if value.get("ui"):
                    yield sse("ui", {"part": value["ui"]}).encode()
        values = state.values if hasattr(state, "values") else {}
        for part in values.get("ui_parts") or []:
            yield sse("ui", {"part": part}).encode()
        yield sse("done", {"ok": True}).encode()
    except Exception as exc:
        yield sse("error", {"message": str(exc)}).encode()
        yield sse("done", {"ok": False}).encode()


@app.get("/health")
def health():
    return {"ok": True, "llm": bool(settings.llm_api_key)}


@app.post("/chat")
async def chat(payload: ChatIn, x_internal_token: str | None = Header(default=None)):
    _assert_token(x_internal_token)
    return StreamingResponse(stream_graph(payload, resume=False), media_type="text/event-stream")


@app.post("/resume")
async def resume(payload: ResumeIn, x_internal_token: str | None = Header(default=None)):
    _assert_token(x_internal_token)
    return StreamingResponse(stream_graph(payload, resume=True), media_type="text/event-stream")
