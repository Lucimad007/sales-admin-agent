import { relations } from "drizzle-orm";
import {
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const saleStatusEnum = pgEnum("sale_status", [
  "new",
  "in_progress",
  "completed",
  "cancelled",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  ...timestamps,
}, (t) => [
  uniqueIndex("users_email_idx").on(t.email),
]);

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  ...timestamps,
}, (t) => [
  uniqueIndex("customers_email_idx").on(t.email),
  index("customers_name_idx").on(t.lastName, t.firstName),
]);

export const sales = pgTable("sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
  productName: text("product_name").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  status: saleStatusEnum("status").notNull().default("new"),
  notes: text("notes").notNull().default(""),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  ...timestamps,
}, (t) => [
  index("sales_status_created_idx").on(t.status, t.createdAt),
  index("sales_customer_idx").on(t.customerId),
  index("sales_created_idx").on(t.createdAt),
]);

export const agentMemories = pgTable("agent_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value").notNull(),
  sourceThreadId: text("source_thread_id"),
  ...timestamps,
}, (t) => [
  uniqueIndex("agent_memories_user_key_idx").on(t.userId, t.key),
  index("agent_memories_user_idx").on(t.userId),
]);

export const usersRelations = relations(users, ({ many }) => ({
  customers: many(customers),
  sales: many(sales),
  memories: many(agentMemories),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  creator: one(users, { fields: [customers.createdBy], references: [users.id] }),
  sales: many(sales),
}));

export const salesRelations = relations(sales, ({ one }) => ({
  customer: one(customers, { fields: [sales.customerId], references: [customers.id] }),
  creator: one(users, { fields: [sales.createdBy], references: [users.id] }),
}));

export const agentMemoriesRelations = relations(agentMemories, ({ one }) => ({
  user: one(users, { fields: [agentMemories.userId], references: [users.id] }),
}));

export type UserRow = typeof users.$inferSelect;
export type CustomerRow = typeof customers.$inferSelect;
export type SaleRow = typeof sales.$inferSelect;
export type AgentMemoryRow = typeof agentMemories.$inferSelect;
