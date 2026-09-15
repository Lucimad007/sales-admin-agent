from agent.tools import TOOLS


def test_tool_catalog_includes_reads_and_writes():
    names = {t.name for t in TOOLS}
    assert names >= {
        "get_dashboard_stats",
        "search_customers",
        "get_customer",
        "search_sales",
        "get_pipeline",
        "create_customer",
        "update_customer",
        "create_sale",
        "update_sale_status",
        "add_sale_note",
    }
