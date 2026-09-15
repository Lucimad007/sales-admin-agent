# Design

Internal sales console. Dense, warm, operational. Not a marketing landing page.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--canvas` | `#F6F1E8` | app background |
| `--ink` | `#1C1915` | text |
| `--ink-muted` | `#6B645B` | secondary text |
| `--line` | `#E4D9C8` | hairlines |
| `--panel` | `#FFFBF5` | cards, rail, dialogs |
| `--copper` | `#B4572A` | primary actions, AI, money |
| `--copper-hover` | `#9A4923` | |
| `--new` | `#3F6F8C` | status |
| `--progress` | `#C4892A` | status |
| `--done` | `#3F6B4D` | status |
| `--cancelled` | `#8A7060` | status |
| `--danger` | `#9B2E2E` | delete, reject, errors |
| `--danger-hover` | `#7F2424` | |
| `--success` | `#3F6B4D` | approve, completed, success toasts |
| `--success-hover` | `#335740` | |
| `--warn` | `#C4892A` | caution; same family as in-progress |

Radius: 10px cards, 8px controls, 6px badges. No heavy drop shadows; 1px `--line` + barely-there warm shadow `0 1px 0 rgba(28,25,21,0.04)`.

## Type

- UI: **IBM Plex Sans**
- Data / IDs / prices: **IBM Plex Mono**
- Do not use Inter, Roboto, or default shadcn zinc/indigo

## Density

Tight tables (row py ~10px). Sidebar ~232px. Tally rail ~360px. Motion 150–200ms, ease `cubic-bezier(0.32, 0.72, 0, 1)`.

## Components

- Primary button: copper fill, cream label
- Secondary: panel fill, ink label, line border
- Destructive: danger text in tables (`danger-ghost`); filled danger only for a confirming destroy
- Approve / success: `--success` fill
- Status chips: tinted by status token, mono 11px
- Money: copper, IBM Plex Mono
- Toasts: success green wash, error red wash
- KPI: label muted, value IBM Plex Sans 28px, not a rainbow icon grid
- Kanban column: panel, status color as 3px top edge
- Tally: copper 2px left rule on assistant messages; no purple glow, no sparkle spam

## Layout

Left: wordmark “Ledger” + nav (Dashboard, Customers, Sales, Pipeline).  
Main: page title, one-line description, actions aligned right.  
Right: Tally.

Login is a single centered panel on the canvas — not a split illustration hero.
