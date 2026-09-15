# Ledger

Sales admin panel for managing customers and sales, plus Tally, a LangGraph sales desk. Monorepo: Next.js UI, NestJS API, Drizzle/Postgres, Python agent.

Specs in [`specs/`](./specs) are the source of truth.

## Stack

- TypeScript, React, Next.js, NestJS
- PostgreSQL 16, Drizzle ORM
- TanStack Query, Tailwind CSS, shadcn/ui primitives
- Python LangGraph agent **Tally** (tools, checkpoint memory, generative UI)

## Quick start

Requires Node 20+, pnpm 9, Docker, and (for Tally) Python 3.12 + [uv](https://docs.astral.sh/uv/).

Postgres is published on **localhost:55432** so it does not collide with other local Postgres instances.

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

In another terminal, start Tally (optional):

```bash
cd apps/agent
uv sync
uv run uvicorn agent.main:app --reload --port 8100 --app-dir src
```

Open [http://localhost:3000](http://localhost:3000).

Demo login (seeded, local only):

- email: `leo.a@example.org`
- password: `demo1234`

Set `OPENCODE_GO_API_KEY` in `.env` for Tally (OpenCode Go → DeepSeek V4.1 Flash). CRUD works without it.

OpenCode uses the same gateway. Run `opencode`, then `/connect` → **OpenCode Go**, paste the key. Default model is `opencode-go/deepseek-v4.1-flash` via [`opencode.json`](./opencode.json).

## Scripts

| Command | What |
| --- | --- |
| `pnpm dev` | Next `:3000` and Nest `:3001` |
| `pnpm db:migrate` | Apply SQL in `packages/db/drizzle` |
| `pnpm db:seed` | Demo user, 12 customers, 24 sales |
| `pnpm test` | API + agent tests |
| `pnpm lint` | Typecheck |

## Architecture

Browser → Next.js (rewrites `/api/*`) → NestJS. Tally is never called from the browser. Nest authenticates the cookie, then proxies SSE to the Python service with `AGENT_INTERNAL_TOKEN`. Agent tools call Nest HTTP so CRM rules stay in services.

See [specs/architecture.md](./specs/architecture.md) and [specs/decisions.md](./specs/decisions.md).

## Agent

- Tools: dashboard, customers, sales, pipeline, plus write tools with LangGraph `interrupt()` confirmation
- Short-term memory: Postgres checkpointer (`langgraph` schema)
- Long-term memory: `agent_memories` via `POST /api/agent/memories`
- GenUI parts: `KpiStrip`, `CustomerCard`, `SalesTable`, `PipelineSummary`, `ConfirmAction`, `Markdown`

## AI tools used

- **Cursor (Grok 4.6)** — scaffolding the monorepo, Nest modules, Next.js UI, LangGraph graph, specs, and wiring
- **Human direction** — product brief (PDF), Python LangGraph + genUI/memory/tools, design tokens, ADRs

I reviewed and adjusted auth (httpOnly cookie + rewrite), revenue definition (completed only), Kanban (cancelled off-board), and tool HTTP boundaries so the graph does not own CRM invariants.

## Screenshots

Run locally, then capture:

1. Login
2. Dashboard KPIs
3. Customers table
4. Pipeline Kanban
5. Tally rail with a genUI card

Place files in `docs/screenshots/` if you attach them to a submission.
