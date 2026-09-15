import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import { users, type Database } from "@sales/db";
import type { LoginBody, User } from "@sales/shared";
import { DB, ENV } from "../db/db.tokens";
import type { Env } from "../env";
import { unauthorized } from "../common/domain-error";

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(ENV) private readonly env: Env,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {}

  async login(body: LoginBody): Promise<{ user: User; token: string }> {
    const row = await this.db.query.users.findFirst({
      where: eq(users.email, body.email),
    });
    if (!row) {
      throw unauthorized("Invalid email or password");
    }
    const ok = await bcrypt.compare(body.password, row.passwordHash);
    if (!ok) {
      throw unauthorized("Invalid email or password");
    }
    const user: User = { id: row.id, email: row.email, name: row.name };
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email });
    return { user, token };
  }

  cookieOptions() {
    return {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: this.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  cookieName() {
    return this.env.COOKIE_NAME;
  }
}
