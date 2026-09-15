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

Admin shell: left nav, top bar (user + logout), Tally rail on the right (collapsible). `Cmd/Ctrl+K` focuses Tally's composer.

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

Columns: New, In Progress, Completed. Board uses the `Kanban` primitive in `components/ui` (`@dnd-kit`). Optimistic status update; rollback on error. Cancelled is hidden here. Column order is fixed.

## Forms

Customer and sale create/edit in dialogs on list pages; detail pages allow edit too. Delete confirms.

## Tally

- Persistent thread per user (server-side `thread:{userId}`)
- Stream tokens into the last assistant message
- Render `ui` parts with a registry
- `interrupt` shows `ConfirmAction`; Approve calls resume `approve`, Reject calls `reject`
- Health query: if `llm` is false, show setup empty state instead of the composer being “broken”

## Fetch

`credentials: "include"`. Base URL `""` (same origin). 401 on admin pages → `/login`.
