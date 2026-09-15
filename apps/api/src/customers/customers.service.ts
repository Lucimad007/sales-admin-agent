import { Inject, Injectable } from "@nestjs/common";
import { count, desc, eq, ilike, or } from "drizzle-orm";
import { customers, sales, type Database } from "@sales/db";
import type { Customer, CustomerListQuery, CustomerPatch, CustomerWrite } from "@sales/shared";
import { conflict, notFound } from "../common/domain-error";
import { iso, isUniqueViolation } from "../common/db-utils";
import { DB } from "../db/db.tokens";

@Injectable()
export class CustomersService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async list(query: CustomerListQuery) {
    const q = query.q?.trim() ?? "";
    const where = q
      ? or(
          ilike(customers.firstName, `%${q}%`),
          ilike(customers.lastName, `%${q}%`),
          ilike(customers.email, `%${q}%`),
          ilike(customers.phone, `%${q}%`),
        )
      : undefined;

    const [rows, totals] = await Promise.all([
      this.db
        .select()
        .from(customers)
        .where(where)
        .orderBy(desc(customers.createdAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db.select({ total: count() }).from(customers).where(where),
    ]);

    return {
      data: rows.map(mapCustomer),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: Number(totals[0]?.total ?? 0),
      },
    };
  }

  async get(id: string): Promise<Customer> {
    const row = await this.db.query.customers.findFirst({ where: eq(customers.id, id) });
    if (!row) {
      throw notFound("Customer not found");
    }
    return mapCustomer(row);
  }

  async create(input: CustomerWrite, userId: string): Promise<Customer> {
    try {
      const [row] = await this.db
        .insert(customers)
        .values({
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          email: input.email,
          address: input.address,
          createdBy: userId,
        })
        .returning();
      if (!row) {
        throw new Error("Insert returned no row");
      }
      return mapCustomer(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw conflict("A customer with this email already exists");
      }
      throw error;
    }
  }

  async update(id: string, input: CustomerPatch): Promise<Customer> {
    await this.get(id);
    const patch = {
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      updatedAt: new Date(),
    };
    try {
      const [row] = await this.db.update(customers).set(patch).where(eq(customers.id, id)).returning();
      if (!row) {
        throw notFound("Customer not found");
      }
      return mapCustomer(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw conflict("A customer with this email already exists");
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    const [{ value } = { value: 0 }] = await this.db
      .select({ value: count() })
      .from(sales)
      .where(eq(sales.customerId, id));
    if (Number(value) > 0) {
      throw conflict("Cannot delete a customer who has sales");
    }
    await this.db.delete(customers).where(eq(customers.id, id));
  }
}

function mapCustomer(row: typeof customers.$inferSelect): Customer {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    email: row.email,
    address: row.address,
    createdBy: row.createdBy,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}
