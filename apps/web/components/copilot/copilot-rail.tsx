"use client";

import type { AgentHealth, GenUiPart } from "@sales/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ChatMarkdown } from "@/components/copilot/chat-markdown";
import { GenUi } from "@/components/copilot/gen-ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiData } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  parts: GenUiPart[];
  threadId?: string;
  pending?: boolean;
};

const WELCOME_ID = "tally-welcome";

const WELCOME_TEXT = `I'm **Tally**. I work this sales desk.

I can look up customers, pipeline, and closed revenue from live data. If you ask me to change a record, I'll show an Approve step first.

Try a prompt below, type a question, or press **⌘K** to focus the composer.`;

const SUGGESTIONS = [
  { label: "Closed revenue", prompt: "What's our closed revenue and how many completed sales?" },
  { label: "Pipeline", prompt: "Summarize the pipeline by stage." },
  { label: "Find a customer", prompt: "Look up customer Ali Fatemi" },
  { label: "Open deals", prompt: "Which deals are in progress?" },
] as const;

async function readSse(
  res: Response,
  onEvent: (event: string, data: unknown) => void,
) {
  if (!res.body) {
    throw new Error("No stream");
  }
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.error?.message ?? "Tally request failed");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const chunks = buf.split("\n\n");
    buf = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const lines = chunk.split("\n");
      const event = lines.find((l) => l.startsWith("event: "))?.slice(7);
      const data = lines
        .filter((l) => l.startsWith("data: "))
        .map((l) => l.slice(6))
        .join("");
      if (!event || !data) continue;
      onEvent(event, JSON.parse(data));
    }
  }
}

export function CopilotRail({ onClose }: { onClose: () => void }) {
  const composer = useRef<HTMLTextAreaElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Msg[]>(() => [
    { id: WELCOME_ID, role: "assistant", text: WELCOME_TEXT, parts: [] },
  ]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  const health = useQuery({
    queryKey: qk.agentHealth,
    queryFn: () => apiData<AgentHealth>("/api/agent/health"),
    refetchInterval: 15_000,
  });

  const llmReady = Boolean(health.data?.ok && health.data.llm);
  const showIdle = health.isFetched && !llmReady;
  const showHints = !messages.some((m) => m.role === "user");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        composer.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages]);

  const applyEvent = (assistantId: string, event: string, data: unknown) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== assistantId) return m;
        if (event === "token") {
          const text = (data as { text: string }).text;
          return { ...m, text: m.text + text };
        }
        if (event === "ui") {
          const part = (data as { part: GenUiPart }).part;
          const parts =
            part.type === "ConfirmAction"
              ? [...m.parts.filter((p) => p.type !== "ConfirmAction"), part]
              : [...m.parts.filter((p) => p.type === "ConfirmAction"), part];
          return { ...m, parts };
        }
        if (event === "thread") {
          setThreadId((data as { threadId: string }).threadId);
          return { ...m, threadId: (data as { threadId: string }).threadId };
        }
        if (event === "error") {
          return { ...m, text: m.text || (data as { message: string }).message };
        }
        return m;
      }),
    );
  };

  const send = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || busy || !llmReady) return;
    setInput("");
    const userId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();
    setMessages((m) => [
      ...m,
      { id: userId, role: "user", text, parts: [] },
      { id: assistantId, role: "assistant", text: "", parts: [], pending: true },
    ]);
    setBusy(true);
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, threadId }),
      });
      await readSse(res, (event, data) => applyEvent(assistantId, event, data));
      void qc.invalidateQueries();
    } catch (error) {
      applyEvent(assistantId, "error", {
        message: error instanceof Error ? error.message : "Tally failed",
      });
    } finally {
      setBusy(false);
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, pending: false } : m)));
    }
  };

  const pickSuggestion = (prompt: string) => {
    if (!llmReady || busy) {
      setInput(prompt);
      composer.current?.focus();
      return;
    }
    void send(prompt);
  };

  const resume = useMutation({
    mutationFn: async (decision: "approve" | "reject") => {
      const assistantId = crypto.randomUUID();
      setMessages((m) => [...m, { id: assistantId, role: "assistant", text: "", parts: [], pending: true }]);
      setBusy(true);
      const res = await fetch(`/api/agent/threads/${threadId}/resume`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      await readSse(res, (event, data) => applyEvent(assistantId, event, data));
      void qc.invalidateQueries();
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, pending: false } : m)));
    },
    onSettled: () => setBusy(false),
  });

  return (
    <aside className="fixed inset-0 z-40 flex w-full flex-col border-l-[3px] border-l-copper bg-panel shadow-float pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[360px] lg:pt-0 lg:pb-0">
      <div className="flex h-14 items-center justify-between border-b border-line px-4">
        <div>
          <p className="text-sm font-medium">Tally</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-copper">Sales desk</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      <div ref={scroller} className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "min-w-0",
                m.role === "user" ? "max-w-[92%] rounded-[12px] bg-canvas px-3 py-2 shadow-paper" : "w-full",
              )}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                {m.role === "user" ? "You" : "Tally"}
              </p>
              {m.text ? (
                <div className={cn("mt-1", m.role === "assistant" && "border-l-2 border-copper pl-3")}>
                  {m.role === "assistant" ? (
                    <ChatMarkdown text={m.text} />
                  ) : (
                    <p className="break-words text-sm leading-6">{m.text}</p>
                  )}
                </div>
              ) : m.pending ? (
                <p className="mt-1 text-sm text-ink-muted">Thinking…</p>
              ) : null}
              {m.parts.length > 0 ? (
                <div className="mt-2 min-w-0 space-y-2">
                  {m.parts.map((part) => (
                    <GenUi
                      key={part.id}
                      part={part}
                      busy={busy}
                      onApprove={() => resume.mutate("approve")}
                      onReject={() => resume.mutate("reject")}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {showHints ? (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Try asking</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => pickSuggestion(item.prompt)}
                  disabled={busy}
                  className="min-h-9 rounded-md border border-line bg-canvas/80 px-2.5 py-1.5 text-left font-mono text-[11px] text-ink shadow-paper transition-[color,border-color,background-color] duration-200 ease-ledger hover:border-copper hover:text-copper disabled:opacity-50"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {showIdle ? (
          <p className="text-sm leading-6 text-ink-muted">
            Tally is idle. Set <span className="font-mono">OPENCODE_GO_API_KEY</span> and start the Python agent.
            CRM still works without it. Prompts above fill the composer until the desk is online.
          </p>
        ) : null}
      </div>
      <form
        className="border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <Textarea
          ref={composer}
          data-tally-composer
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={llmReady ? "Ask about revenue, a customer, or the pipeline…" : "Tally unavailable"}
          disabled={!llmReady || busy}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">⌘K · Enter to send</p>
          <Button type="submit" size="sm" disabled={!llmReady || busy || !input.trim()}>
            Send
          </Button>
        </div>
      </form>
    </aside>
  );
}
