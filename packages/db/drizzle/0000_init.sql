-- init CRM schema

CREATE TYPE "sale_status" AS ENUM ('new', 'in_progress', 'completed', 'cancelled');

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL,
  "password_hash" text NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");

CREATE TABLE "customers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "phone" text NOT NULL,
  "email" text NOT NULL,
  "address" text NOT NULL,
  "created_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "customers_email_idx" ON "customers" ("email");
CREATE INDEX "customers_name_idx" ON "customers" ("last_name", "first_name");

CREATE TABLE "sales" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" uuid NOT NULL REFERENCES "customers"("id") ON DELETE RESTRICT,
  "product_name" text NOT NULL,
  "price" numeric(12, 2) NOT NULL,
  "status" "sale_status" NOT NULL DEFAULT 'new',
  "notes" text NOT NULL DEFAULT '',
  "created_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "sales_status_created_idx" ON "sales" ("status", "created_at");
CREATE INDEX "sales_customer_idx" ON "sales" ("customer_id");
CREATE INDEX "sales_created_idx" ON "sales" ("created_at");

CREATE TABLE "agent_memories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "key" text NOT NULL,
  "value" text NOT NULL,
  "source_thread_id" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "agent_memories_user_key_idx" ON "agent_memories" ("user_id", "key");
CREATE INDEX "agent_memories_user_idx" ON "agent_memories" ("user_id");

CREATE SCHEMA IF NOT EXISTS langgraph;
