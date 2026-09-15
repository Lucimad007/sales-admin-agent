from __future__ import annotations

import json
from contextvars import ContextVar
from typing import Any

from langchain_core.tools import tool
from langgraph.types import interrupt

from agent.crm import CrmClient
from agent.ui import confirm_part

crm_var: ContextVar[CrmClient] = ContextVar("crm")


def current_crm() -> CrmClient:
    return crm_var.get()


def _confirm(action: str, args: dict[str, Any], preview: str) -> dict[str, Any]:
    decision = interrupt(
        {
            "action": action,
            "args": args,
            "preview": preview,
            "ui": confirm_part(action, args, preview),
        }
    )
    if isinstance(decision, dict):
        return decision
    return {"decision": str(decision)}


@tool
async def get_dashboard_stats() -> dict[str, Any]:
    """Return dashboard KPIs: customers, sales, revenue, status breakdown."""
    return await current_crm().get("/dashboard")


@tool
async def search_customers(q: str = "") -> dict[str, Any]:
    """Search customers by name, email, or phone."""
    return await current_crm().get("/customers", params={"q": q, "pageSize": 20})


@tool
async def get_customer(customer_id: str) -> dict[str, Any]:
    """Fetch one customer by UUID."""
    return await current_crm().get(f"/customers/{customer_id}")


@tool
async def search_sales(q: str = "", status: str | None = None) -> dict[str, Any]:
    """Search sales by product or notes. Optional status filter."""
    params: dict[str, Any] = {"q": q, "pageSize": 20}
    if status:
        params["status"] = status
    return await current_crm().get("/sales", params=params)


@tool
async def get_pipeline() -> dict[str, Any]:
    """Summarize pipeline columns New / In Progress / Completed with counts and totals."""
    payload = await current_crm().get("/sales", params={"pageSize": 100})
    rows = payload.get("data") or []
    columns: dict[str, dict[str, Any]] = {
        "new": {"status": "new", "count": 0, "total": 0.0},
        "in_progress": {"status": "in_progress", "count": 0, "total": 0.0},
        "completed": {"status": "completed", "count": 0, "total": 0.0},
    }
    for row in rows:
        status = row.get("status")
        if status not in columns:
            continue
        columns[status]["count"] += 1
        try:
            columns[status]["total"] += float(row.get("price") or 0)
        except (TypeError, ValueError):
            pass
    return {
        "data": {
            "columns": [{**col, "total": f"{col['total']:.2f}"} for col in columns.values()]
        }
    }


@tool
async def create_customer(
    first_name: str,
    last_name: str,
    email: str,
    phone: str,
    address: str,
) -> dict[str, Any]:
    """Create a customer after the user confirms."""
    args = {
        "firstName": first_name,
        "lastName": last_name,
        "email": email,
        "phone": phone,
        "address": address,
    }
    decision = _confirm("create_customer", args, f"Create customer {first_name} {last_name} ({email}).")
    if decision.get("decision") != "approve":
        return {"data": {"cancelled": True}}
    return await current_crm().post("/customers", args)


@tool
async def update_customer(customer_id: str, patch_json: str) -> dict[str, Any]:
    """Update a customer. patch_json is a JSON object of fields to change."""
    args = {"id": customer_id, **json.loads(patch_json)}
    decision = _confirm("update_customer", args, f"Update customer {customer_id}: {patch_json}")
    if decision.get("decision") != "approve":
        return {"data": {"cancelled": True}}
    body = {k: v for k, v in args.items() if k != "id"}
    return await current_crm().patch(f"/customers/{customer_id}", body)


@tool
async def create_sale(
    customer_id: str,
    product_name: str,
    price: str,
    notes: str = "",
    status: str = "new",
) -> dict[str, Any]:
    """Create a sale after the user confirms."""
    args = {
        "customerId": customer_id,
        "productName": product_name,
        "price": price,
        "notes": notes,
        "status": status,
    }
    decision = _confirm(
        "create_sale",
        args,
        f"Create sale '{product_name}' at {price} for customer {customer_id}.",
    )
    if decision.get("decision") != "approve":
        return {"data": {"cancelled": True}}
    return await current_crm().post("/sales", args)


@tool
async def update_sale_status(sale_id: str, status: str) -> dict[str, Any]:
    """Move a sale to a new status after confirmation."""
    args = {"id": sale_id, "status": status}
    decision = _confirm("update_sale_status", args, f"Set sale {sale_id} to {status}.")
    if decision.get("decision") != "approve":
        return {"data": {"cancelled": True}}
    return await current_crm().patch(f"/sales/{sale_id}/status", {"status": status})


@tool
async def add_sale_note(sale_id: str, notes: str) -> dict[str, Any]:
    """Replace sale notes after confirmation."""
    args = {"id": sale_id, "notes": notes}
    decision = _confirm("add_sale_note", args, f"Update notes on sale {sale_id}.")
    if decision.get("decision") != "approve":
        return {"data": {"cancelled": True}}
    return await current_crm().patch(f"/sales/{sale_id}", {"notes": notes})


TOOLS = [
    get_dashboard_stats,
    search_customers,
    get_customer,
    search_sales,
    get_pipeline,
    create_customer,
    update_customer,
    create_sale,
    update_sale_status,
    add_sale_note,
]
