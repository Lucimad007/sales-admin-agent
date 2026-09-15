# Database

PostgreSQL 16. Drizzle ORM in `packages/db`. Migrations committed.

## ERD

```
users 1──* customers 1──* sales
users 1──* agent_memories
```

LangGraph checkpoint tables live in schema `langgraph` (managed by `langgraph-checkpoint-postgres`).

## Enums

```sql
CREATE TYPE sale_status AS ENUM ('new', 'in_progress', 'completed', 'cancelled');
```

## Tables

### users

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | default `gen_random_uuid()` |
| email | text unique not null | stored lowercase |
| password_hash | text not null | bcrypt |
| name | text not null | display |
| created_at / updated_at | timestamptz | |

### customers

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| first_name, last_name | text not null | |
| phone | text not null | |
| email | text unique not null | lowercase |
| address | text not null | |
| created_by | uuid FK users | restrict delete |
| created_at / updated_at | timestamptz | |

### sales

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| customer_id | uuid FK customers on delete restrict | |
| product_name | text not null | product/service |
| price | numeric(12,2) not null | >= 0 |
| status | sale_status not null | default `new` |
| notes | text not null | default `''` |
| created_by | uuid FK users | |
| created_at / updated_at | timestamptz | |

### agent_memories

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid FK users on delete cascade | |
| key | text not null | short label |
| value | text not null | fact |
| source_thread_id | text | |
| created_at / updated_at | timestamptz | |

Unique `(user_id, key)`.

## Indexes

- `customers(email)`
- `customers(last_name, first_name)`
- `sales(status, created_at desc)`
- `sales(customer_id)`
- `sales(created_at desc)`
- `agent_memories(user_id)`

Search is `ilike` on name/email/product. Trigram is optional later; v1 does not require `pg_trgm`.

## Seed

- User: `leo.a@example.org` / `demo1234` / name `Demo Seller`
- 12 customers with realistic names and US-style addresses
- 24 sales across all four statuses, mixed prices, at least 3 per status
- 0 agent memories (Tally fills these)

## Money

Store and return `price` as a decimal string with two fraction digits in JSON (`"1290.00"`). Sum revenue in SQL with `numeric`.
