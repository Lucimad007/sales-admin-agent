import { Inject, Injectable } from "@nestjs/common";
import { count, desc, eq, sql } from "drizzle-orm";
import { customers, sales, type Database } from "@sales/db";
import type { Dashboard, SaleStatus } from "@sales/shared";
import { iso, money } from "../common/db-utils";
import { DB } from "../db/db.tokens";

const EMPTY_STATUS: Record<SaleStatus, number> = {
  new: 0,
  in_progress: 0,
  completed: 0,
  cancelled: 0,
};

@Injectable()
export class DashboardService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async get(): Promise<Dashboard> {
    const [customerCount] = await this.db.select({ total: count() }).from(customers);
    const [saleCount] = await this.db.select({ total: count() }).from(sales);
    const [revenue] = await this.db
      .select({ total: sql<string>`coalesce(sum(${sales.price}), 0)` })
      .from(sales)
      .where(eq(sales.status, "completed"));

    const statusRows = await this.db
      .select({ status: sales.status, total: count() })
      .from(sales)
      .groupBy(sales.status);

    const salesByStatus = { ...EMPTY_STATUS };
    for (const row of statusRows) {
      salesByStatus[row.status] = Number(row.total);
    }

    const recent = await this.db
      .select({
        id: sales.id,
        productName: sales.productName,
        price: sales.price,
        status: sales.status,
        createdAt: sales.createdAt,
        firstName: customers.firstName,
        lastName: customers.lastName,
      })
      .from(sales)
      .innerJoin(customers, eq(sales.customerId, customers.id))
      .orderBy(desc(sales.createdAt))
      .limit(8);

    return {
      totalCustomers: Number(customerCount?.total ?? 0),
      totalSales: Number(saleCount?.total ?? 0),
      totalRevenue: money(revenue?.total ?? "0"),
      salesByStatus,
      recentSales: recent.map((row) => ({
        id: row.id,
        productName: row.productName,
        price: money(row.price),
        status: row.status,
        createdAt: iso(row.createdAt),
        customerName: `${row.firstName} ${row.lastName}`,
      })),
    };
  }
}
