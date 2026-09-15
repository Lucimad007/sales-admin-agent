"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { User } from "@sales/shared";
import { CopilotRail } from "@/components/copilot/copilot-rail";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiData } from "@/lib/api";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/sales", label: "Sales" },
  { href: "/pipeline", label: "Pipeline" },
];

export function AppShell({
  user,
  pathname,
  children,
}: {
  user: User;
  pathname: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const [copilotOpen, setCopilotOpen] = useState(true);

  const logout = useMutation({
    mutationFn: () => apiData("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      qc.clear();
      router.replace("/login");
    },
  });

  return (
    <div className="min-h-[100dvh] bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-[232px] flex-col border-r border-line bg-panel">
        <div className="px-5 py-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-copper">Ledger</p>
          <p className="mt-1 text-sm text-ink-muted">Sales admin</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors duration-200 ease-ledger",
                  active ? "bg-canvas text-ink" : "text-ink-muted hover:bg-canvas hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line px-4 py-4">
          <p className="truncate text-sm">{user.name}</p>
          <p className="truncate font-mono text-[11px] text-ink-muted">{user.email}</p>
          <Button variant="ghost" size="sm" className="mt-2 px-0" onClick={() => logout.mutate()}>
            Log out
          </Button>
        </div>
      </aside>
      <div className={cn("pl-[232px] transition-[padding] duration-200 ease-ledger", copilotOpen && "pr-[360px]")}>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-end gap-2 border-b border-line bg-canvas/90 px-6 backdrop-blur">
          <Button variant="secondary" size="sm" onClick={() => setCopilotOpen((v) => !v)}>
            {copilotOpen ? "Hide Tally" : "Tally"}
            <span className="font-mono text-[10px] text-ink-muted">⌘K</span>
          </Button>
        </header>
        <main className="px-6 py-6">{children}</main>
      </div>
      {copilotOpen ? <CopilotRail onClose={() => setCopilotOpen(false)} /> : null}
    </div>
  );
}
