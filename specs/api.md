# API

Base path `/api`. JSON. Cookie session after login.

## Error envelope

```json
{ "error": { "code": "NOT_FOUND", "message": "Customer not found", "details": null } }
```

| HTTP | code |
| --- | --- |
| 400 | `VALIDATION_ERROR` |
| 401 | `UNAUTHORIZED` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` |
| 500 | `INTERNAL` |

## Pagination

List endpoints accept `page` (default 1) and `pageSize` (default 20, max 100).

```json
{ "data": [], "meta": { "page": 1, "pageSize": 20, "total": 0 } }
```

## Auth

### POST /api/auth/login

Body: `{ "email": string, "password": string }`

Sets httpOnly cookie. Returns `{ "data": { "id", "email", "name" } }`. 401 on bad credentials.

### POST /api/auth/logout

Clears cookie. `{ "data": { "ok": true } }`.

### GET /api/auth/me

Current user. 401 if missing/invalid cookie.

## Customers

- `GET /api/customers?q=&page=&pageSize=` — `q` matches first, last, email, phone
- `GET /api/customers/:id`
- `POST /api/customers` — `{ firstName, lastName, phone, email, address }`
- `PATCH /api/customers/:id` — any subset of fields
- `DELETE /api/customers/:id` — 409 if the customer has sales

Responses use camelCase: `firstName`, `lastName`, `createdAt`, etc.

## Sales

- `GET /api/sales?q=&status=&customerId=&page=&pageSize=` — `q` matches product name and notes
- `GET /api/sales/:id` — includes nested `customer`
- `POST /api/sales` — `{ customerId, productName, price, status?, notes? }`
- `PATCH /api/sales/:id` — any subset including `status`
- `PATCH /api/sales/:id/status` — `{ "status": "in_progress" }` Kanban helper
- `DELETE /api/sales/:id`

`price` is a string decimal. Status must be one of the four enums.

## Dashboard

`GET /api/dashboard`

```json
{
  "data": {
    "totalCustomers": 12,
    "totalSales": 24,
    "totalRevenue": "18450.00",
    "salesByStatus": {
      "new": 6,
      "in_progress": 8,
      "completed": 7,
      "cancelled": 3
    },
    "recentSales": []
  }
}
```

`recentSales` is the 8 most recently created sales with customer name and status. Revenue is the sum of `completed` prices.

## Agent proxy

All require user JWT.

- `POST /api/agent/chat` — SSE. Body `{ "threadId"?: string, "message": string }`
- `POST /api/agent/threads/:threadId/resume` — SSE. Body `{ "decision": "approve" | "reject" }`
- `GET /api/agent/health` — `{ "data": { "ok": boolean, "llm": boolean } }`

SSE event types are defined in [agent.md](./agent.md).
