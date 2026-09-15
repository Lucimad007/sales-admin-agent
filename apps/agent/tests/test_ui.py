from agent.ui import confirm_part, map_tool_result, parts_for_turn, select_turn_ui


class Msg:
    def __init__(self, type: str, name: str = "", content: str = "") -> None:
        self.type = type
        self.name = name
        self.content = content


def test_dashboard_maps_to_kpi_strip():
    part = map_tool_result(
        "get_dashboard_stats",
        {"data": {"totalCustomers": 12, "totalSales": 24, "totalRevenue": "18450.00"}},
    )
    assert part is not None
    assert part["type"] == "KpiStrip"
    assert part["props"]["items"][0]["value"] == "12"
    assert part["props"]["items"][2]["value"] == "18450.00"


def test_customer_card():
    part = map_tool_result(
        "get_customer",
        {
            "data": {
                "id": "1",
                "firstName": "Amelia",
                "lastName": "Chen",
                "email": "a@x.co",
                "phone": "1",
                "address": "x",
            }
        },
    )
    assert part is not None
    assert part["type"] == "CustomerCard"
    assert part["props"]["firstName"] == "Amelia"


def test_search_many_customers_is_list():
    part = map_tool_result(
        "search_customers",
        {
            "data": [
                {
                    "id": "1",
                    "firstName": "Ali",
                    "lastName": "Fatemi",
                    "email": "a@x.co",
                    "phone": "1",
                    "address": "x",
                },
                {
                    "id": "2",
                    "firstName": "Ali",
                    "lastName": "Fatemi",
                    "email": "b@x.co",
                    "phone": "2",
                    "address": "y",
                },
            ]
        },
    )
    assert part is not None
    assert part["type"] == "CustomerList"
    assert len(part["props"]["rows"]) == 2


def test_sales_table():
    part = map_tool_result(
        "search_sales",
        {
            "data": [
                {
                    "id": "s1",
                    "productName": "Kit",
                    "price": "10",
                    "status": "new",
                    "createdAt": "2026-01-01",
                    "customer": {"firstName": "A", "lastName": "B"},
                }
            ]
        },
    )
    assert part is not None
    assert part["type"] == "SalesTable"
    assert part["props"]["rows"][0]["customerName"] == "A B"


def test_confirm_part_shape():
    part = confirm_part("create_sale", {"price": "10.00"}, "Create sale")
    assert part["type"] == "ConfirmAction"
    assert part["props"]["action"] == "create_sale"


def test_unknown_tool_returns_none():
    assert map_tool_result("nope", {"data": {}}) is None


def test_cancelled_write_returns_none():
    assert map_tool_result("create_customer", {"data": {"cancelled": True}}) is None


def test_select_turn_drops_extra_kpis_and_pipeline():
    cards = [
        map_tool_result(
            "get_customer",
            {
                "data": {
                    "id": "1",
                    "firstName": "Ali",
                    "lastName": "Fatemi",
                    "email": "a@x.co",
                    "phone": "1",
                    "address": "x",
                }
            },
        ),
        map_tool_result(
            "get_customer",
            {
                "data": {
                    "id": "2",
                    "firstName": "Ali",
                    "lastName": "Fatemi",
                    "email": "b@x.co",
                    "phone": "2",
                    "address": "y",
                }
            },
        ),
        map_tool_result(
            "get_dashboard_stats",
            {"data": {"totalCustomers": 13, "totalSales": 22, "totalRevenue": "20750.00"}},
        ),
        map_tool_result(
            "get_pipeline",
            {
                "data": {
                    "columns": [
                        {"status": "new", "count": 5, "total": "23800.00"},
                        {"status": "in_progress", "count": 6, "total": "19000.00"},
                        {"status": "completed", "count": 7, "total": "20750.00"},
                    ]
                }
            },
        ),
    ]
    out = select_turn_ui([p for p in cards if p])
    assert [p["type"] for p in out] == ["CustomerList"]
    assert len(out[0]["props"]["rows"]) == 2


def test_parts_for_turn_ignores_prior_messages():
    messages = [
        Msg("human", content="kpis"),
        Msg(
            "tool",
            "get_dashboard_stats",
            '{"data":{"totalCustomers":1,"totalSales":1,"totalRevenue":"1.00"}}',
        ),
        Msg("human", content="find ali"),
        Msg(
            "tool",
            "search_customers",
            '{"data":[{"id":"1","firstName":"Ali","lastName":"Fatemi","email":"a","phone":"1","address":"x"}]}',
        ),
        Msg(
            "tool",
            "get_dashboard_stats",
            '{"data":{"totalCustomers":13,"totalSales":22,"totalRevenue":"20750.00"}}',
        ),
    ]
    parts = parts_for_turn(messages)
    assert [p["type"] for p in parts] == ["CustomerCard"]
