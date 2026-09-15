"use client";

import type { Components } from "react-markdown";
import Markdown from "react-markdown";

const FACTS_TAIL = /\s*\{\s*"facts"\s*:\s*\[[\s\S]*?\]\s*\}\s*$/;

const components: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-medium text-ink">{children}</strong>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1.5 pl-4 last:mb-0">{children}</ol>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1.5 pl-4 last:mb-0">{children}</ul>,
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  code: ({ children }) => (
    <code className="rounded bg-canvas px-1 py-0.5 font-mono text-[12px]">{children}</code>
  ),
  a: ({ href, children }) => (
    <a href={href} className="text-copper underline-offset-2 hover:underline">
      {children}
    </a>
  ),
};

export function ChatMarkdown({ text }: { text: string }) {
  const cleaned = text.replace(FACTS_TAIL, "").trim();
  if (!cleaned) return null;
  return (
    <div className="break-words text-sm leading-6 text-ink">
      <Markdown components={components}>{cleaned}</Markdown>
    </div>
  );
}
