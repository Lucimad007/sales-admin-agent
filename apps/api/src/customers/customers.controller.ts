import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Inject } from "@nestjs/common";
import {
  customerListQuerySchema,
  customerPatchSchema,
  customerWriteSchema,
  type CustomerListQuery,
  type CustomerPatch,
  type CustomerWrite,
  type User,
} from "@sales/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { CustomersService } from "./customers.service";

@Controller("customers")
export class CustomersController {
  constructor(@Inject(CustomersService) private readonly customers: CustomersService) {}

  @Get()
  list(@Query(new ZodPipe(customerListQuerySchema)) query: CustomerListQuery) {
    return this.customers.list(query);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.customers.get(id).then((data) => ({ data }));
  }

  @Post()
  create(
    @Body(new ZodPipe(customerWriteSchema)) body: CustomerWrite,
    @CurrentUser() user: User,
  ) {
    return this.customers.create(body, user.id).then((data) => ({ data }));
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodPipe(customerPatchSchema)) body: CustomerPatch,
  ) {
    return this.customers.update(id, body).then((data) => ({ data }));
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.customers.remove(id);
    return { data: { ok: true } };
  }
}
