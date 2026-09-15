# Design

Internal sales console. Dense, warm, operational. Not a marketing landing page.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--canvas` | `#DCC9B0` | toasted paper background |
| `--ink` | `#16120F` | text |
| `--ink-muted` | `#4A4139` | secondary text |
| `--line` | `#C3AD91` | hairlines |
| `--panel` | `#FFF9F0` | cards, rail, dialogs |
| `--copper` | `#C44E1F` | primary actions, AI, money |
| `--copper-hover` | `#A33E18` | |
| `--new` | `#1E5C7A` | status |
| `--progress` | `#B56A0C` | status |
| `--done` | `#1F5236` | status |
| `--cancelled` | `#6A5648` | status |
| `--danger` | `#B12C28` | delete, reject, errors |
| `--danger-hover` | `#8E221F` | |
| `--success` | `#1F5236` | approve, completed, success toasts |
| `--success-hover` | `#18422B` | |
| `--warn` | `#B56A0C` | caution; same family as in-progress |

Radius: 12px cards, 8px controls, 6px badges. Surfaces lift with warm espresso shadows (`shadow-lift` / `shadow-float`), not black. Primary actions carry a copper glow. Canvas sits a full step darker than cream panels so cards read as objects.

## Type

- UI: **IBM Plex Sans**
- Data / IDs / prices: **IBM Plex Mono**
- Do not use Inter, Roboto, or default shadcn zinc/indigo

## Density

Tight tables (row py ~10px). Sidebar ~232px on desktop; a Menu drawer on small screens. Tally rail ~360px on desktop; full-screen overlay on small screens. Motion 150–200ms, ease `cubic-bezier(0.32, 0.72, 0, 1)`.

## Components

- Primary button: copper fill, cream label, copper glow, slight lift on hover
- Secondary: panel fill, ink label, line border, paper shadow
- Destructive: danger text in tables (`danger-ghost`); filled danger only for a confirming destroy
- Approve / success: `--success` fill
- Status chips: tinted wash plus a 1px status ring, mono 11px (built on `Badge`)
- Badge: 6px radius, mono 11px; outline / copper / status variants
- Money: copper, IBM Plex Mono
- Toasts: success green wash, error red wash
- KPI: label muted, value IBM Plex Sans 28px, not a rainbow icon grid; revenue card gets a copper top edge
- Kanban column: panel, status color as 3px top edge; count badge in the header; cards show Deal + status. On small screens, one stage at a time with a Move-to control — not a squeezed three-column board.
- Tally: copper 3px left rule on the rail; copper 2px left rule on assistant messages; no purple glow, no sparkle spam

## Layout

Left: wordmark “Ledger” + nav (Dashboard, Customers, Sales, Pipeline). On small screens the nav is behind Menu.  
Main: page title, one-line description, actions aligned right (stack on narrow viewports).  
Right: Tally. On small screens Tally is a full-screen overlay, closed by default.

Login is a single centered panel on the canvas — not a split illustration hero.
