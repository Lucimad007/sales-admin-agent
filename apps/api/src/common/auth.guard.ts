import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { eq } from "drizzle-orm";
import type { Request } from "express";
import { users, type Database } from "@sales/db";
import type { User } from "@sales/shared";
import { DB } from "../db/db.tokens";
import { Inject } from "@nestjs/common";
import type { Env } from "../env";
import { ENV } from "../db/db.tokens";
import { unauthorized } from "./domain-error";
import { IS_PUBLIC } from "./public.decorator";

type AuthedRequest = Request & { user?: User };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(DB) private readonly db: Database,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const internal = header(req, "x-internal-token");
    if (internal) {
      if (internal !== this.env.AGENT_INTERNAL_TOKEN) {
        throw unauthorized("Invalid internal token");
      }
      const userId = header(req, "x-acting-user-id");
      if (!userId) {
        throw unauthorized("Missing acting user");
      }
      req.user = await this.loadUser(userId);
      return true;
    }

    const token = this.readToken(req);
    if (!token) {
      throw unauthorized();
    }

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      req.user = await this.loadUser(payload.sub);
      return true;
    } catch {
      throw unauthorized("Invalid session");
    }
  }

  private readToken(req: Request): string | null {
    const cookie = req.cookies?.[this.env.COOKIE_NAME];
    if (typeof cookie === "string" && cookie.length > 0) {
      return cookie;
    }
    const auth = header(req, "authorization");
    if (auth?.startsWith("Bearer ")) {
      return auth.slice(7);
    }
    return null;
  }

  private async loadUser(id: string): Promise<User> {
    const row = await this.db.query.users.findFirst({ where: eq(users.id, id) });
    if (!row) {
      throw unauthorized("User no longer exists");
    }
    return { id: row.id, email: row.email, name: row.name };
  }
}

function header(req: Request, name: string): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}
