# Architecture

pnpm + Turborepo monorepo. TypeScript apps talk over HTTP. Python LangGraph is a separate process.

## Packages

| Path | Role |
| --- | --- |
| `apps/web` | Next.js App Router UI |
| `apps/api` | NestJS REST + agent proxy |
| `apps/agent` | FastAPI + LangGraph |
| `packages/db` | Drizzle schema, migrations, seed |
| `packages/shared` | Zod contracts shared by web + api |
| `packages/config` | tsconfig / eslint |

## Runtime

- Postgres 16 via Docker Compose (host port `55432` → container `5432`)
- Next.js `:3000`
- NestJS `:3001` with global prefix `/api`
- Agent `:8100` (host 8000 is often taken)

Browser never calls Nest or the agent on other origins. Next.js rewrites:

```
/api/:path*  →  http://localhost:3001/api/:path*
```

Auth cookies are therefore first-party on `localhost:3000`.

## Auth

- Email + password
- bcrypt hashes
- JWT in httpOnly, `SameSite=Lax`, `Path=/` cookie (`COOKIE_NAME`)
- NestJS `AuthGuard` on all routes except `POST /api/auth/login` and `POST /api/auth/logout`
- Next.js admin layout calls `GET /api/auth/me`; 401 redirects to `/login`

## Agent trust boundary

1. Browser → `POST /api/agent/chat` (cookie session)
2. NestJS verifies JWT, attaches `user_id`, forwards to agent with `X-Internal-Token: AGENT_INTERNAL_TOKEN`
3. Agent tools call NestJS `/api/*` with the same internal token **and** `X-Acting-User-Id`
4. NestJS `InternalOrJwtGuard` accepts either a valid user JWT or a valid internal token

The graph never opens a CRM SQL connection. Checkpointer uses Postgres schema `langgraph` only.

## Failure modes

| Failure | Behavior |
| --- | --- |
| Agent down | CRUD works; Tally shows unavailable |
| Missing OpenCode Go key | Agent health is `degraded`; Tally empty state |
| DB down | All apps fail fast with a clear error |
| Tool HTTP 4xx/5xx | Graph returns an error part, does not crash the stream |

## Layering

- Nest controllers: parse, call service, map HTTP
- Nest services: business rules
- LangGraph nodes: routing, tool choice, rendering, memory extraction — not CRM invariants
