from __future__ import annotations

import json
import re
from typing import Annotated, Any, TypedDict

from langchain_core.messages import AIMessage, AnyMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

from agent.crm import CrmClient
from agent.settings import settings
from agent.tools import TOOLS, crm_var
from agent.ui import parts_for_turn


class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    user_id: str
    thread_id: str
    api_base: str
    internal_token: str
    ui_parts: list[dict[str, Any]]
    memories: list[dict[str, str]]


SYSTEM = """You are Tally, Ledger's internal sales desk assistant.

Tools return live CRM data. Never invent customer or sale IDs.

How to answer:
- If the user asks about customers, sales, pipeline, or totals, you MUST call the matching read tool so a UI widget can render. Never answer CRM figures from memory.
- Call only the read tool that answers this question. Do not fetch extra context (no dashboard + pipeline + search in the same turn unless the user asked for all of that).
- After tools return, stop. Do not call more tools just to be thorough.
- Records and figures belong in generated UI. Spoken reply: one short sentence of context, not a second copy of the data. Do not list stages, customers, sales, or dollar amounts in markdown when a widget will render.
- Never emit JSON, tool traces, or a facts object.
- Write tools require the user to approve in the UI — call them only when the user clearly asks to change data.

Known facts about this seller:
{memories}
"""


def _llm(session_id: str | None = None) -> ChatOpenAI:
    headers = {"User-Agent": "ledger-tally/1.0"}
    if session_id:
        headers["x-opencode-session"] = session_id
    return ChatOpenAI(
        model=settings.llm_model,
        api_key=settings.llm_api_key or "missing",
        base_url=settings.llm_base_url,
        temperature=0.2,
        streaming=True,
        default_headers=headers,
        extra_body={"thinking": {"type": "disabled"}},
    )


async def guard(state: AgentState) -> dict[str, Any]:
    crm_var.set(CrmClient(state["api_base"], state["internal_token"], state["user_id"]))
    return {"ui_parts": []}


async def reasoner(state: AgentState) -> dict[str, Any]:
    crm_var.set(CrmClient(state["api_base"], state["internal_token"], state["user_id"]))
    bound = _llm(state.get("thread_id")).bind_tools(TOOLS)
    facts = state.get("memories") or []
    memory_block = "\n".join(f"- {f.get('key')}: {f.get('value')}" for f in facts) or "- none yet"
    messages = [SystemMessage(content=SYSTEM.format(memories=memory_block)), *state["messages"]]
    reply = await bound.ainvoke(messages)
    return {"messages": [reply]}


async def render(state: AgentState) -> dict[str, Any]:
    return {"ui_parts": parts_for_turn(state["messages"])}


async def memory_write(state: AgentState) -> dict[str, Any]:
    last_human = next((m for m in reversed(state["messages"]) if isinstance(m, HumanMessage)), None)
    last_ai = next((m for m in reversed(state["messages"]) if isinstance(m, AIMessage) and m.content), None)
    if not last_human or not last_ai or not settings.llm_api_key:
        return {}
    prompt = (
        "Extract 0-3 durable operational facts about the seller's book of business. "
        'Return JSON {"facts":[{"key":"","value":""}]}. '
        "No passwords. Empty list if nothing durable.\n\n"
        f"User: {last_human.content}\nAssistant: {last_ai.content}"
    )
    try:
        raw = await _llm(state.get("thread_id")).ainvoke(
            [HumanMessage(content=prompt)],
            config={"tags": ["internal", "memory"], "run_name": "memory_extract"},
        )
        text = raw.content if isinstance(raw.content, str) else str(raw.content)
        match = re.search(r"\{.*\}", text, re.S)
        if not match:
            return {}
        parsed = json.loads(match.group(0))
        facts = parsed.get("facts") or []
        if not facts:
            return {}
        crm = CrmClient(state["api_base"], state["internal_token"], state["user_id"])
        await crm.post("/agent/memories", {"threadId": state["thread_id"], "facts": facts[:3]})
    except Exception:
        return {}
    return {}


def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("guard", guard)
    graph.add_node("reasoner", reasoner)
    tool_node = ToolNode(TOOLS)

    async def tools(state: AgentState) -> dict[str, Any]:
        crm_var.set(CrmClient(state["api_base"], state["internal_token"], state["user_id"]))
        return await tool_node.ainvoke(state)

    graph.add_node("tools", tools)
    graph.add_node("render", render)
    graph.add_node("memory_write", memory_write)
    graph.add_edge(START, "guard")
    graph.add_edge("guard", "reasoner")
    graph.add_conditional_edges("reasoner", tools_condition, {"tools": "tools", END: "render"})
    graph.add_edge("tools", "reasoner")
    graph.add_edge("render", "memory_write")
    graph.add_edge("memory_write", END)
    return graph


def compile_graph(checkpointer: Any):
    return build_graph().compile(checkpointer=checkpointer)
