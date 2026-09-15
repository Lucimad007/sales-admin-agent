import { Body, Controller, Get, HttpCode, Inject, Post, Res, UsePipes } from "@nestjs/common";
import { loginBodySchema, type LoginBody, type User } from "@sales/shared";
import type { Response } from "express";
import { CurrentUser } from "../common/current-user.decorator";
import { Public } from "../common/public.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  @UsePipes(new ZodPipe(loginBodySchema))
  async login(@Body() body: LoginBody, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.login(body);
    res.cookie(this.auth.cookieName(), token, this.auth.cookieOptions());
    return { data: user };
  }

  @Public()
  @Post("logout")
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(this.auth.cookieName(), { path: "/" });
    return { data: { ok: true } };
  }

  @Get("me")
  me(@CurrentUser() user: User) {
    return { data: user };
  }
}
