import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { config } from "dotenv";
import path from "node:path";
import cookieParser from "cookie-parser";
import { NestFactory } from "@nestjs/core";
import type { INestApplication } from "@nestjs/common";
import { AppExceptionFilter } from "../src/common/exception.filter";
import { AppModule } from "../src/app.module";

config({ path: path.resolve(process.cwd(), "../../.env") });
config();

const hasDb = Boolean(process.env.DATABASE_URL && process.env.JWT_SECRET);

describe.skipIf(!hasDb)("api e2e", () => {
  let app: INestApplication;
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    process.env.AGENT_INTERNAL_TOKEN ||= "test-agent-internal-token";
    process.env.JWT_SECRET ||= "test-jwt-secret-value";
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api");
    app.use(cookieParser());
    app.useGlobalFilters(new AppExceptionFilter());
    await app.init();
    agent = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects unauthenticated dashboard", async () => {
    const res = await request(app.getHttpServer()).get("/api/dashboard");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("logs in, lists customers, and round-trips a customer", async () => {
    const login = await agent.post("/api/auth/login").send({
      email: "leo.a@example.org",
      password: "demo1234",
    });
    expect(login.status).toBe(200);
    expect(login.body.data.email).toBe("leo.a@example.org");

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);

    const list = await agent.get("/api/customers");
    expect(list.status).toBe(200);
    expect(list.body.meta.total).toBeGreaterThan(0);

    const email = `e2e.${Date.now()}@ledger.test`;
    const created = await agent.post("/api/customers").send({
      firstName: "E2E",
      lastName: "Buyer",
      phone: "555-0100",
      email,
      address: "1 Test Lane",
    });
    expect([200, 201]).toContain(created.status);
    const id = created.body.data.id as string;

    const sale = await agent.post("/api/sales").send({
      customerId: id,
      productName: "E2E widget",
      price: "99.00",
      status: "new",
      notes: "from test",
    });
    expect([200, 201]).toContain(sale.status);

    const moved = await agent.patch(`/api/sales/${sale.body.data.id}/status`).send({
      status: "in_progress",
    });
    expect(moved.body.data.status).toBe("in_progress");

    await agent.delete(`/api/sales/${sale.body.data.id}`);
    const delCustomer = await agent.delete(`/api/customers/${id}`);
    expect(delCustomer.status).toBe(200);

    const dash = await agent.get("/api/dashboard");
    expect(dash.body.data.totalCustomers).toBeGreaterThan(0);
  });
});
