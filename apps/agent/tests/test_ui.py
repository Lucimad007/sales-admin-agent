from agent.ui import confirm_part, map_tool_result


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
