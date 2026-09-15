import { Controller, Get, Inject } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(@Inject(DashboardService) private readonly dashboard: DashboardService) {}

  @Get()
  async get() {
    return { data: await this.dashboard.get() };
  }
}
