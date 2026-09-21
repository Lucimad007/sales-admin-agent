# Product

Internal sales admin for one company. A sales employee signs in, manages customers and sales, moves deals on a pipeline board, and asks Tally questions about the book of business.

## Personas

- **Sales employee** — the only user type in v1. They own the CRM day-to-day.
- **Reviewer / hiring panel** — evaluates architecture, type safety, and UI quality; needs a seeded demo login.

There is no role model. Anyone with a valid account has full access to customers, sales, and Tally.

## Surfaces

1. Login
2. Dashboard (KPIs + recent sales)
3. Customers (list, search, create, edit, delete, detail)
4. Sales (list, search/filter, create, edit, delete)
5. Pipeline Kanban (New → In Progress → Completed)
6. Tally rail (always available when authenticated)

## Customer fields

- First name, last name, phone, email, address

## Sale fields

- Customer, product/service name, price, status, created date, notes

## Sale statuses

- `new`
- `in_progress`
- `completed`
- `cancelled`

Cancelled sales appear in the sales list and filters. They do **not** appear on the Kanban board.

## Revenue rule

Total revenue counts only sales with status `completed`.

## Tally

Tally is the sales-desk assistant. It answers questions, renders structured UI (tables, cards, KPIs), remembers facts across turns, and can mutate CRM data after the user confirms.

## Acceptance

- Unauthenticated users cannot load admin routes.
- Login with seeded credentials reaches the dashboard.
- Customer and sale CRUD works, including search.
- Pipeline drag-and-drop updates status and persists after refresh.
- Dashboard numbers match the database under the revenue rule.
- Tally streams a reply for a read question when `OPENCODE_GO_API_KEY` is set.
- Write tools show a confirm card before mutating.
- Without an API key, CRUD still works; Tally shows a setup empty state.
- App runs locally from the README.

## Out of scope (v1)

- Multi-tenant orgs, RBAC, password reset, email sending
- Soft deletes, audit log UI, file attachments
- Live production deploy (nice-to-have, not required)
