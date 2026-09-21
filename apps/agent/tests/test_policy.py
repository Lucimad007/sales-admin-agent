import asyncio
from unittest.mock import patch

import httpx

from agent.crm import CrmClient
from agent.tools import (
    create_customer,
    create_sale,
    crm_var,
    get_customer,
    get_dashboard_stats,
    refuse_bad_id,
)
from agent.ui import map_tool_result


class FakeCrm:
    def __init__(self) -> None:
        self.posts: list[tuple[str, dict]] = []
        self.gets: list[str] = []

    async def post(self, path: str, json: dict) -> dict:
        self.posts.append((path, json))
        return {"data": {"id": "ok"}}

    async def get(self, path: str, params=None) -> dict:
        self.gets.append(path)
        return {"data": {"totalCustomers": 1, "totalSales": 1, "totalRevenue": "1.00"}}


def test_refuse_invented_ids():
    assert refuse_bad_id("not-a-uuid", "customer_id") is not None
    assert refuse_bad_id("11111111-1111-4111-8111-111111111111", "customer_id") is None


def test_get_customer_skips_http_on_bad_id():
    crm = FakeCrm()
    crm_var.set(crm)  # type: ignore[arg-type]

    async def run():
        return await get_customer.ainvoke({"customer_id": "amelia-chen"})

    out = asyncio.run(run())
    assert out["error"]["status"] == 400
    assert crm.gets == []


def test_create_sale_skips_interrupt_on_bad_id():
    crm = FakeCrm()
    crm_var.set(crm)  # type: ignore[arg-type]

    async def run():
        return await create_sale.ainvoke(
            {
                "customer_id": "invented",
                "product_name": "Kit",
                "price": "10.00",
            }
        )

    out = asyncio.run(run())
    assert out["error"]["status"] == 400
    assert crm.posts == []


def test_reject_does_not_post():
    crm = FakeCrm()
    crm_var.set(crm)  # type: ignore[arg-type]

    async def run():
        with patch("agent.tools.interrupt", return_value={"decision": "reject"}):
            return await create_customer.ainvoke(
                {
                    "first_name": "Mira",
                    "last_name": "Sol",
                    "email": "m@x.co",
                    "phone": "1",
                    "address": "x",
                }
            )

    out = asyncio.run(run())
    assert out["data"]["cancelled"] is True
    assert crm.posts == []
    assert map_tool_result("create_customer", out) is None


def test_approve_posts_after_interrupt():
    crm = FakeCrm()
    crm_var.set(crm)  # type: ignore[arg-type]
    interrupted = {}

    def capture(payload):
        interrupted["payload"] = payload
        return {"decision": "approve"}

    async def run():
        with patch("agent.tools.interrupt", side_effect=capture):
            return await create_customer.ainvoke(
                {
                    "first_name": "Mira",
                    "last_name": "Sol",
                    "email": "m@x.co",
                    "phone": "1",
                    "address": "x",
                }
            )

    asyncio.run(run())
    assert interrupted["payload"]["action"] == "create_customer"
    assert crm.posts == [
        (
            "/customers",
            {
                "firstName": "Mira",
                "lastName": "Sol",
                "email": "m@x.co",
                "phone": "1",
                "address": "x",
            },
        )
    ]


def test_crm_500_is_error_dict_not_raise():
    class Boom:
        status_code = 500
        text = "db down"
        reason_phrase = "Internal Server Error"

        def json(self):
            return {}

    class Client:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def get(self, *args, **kwargs):
            return Boom()

    async def run():
        crm = CrmClient("http://api", "tok", "user")
        with patch("httpx.AsyncClient", return_value=Client()):
            return await crm.get("/dashboard")

    out = asyncio.run(run())
    assert out["error"]["status"] == 500
    assert map_tool_result("get_dashboard_stats", out) is None


def test_read_tool_returns_error_payload():
    class BoomCrm:
        async def get(self, path: str, params=None):
            return {"error": {"status": 500, "message": "nope"}}

    crm_var.set(BoomCrm())  # type: ignore[arg-type]

    async def run():
        return await get_dashboard_stats.ainvoke({})

    out = asyncio.run(run())
    assert out["error"]["status"] == 500


def test_network_error_is_error_dict():
    class Client:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def get(self, *args, **kwargs):
            raise httpx.ConnectError("refused")

    async def run():
        crm = CrmClient("http://api", "tok", "user")
        with patch("httpx.AsyncClient", return_value=Client()):
            return await crm.get("/dashboard")

    out = asyncio.run(run())
    assert out["error"]["status"] == 0
