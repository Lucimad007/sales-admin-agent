import { Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { agentMemories, type Database } from "@sales/db";
import type { User } from "@sales/shared";
import { iso } from "../common/db-utils";
import { DB, ENV } from "../db/db.tokens";
import type { Env } from "../env";

@Injectable()
export class AgentService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(ENV) private readonly env: Env,
  ) {}

  threadId(user: User, incoming?: string) {
    return incoming && incoming.length > 0 ? incoming : `thread:${user.id}`;
  }

  async health() {
    try {
      const res = await fetch(`${this.env.AGENT_URL}/health`, {
        headers: { "X-Internal-Token": this.env.AGENT_INTERNAL_TOKEN },
        signal: AbortSignal.timeout(2500),
      });
      if (!res.ok) {
        return { ok: false, llm: false };
      }
      const json = (await res.json()) as { ok?: boolean; llm?: boolean };
      return { ok: Boolean(json.ok), llm: Boolean(json.llm) };
    } catch {
      return { ok: false, llm: false };
    }
  }

  async listMemories(userId: string) {
    const rows = await this.db
      .select()
      .from(agentMemories)
      .where(eq(agentMemories.userId, userId))
      .orderBy(desc(agentMemories.updatedAt))
      .limit(12);
    return rows.map((row) => ({
      id: row.id,
      key: row.key,
      value: row.value,
      sourceThreadId: row.sourceThreadId,
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    }));
  }

  async upsertMemories(
    userId: string,
    facts: Array<{ key: string; value: string }>,
    threadId: string,
  ) {
    for (const fact of facts.slice(0, 3)) {
      const key = fact.key.trim().slice(0, 80);
      const value = fact.value.trim().slice(0, 500);
      if (!key || !value) {
        continue;
      }
      await this.db
        .insert(agentMemories)
        .values({
          userId,
          key,
          value,
          sourceThreadId: threadId,
        })
        .onConflictDoUpdate({
          target: [agentMemories.userId, agentMemories.key],
          set: { value, sourceThreadId: threadId, updatedAt: new Date() },
        });
    }
    return this.listMemories(userId);
  }

  async proxySse(path: string, body: unknown, res: Response) {
    let upstream: globalThis.Response;
    try {
      upstream = await fetch(`${this.env.AGENT_URL}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "X-Internal-Token": this.env.AGENT_INTERNAL_TOKEN,
        },
        body: JSON.stringify(body),
      });
    } catch {
      res.status(503).json({
        error: { code: "INTERNAL", message: "Tally is unavailable", details: null },
      });
      return;
    }

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text();
      res.status(upstream.status === 401 ? 401 : 503).json({
        error: {
          code: "INTERNAL",
          message: text || "Tally is unavailable",
          details: null,
        },
      });
      return;
    }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const reader = upstream.body.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        res.write(Buffer.from(value));
      }
    } finally {
      res.end();
    }
  }

  actingHeaders(user: User) {
    return { userId: user.id };
  }

  attachUser(body: Record<string, unknown>, user: User, req: Request) {
    return {
      ...body,
      user_id: user.id,
      thread_id: this.threadId(user, typeof body.threadId === "string" ? body.threadId : undefined),
      internal_token: this.env.AGENT_INTERNAL_TOKEN,
      api_base: `http://127.0.0.1:${this.env.API_PORT}/api`,
      request_origin: req.headers.origin ?? this.env.WEB_ORIGIN,
    };
  }
}
