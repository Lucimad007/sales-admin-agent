from __future__ import annotations

from typing import Any
from uuid import uuid4


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


def map_tool_result(name: str, payload: Any) -> dict[str, Any] | None:
    data = payload.get("data") if isinstance(payload, dict) else payload
    if data is None:
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
        if len(rows) == 1 and isinstance(rows[0], dict) and rows[0].get("id"):
            row = rows[0]
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

    if name in {"search_sales", "create_sale", "update_sale_status", "add_sale_note"}:
        rows = data if isinstance(data, list) else [data]
        table_rows = []
        for row in rows:
            if not isinstance(row, dict):
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
