import { z } from "zod";
import { saleStatusSchema } from "./sale-status";

export const kpiStripPartSchema = z.object({
  type: z.literal("KpiStrip"),
  id: z.string(),
  props: z.object({
    items: z.array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    ),
  }),
});

export const customerCardPartSchema = z.object({
  type: z.literal("CustomerCard"),
  id: z.string(),
  props: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phone: z.string(),
    address: z.string(),
  }),
});

export const customerListPartSchema = z.object({
  type: z.literal("CustomerList"),
  id: z.string(),
  props: z.object({
    rows: z.array(
      z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
        phone: z.string(),
      }),
    ),
  }),
});

export const salesTablePartSchema = z.object({
  type: z.literal("SalesTable"),
  id: z.string(),
  props: z.object({
    rows: z.array(
      z.object({
        id: z.string(),
        productName: z.string(),
        customerName: z.string(),
        price: z.string(),
        status: saleStatusSchema,
        createdAt: z.string(),
      }),
    ),
  }),
});

export const pipelineSummaryPartSchema = z.object({
  type: z.literal("PipelineSummary"),
  id: z.string(),
  props: z.object({
    columns: z.array(
      z.object({
        status: saleStatusSchema,
        count: z.number(),
        total: z.string(),
      }),
    ),
  }),
});

export const confirmActionPartSchema = z.object({
  type: z.literal("ConfirmAction"),
  id: z.string(),
  props: z.object({
    title: z.string(),
    summary: z.string(),
    action: z.string(),
    args: z.record(z.unknown()),
  }),
});

export const markdownPartSchema = z.object({
  type: z.literal("Markdown"),
  id: z.string(),
  props: z.object({
    markdown: z.string(),
  }),
});

export const genUiPartSchema = z.discriminatedUnion("type", [
  kpiStripPartSchema,
  customerCardPartSchema,
  customerListPartSchema,
  salesTablePartSchema,
  pipelineSummaryPartSchema,
  confirmActionPartSchema,
  markdownPartSchema,
]);

export type GenUiPart = z.infer<typeof genUiPartSchema>;

export const agentChatBodySchema = z.object({
  threadId: z.string().min(1).optional(),
  message: z.string().trim().min(1).max(8000),
});

export type AgentChatBody = z.infer<typeof agentChatBodySchema>;

export const agentResumeBodySchema = z.object({
  decision: z.enum(["approve", "reject"]),
});

export type AgentResumeBody = z.infer<typeof agentResumeBodySchema>;

export const agentHealthSchema = z.object({
  ok: z.boolean(),
  llm: z.boolean(),
});

export type AgentHealth = z.infer<typeof agentHealthSchema>;
