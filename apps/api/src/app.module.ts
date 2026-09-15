import { Module } from "@nestjs/common";
import { AgentModule } from "./agent/agent.module";
import { AuthModule } from "./auth/auth.module";
import { CustomersModule } from "./customers/customers.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DbModule } from "./db/db.module";
import { SalesModule } from "./sales/sales.module";

@Module({
  imports: [DbModule, AuthModule, CustomersModule, SalesModule, DashboardModule, AgentModule],
})
export class AppModule {}
