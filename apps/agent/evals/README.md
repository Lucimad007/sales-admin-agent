# Agent evals

Frozen transcripts in `cases.json`. CI runs them **without an LLM**: each case is a user turn plus recorded tool JSON; `parts_for_turn` must emit the listed genUI types.

That locks:

- one data widget per turn (extra KPIs/pipeline dropped)
- this-turn tools only (prior human ignored)
- HTTP errors and rejected writes emit no leftover cards

`expect_tools` is the oracle for what a live model *should* call. It is not executed in CI (no API key). Policy tests in `tests/test_policy.py` cover interrupt-before-POST, reject-skips-mutate, Nest 500 as an error dict, and invented IDs.

## LangSmith

Set `LANGSMITH_API_KEY` (or `LANGCHAIN_API_KEY`) in `.env`. On agent boot, traces go to project `ledger-tally` (`LANGCHAIN_TRACING_V2=true`).
