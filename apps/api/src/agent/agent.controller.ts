import { Body, Controller, Get, Param, Post, Req, Res, Inject } from "@nestjs/common";
import {
  agentChatBodySchema,
  agentResumeBodySchema,
  type AgentChatBody,
  type AgentResumeBody,
  type User,
} from "@sales/shared";
import type { Request, Response } from "express";
import { z } from "zod";
import { CurrentUser } from "../common/current-user.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { AgentService } from "./agent.service";

const memoryBodySchema = z.object({
  threadId: z.string().min(1),
  facts: z.array(z.object({ key: z.string().min(1), value: z.string().min(1) })).max(3),
});

@Controller("agent")
export class AgentController {
  constructor(@Inject(AgentService) private readonly agent: AgentService) {}

  @Get("health")
  async health() {
    return { data: await this.agent.health() };
  }

  @Get("memories")
  async memories(@CurrentUser() user: User) {
    return { data: await this.agent.listMemories(user.id) };
  }

  @Post("memories")
  async upsertMemories(
    @CurrentUser() user: User,
    @Body(new ZodPipe(memoryBodySchema)) body: z.infer<typeof memoryBodySchema>,
  ) {
    return { data: await this.agent.upsertMemories(user.id, body.facts, body.threadId) };
  }

  @Post("chat")
  async chat(
    @CurrentUser() user: User,
    @Body(new ZodPipe(agentChatBodySchema)) body: AgentChatBody,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.agent.proxySse(
      "/chat",
      this.agent.attachUser({ message: body.message, threadId: body.threadId }, user, req),
      res,
    );
  }

  @Post("threads/:threadId/resume")
  async resume(
    @CurrentUser() user: User,
    @Param("threadId") threadId: string,
    @Body(new ZodPipe(agentResumeBodySchema)) body: AgentResumeBody,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.agent.proxySse(
      "/resume",
      this.agent.attachUser({ threadId, decision: body.decision }, user, req),
      res,
    );
  }
}
