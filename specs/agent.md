# Agent

Python LangGraph service (`apps/agent`). FastAPI. DeepSeek V4.1 Flash through **OpenCode Go** (`deepseek-v4.1-flash` at `https://opencode.ai/zen/go/v1`). Thinking is disabled so tool calls stay snappy.

## Graph

```
guard → reasoner ⇄ tools → render → memory_write → END
```

Write tools call `interrupt()` **before** the HTTP mutation. Resume with `{ decision: "approve" | "reject" }`.

State:

- `messages` — LangChain message list
- `user_id` — acting user
- `thread_id` — checkpoint id
- `ui_parts` — genUI parts for this turn
- `pending_action` — tool name + args when interrupted

## Memory

- **Short-term:** `AsyncPostgresSaver` in schema `langgraph`, keyed by `thread_id`. One active thread per user (`thread:{user_id}`).
- **Long-term:** after a successful turn, extract 0–3 durable facts (`key`, `value`) and upsert `agent_memories`. On each turn, load up to 12 facts into the system prompt.

Facts are operational (preferred customer, recurring product, follow-up notes), never passwords.

## Tools

Read (no interrupt):

| Tool | Nest call |
| --- | --- |
| `get_dashboard_stats` | `GET /api/dashboard` |
| `search_customers` | `GET /api/customers?q=` |
| `get_customer` | `GET /api/customers/:id` |
| `search_sales` | `GET /api/sales?...` |
| `get_pipeline` | `GET /api/sales` grouped by board statuses |

Write (interrupt then mutate):

| Tool | Nest call |
| --- | --- |
| `create_customer` | `POST /api/customers` |
| `update_customer` | `PATCH /api/customers/:id` |
| `create_sale` | `POST /api/sales` |
| `update_sale_status` | `PATCH /api/sales/:id/status` |
| `add_sale_note` | `PATCH /api/sales/:id` notes |

## SSE events

Each event is `event: <type>\ndata: <json>\n\n`.

| type | payload |
| --- | --- |
| `thread` | `{ threadId }` |
| `token` | `{ text }` |
| `ui` | `{ part }` — see catalog |
| `tool` | `{ name, status: "start" \| "end" }` |
| `interrupt` | `{ action, args, preview }` |
| `error` | `{ message }` |
| `done` | `{ ok: true }` |

## GenUI catalog

Every part: `{ "id": string, "type": string, "props": object }`.

- `Markdown` — `{ markdown: string }`
- `KpiStrip` — `{ items: { label: string, value: string }[] }`
- `CustomerCard` — customer fields + id
- `CustomerList` — compact rows when search returns more than one customer
- `SalesTable` — `{ rows: { id, productName, customerName, price, status, createdAt }[] }`
- `PipelineSummary` — `{ columns: { status, count, total }[] }`
- `ConfirmAction` — `{ title, summary, action, args }`

Zod schemas live in `packages/shared`. Python emits the same JSON shapes.

`render` maps **this turn's** tool messages only (after the last human message), then keeps **one** data widget (plus `ConfirmAction` if present). Extra KPIs/pipeline/cards from leftover tool calls are dropped.

## System behavior

- Call the one read tool that answers the question. Do not fetch dashboard/pipeline as extra context.
- Records belong in genUI, never as markdown tables or field dumps.
- Spoken reply is one or two sentences; do not repeat UI fields.
- Never invent IDs. Search first.
- If `OPENCODE_GO_API_KEY` is missing, FastAPI `/health` returns `llm: false`; Nest surfaces that to the UI.
