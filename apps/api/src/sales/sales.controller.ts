import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Inject } from "@nestjs/common";
import {
  saleCreateSchema,
  saleListQuerySchema,
  salePatchSchema,
  saleStatusBodySchema,
  type SaleCreate,
  type SaleListQuery,
  type SalePatch,
  type SaleStatus,
  type User,
} from "@sales/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { SalesService } from "./sales.service";

@Controller("sales")
export class SalesController {
  constructor(@Inject(SalesService) private readonly sales: SalesService) {}

  @Get()
  list(@Query(new ZodPipe(saleListQuerySchema)) query: SaleListQuery) {
    return this.sales.list(query);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.sales.get(id).then((data) => ({ data }));
  }

  @Post()
  create(@Body(new ZodPipe(saleCreateSchema)) body: SaleCreate, @CurrentUser() user: User) {
    return this.sales.create(body, user.id).then((data) => ({ data }));
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body(new ZodPipe(saleStatusBodySchema)) body: { status: SaleStatus },
  ) {
    return this.sales.updateStatus(id, body.status).then((data) => ({ data }));
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body(new ZodPipe(salePatchSchema)) body: SalePatch) {
    return this.sales.update(id, body).then((data) => ({ data }));
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.sales.remove(id);
    return { data: { ok: true } };
  }
}
