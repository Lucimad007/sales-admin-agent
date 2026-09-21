# Frontend

Next.js App Router in `apps/web`. TanStack Query. shadcn/ui restyled to [design.md](./design.md).

## Routes

| Path | Auth |
| --- | --- |
| `/login` | public; redirect home if already in |
| `/dashboard` | required |
| `/customers` | required |
| `/customers/[id]` | required |
| `/sales` | required |
| `/pipeline` | required |

`/` redirects to `/dashboard`.

Admin shell: left nav, top bar (user + logout), Tally rail on the right (collapsible). `Cmd/Ctrl+K` focuses Tally's composer. Below `lg`, nav is a drawer, Tally is a full-screen overlay closed by default, customer/sales lists render as stacked cards, and the pipeline is a single stage with a Move-to control.

## Query keys

- `["me"]`
- `["dashboard"]`
- `["customers", filters]`
- `["customer", id]`
- `["sales", filters]`
- `["sale", id]`
- `["agent-health"]`

Mutations invalidate the matching lists plus `dashboard`. Kanban status patch invalidates `sales` and `dashboard`.

## Kanban

Columns: New, In Progress, Completed. Desktop uses the `Kanban` primitive (`@dnd-kit`) with drag between columns. Below `lg`, a stage tab list shows one column at a time and cards move via a select. Cards show Desk `Badge`s (Deal + status). Optimistic status update; rollback on error. Cancelled is hidden here. Column order is fixed.

## Forms

Customer and sale create/edit in dialogs on list pages; detail pages allow edit too. Delete confirms.

## Tally

- Persistent thread per user (server-side `thread:{userId}`)
- Stream tokens into the last assistant message
- Render `ui` parts with a closed registry (OpenUI-style library, not free-form model HTML). One data widget per turn. Widgets match Desk: KPI trio, identity customer cards, headed lists, pipeline bars.
- `interrupt` shows `ConfirmAction`; Approve calls resume `approve`, Reject calls `reject`
- Health query: if `llm` is false, show setup empty state instead of the composer being “broken”
- First open seeds a Tally welcome message plus clickable “Try asking” prompts (revenue, pipeline, customers, open deals). ⌘K focuses the composer.

## Fetch

`credentials: "include"`. Base URL `""` (same origin). 401 on admin pages → `/login`.
