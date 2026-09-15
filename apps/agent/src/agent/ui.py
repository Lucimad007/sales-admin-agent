from __future__ import annotations

import json
from typing import Any
from uuid import uuid4

_UI_RANK = {
    "ConfirmAction": 10,
    "CustomerCard": 3,
    "CustomerList": 3,
    "SalesTable": 3,
    "PipelineSummary": 2,
    "KpiStrip": 1,
    "Markdown": 0,
}

_LIST_CAP = 8


def _id() -> str:
    return str(uuid4())


def money(value: Any) -> str:
    try:
        return f"{float(value):.2f}"
    except (TypeError, ValueError):
        return "0.00"


def customer_name(row: dict[str, Any]) -> str:
    if "firstName" in row:
        return f"{row.get('firstName', '')} {row.get('lastName', '')}".strip()
    customer = row.get("customer") or {}
    return f"{customer.get('firstName', '')} {customer.get('lastName', '')}".strip() or "Unknown"


def _payload_data(payload: Any) -> Any:
    if not isinstance(payload, dict):
        return payload
    return payload.get("data", payload)


def _customer_card(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": _id(),
        "type": "CustomerCard",
        "props": {
            "id": row.get("id", ""),
            "firstName": row.get("firstName", ""),
            "lastName": row.get("lastName", ""),
            "email": row.get("email", ""),
            "phone": row.get("phone", ""),
            "address": row.get("address", ""),
        },
    }


def _list_row(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id", ""),
        "firstName": row.get("firstName", ""),
        "lastName": row.get("lastName", ""),
        "email": row.get("email", ""),
        "phone": row.get("phone", ""),
    }


def map_tool_result(name: str, payload: Any) -> dict[str, Any] | None:
    data = _payload_data(payload)
    if data is None:
        return None
    if isinstance(data, dict) and data.get("cancelled"):
        return None

    if name == "get_dashboard_stats" and isinstance(data, dict):
        return {
            "id": _id(),
            "type": "KpiStrip",
            "props": {
                "items": [
                    {"label": "Customers", "value": str(data.get("totalCustomers", 0))},
                    {"label": "Sales", "value": str(data.get("totalSales", 0))},
                    {"label": "Revenue", "value": money(data.get("totalRevenue", "0.00"))},
                ]
            },
        }

    if name in {"search_customers", "get_customer", "create_customer", "update_customer"}:
        rows = data if isinstance(data, list) else [data]
        rows = [row for row in rows if isinstance(row, dict) and row.get("id")]
        if not rows:
            return None
        if len(rows) == 1:
            return _customer_card(rows[0])
        return {
            "id": _id(),
            "type": "CustomerList",
            "props": {"rows": [_list_row(row) for row in rows[:_LIST_CAP]]},
        }

    if name in {"search_sales", "create_sale", "update_sale_status", "add_sale_note"}:
        rows = data if isinstance(data, list) else [data]
        table_rows = []
        for row in rows[:_LIST_CAP]:
            if not isinstance(row, dict) or not row.get("id"):
                continue
            table_rows.append(
                {
                    "id": row.get("id", ""),
                    "productName": row.get("productName", ""),
                    "customerName": customer_name(row),
                    "price": money(row.get("price")),
                    "status": row.get("status", "new"),
                    "createdAt": row.get("createdAt", ""),
                }
            )
        if table_rows:
            return {"id": _id(), "type": "SalesTable", "props": {"rows": table_rows}}

    if name == "get_pipeline" and isinstance(data, dict):
        columns = data.get("columns") or []
        return {"id": _id(), "type": "PipelineSummary", "props": {"columns": columns}}

    return None


def _merge_customer_widgets(parts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    customer_parts = [p for p in parts if p.get("type") in {"CustomerCard", "CustomerList"}]
    others = [p for p in parts if p.get("type") not in {"CustomerCard", "CustomerList"}]
    if not customer_parts:
        return parts

    rows: list[dict[str, Any]] = []
    cards_by_id: dict[str, dict[str, Any]] = {}
    seen: set[str] = set()

    def add_row(row: dict[str, Any], card: dict[str, Any] | None = None) -> None:
        rid = str(row.get("id") or "")
        if not rid:
            return
        if card:
            cards_by_id[rid] = card
        if rid in seen:
            return
        seen.add(rid)
        rows.append(_list_row(row))

    for part in customer_parts:
        if part.get("type") == "CustomerList":
            for row in part.get("props", {}).get("rows", []):
                if isinstance(row, dict):
                    add_row(row)
        else:
            props = part.get("props") or {}
            if isinstance(props, dict):
                add_row(props, card=part)

    if len(rows) == 1:
        rid = rows[0]["id"]
        widget = cards_by_id.get(rid) or _customer_card({**rows[0], "address": ""})
        return [widget, *others]
    return [
        {"id": _id(), "type": "CustomerList", "props": {"rows": rows[:_LIST_CAP]}},
        *others,
    ]


def select_turn_ui(parts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """One data widget for the turn, plus any confirm card. Drops leftover KPIs/pipeline."""
    merged = _merge_customer_widgets(parts)
    confirms = [p for p in merged if p.get("type") == "ConfirmAction"]
    data = [p for p in merged if p.get("type") != "ConfirmAction"]
    if not data:
        return confirms
    best = max(_UI_RANK.get(str(p.get("type") or ""), 0) for p in data)
    chosen: dict[str, Any] | None = None
    for part in data:
        if _UI_RANK.get(str(part.get("type") or ""), 0) == best:
            chosen = part
    out = [chosen] if chosen else []
    out.extend(confirms)
    return out


def parts_for_turn(messages: list[Any]) -> list[dict[str, Any]]:
    last_human = -1
    for i, message in enumerate(messages):
        if getattr(message, "type", None) == "human":
            last_human = i
    mapped: list[dict[str, Any]] = []
    for message in messages[last_human + 1 :]:
        if getattr(message, "type", None) != "tool":
            continue
        name = getattr(message, "name", "") or ""
        raw = getattr(message, "content", "")
        try:
            payload = json.loads(raw) if isinstance(raw, str) else raw
        except Exception:
            payload = {"data": raw}
        part = map_tool_result(name, payload)
        if part:
            mapped.append(part)
    return select_turn_ui(mapped)


def confirm_part(action: str, args: dict[str, Any], preview: str) -> dict[str, Any]:
    return {
        "id": _id(),
        "type": "ConfirmAction",
        "props": {
            "title": "Confirm change",
            "summary": preview,
            "action": action,
            "args": args,
        },
    }
