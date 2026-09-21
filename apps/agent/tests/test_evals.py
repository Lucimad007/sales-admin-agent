import json
from pathlib import Path

from agent.ui import parts_for_turn

CASES = json.loads((Path(__file__).resolve().parents[1] / "evals" / "cases.json").read_text(encoding="utf-8"))


class Msg:
    def __init__(self, type: str, name: str = "", content: str = "") -> None:
        self.type = type
        self.name = name
        self.content = content


def _messages(case: dict) -> list[Msg]:
    out: list[Msg] = []
    for prior in case.get("prior") or []:
        if prior.get("role") == "human":
            out.append(Msg("human", content=prior.get("content", "")))
        else:
            out.append(Msg("tool", prior.get("name", ""), prior.get("content", "")))
    out.append(Msg("human", content=case["user"]))
    for tool in case.get("tools") or []:
        out.append(Msg("tool", tool["name"], tool["content"]))
    return out


def test_eval_case_count():
    assert len(CASES) >= 24


def test_frozen_transcripts_map_to_expected_ui():
    for case in CASES:
        parts = parts_for_turn(_messages(case))
        types = [p["type"] for p in parts]
        assert types == case["expect_ui"], case["id"]
        cap = case.get("expect_row_cap")
        if cap is not None:
            assert parts
            assert len(parts[0]["props"]["rows"]) == cap, case["id"]
