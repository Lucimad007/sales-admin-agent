# Decisions

## ADR 1 — Next.js + NestJS, not Next-only

The brief requires NestJS. Next.js is the React UI. REST and business rules stay in Nest so the take-home maps to the requested backend shape.

## ADR 2 — Cookie JWT, same-origin rewrite

httpOnly cookies avoid storing tokens in JS. Next rewrites `/api` to Nest so the cookie is first-party. No CORS credentials maze on localhost.

## ADR 3 — Python LangGraph as its own app

Requested explicitly. CRM writes still go through Nest services via HTTP tools so invariants live in one place.

## ADR 4 — No business logic in controllers or graph nodes

Controllers map HTTP. Graph nodes choose tools and render UI. Price, uniqueness, delete-with-children, revenue definition: Nest services.

## ADR 5 — Cancelled off the Kanban

The brief’s board is New → In Progress → Completed. Cancelled remains a list/filter status.

## ADR 6 — Revenue is completed-only

Unclosed deals are not revenue.

## ADR 7 — Decimal prices as strings in JSON

Avoid IEEE float drift. `numeric(12,2)` in Postgres.

## ADR 8 — HITL interrupts for write tools

Tally mutations require an explicit Approve. Safer demo; shows real LangGraph `interrupt()`.

## ADR 9 — One Tally thread per user

Simplifies memory and the UI. Thread id `thread:{userId}`.

## ADR 10 — Seeded demo user in README, not in git secrets

Password is documented as a local demo credential. Production secrets never committed.
