import { Inject, Injectable } from "@nestjs/common";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { customers, sales, type Database } from "@sales/db";
import type { Sale, SaleCreate, SaleListQuery, SalePatch, SaleStatus } from "@sales/shared";
import { notFound, validationError } from "../common/domain-error";
import { iso, isFkViolation, money } from "../common/db-utils";
import { DB } from "../db/db.tokens";

@Injectable()
export class SalesService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async list(query: SaleListQuery) {
    const filters = [];
    const q = query.q?.trim() ?? "";
    if (q) {
      filters.push(
        or(ilike(sales.productName, `%${q}%`), ilike(sales.notes, `%${q}%`)),
      );
    }
    if (query.status) {
      filters.push(eq(sales.status, query.status));
    }
    if (query.customerId) {
      filters.push(eq(sales.customerId, query.customerId));
    }
    const where = filters.length > 0 ? and(...filters) : undefined;

    const [rows, totals] = await Promise.all([
      this.db
        .select({
          sale: sales,
          customer: {
            id: customers.id,
            firstName: customers.firstName,
            lastName: customers.lastName,
            email: customers.email,
          },
        })
        .from(sales)
        .innerJoin(customers, eq(sales.customerId, customers.id))
        .where(where)
        .orderBy(desc(sales.createdAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db.select({ total: count() }).from(sales).where(where),
    ]);

    return {
      data: rows.map((r) => mapSale(r.sale, r.customer)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: Number(totals[0]?.total ?? 0),
      },
    };
  }

  async get(id: string): Promise<Sale> {
    const row = await this.db
      .select({
        sale: sales,
        customer: {
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName,
          email: customers.email,
        },
      })
      .from(sales)
      .innerJoin(customers, eq(sales.customerId, customers.id))
      .where(eq(sales.id, id))
      .limit(1);
    const found = row[0];
    if (!found) {
      throw notFound("Sale not found");
    }
    return mapSale(found.sale, found.customer);
  }

  async create(input: SaleCreate, userId: string): Promise<Sale> {
    try {
      const [row] = await this.db
        .insert(sales)
        .values({
          customerId: input.customerId,
          productName: input.productName,
          price: input.price,
          status: input.status ?? "new",
          notes: input.notes ?? "",
          createdBy: userId,
        })
        .returning();
      if (!row) {
        throw new Error("Insert returned no row");
      }
      return this.get(row.id);
    } catch (error) {
      if (isFkViolation(error)) {
        throw validationError("Customer not found");
      }
      throw error;
    }
  }

  async update(id: string, input: SalePatch): Promise<Sale> {
    await this.get(id);
    const patch = {
      ...(input.customerId !== undefined ? { customerId: input.customerId } : {}),
      ...(input.productName !== undefined ? { productName: input.productName } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      updatedAt: new Date(),
    };
    try {
      const [row] = await this.db.update(sales).set(patch).where(eq(sales.id, id)).returning();
      if (!row) {
        throw notFound("Sale not found");
      }
      return this.get(row.id);
    } catch (error) {
      if (isFkViolation(error)) {
        throw validationError("Customer not found");
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: SaleStatus): Promise<Sale> {
    return this.update(id, { status });
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await this.db.delete(sales).where(eq(sales.id, id));
  }
}

function mapSale(
  row: typeof sales.$inferSelect,
  customer: { id: string; firstName: string; lastName: string; email: string },
): Sale {
  return {
    id: row.id,
    customerId: row.customerId,
    productName: row.productName,
    price: money(row.price),
    status: row.status,
    notes: row.notes,
    createdBy: row.createdBy,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    customer,
  };
}
