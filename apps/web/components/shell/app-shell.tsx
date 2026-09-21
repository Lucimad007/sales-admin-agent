"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

const LG = "(min-width: 1024px)";

function MenuGlyph() {
  return (
    <span className="flex h-3.5 w-4 flex-col justify-between" aria-hidden>
      <span className="h-px w-full bg-current" />
      <span className="h-px w-full bg-current" />
      <span className="h-px w-full bg-current" />
    </span>
  );
}

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
  const [navOpen, setNavOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [isLg, setIsLg] = useState(false);

  const logout = useMutation({
    mutationFn: () => apiData("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      qc.clear();
      router.replace("/login");
    },
  });

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia(LG);
    const sync = () => {
      if (mq.matches) {
        setIsLg(true);
        setCopilotOpen(true);
        setNavOpen(false);
      } else {
        setIsLg(false);
        setCopilotOpen(false);
        setNavOpen(false);
      }
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(LG);
    const lock = () => {
      document.body.style.overflow = navOpen || (copilotOpen && !mq.matches) ? "hidden" : "";
    };
    lock();
    mq.addEventListener("change", lock);
    return () => {
      mq.removeEventListener("change", lock);
      document.body.style.overflow = "";
    };
  }, [navOpen, copilotOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCopilotOpen(true);
        window.setTimeout(() => {
          document.querySelector<HTMLTextAreaElement>("[data-tally-composer]")?.focus();
        }, 50);
      }
      if (e.key === "Escape") {
        setNavOpen(false);
        if (!window.matchMedia(LG).matches) setCopilotOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-canvas">
      {navOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-ink/45 backdrop-blur-[2px] lg:hidden"
          onClick={() => setNavOpen(false)}
        />
      ) : null}
      <aside
        id="ledger-nav"
        aria-hidden={!isLg && !navOpen}
        inert={!isLg && !navOpen ? true : undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[min(232px,86vw)] flex-col border-r border-line bg-panel shadow-float transition-transform duration-200 ease-ledger",
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
          navOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        )}
      >
        <div className="flex items-start justify-between gap-2 px-5 py-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-copper">Desk</p>
            <p className="mt-1 text-sm text-ink-muted">Sales admin</p>
          </div>
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setNavOpen(false)}>
            Close
          </Button>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-11 items-center rounded-lg border-l-[3px] px-3 py-2 text-sm transition-[color,background-color,box-shadow,border-color] duration-200 ease-ledger lg:min-h-0",
                  active
                    ? "border-copper bg-canvas font-medium text-ink shadow-paper"
                    : "border-transparent text-ink-muted hover:bg-canvas/80 hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line px-4 py-4 pb-8 lg:pb-4">
          <p className="truncate text-sm">{user.name}</p>
          <p className="truncate font-mono text-[11px] text-ink-muted">{user.email}</p>
          <Button variant="ghost" size="sm" className="mt-2 min-h-11 px-0 lg:min-h-8" onClick={() => logout.mutate()}>
            Log out
          </Button>
        </div>
      </aside>
      <div className={cn("min-w-0 lg:pl-[232px]", copilotOpen && "lg:pr-[360px]")}>
        <header className="sticky top-0 z-20 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between gap-2 border-b border-line bg-canvas/80 px-4 pt-[env(safe-area-inset-top)] shadow-paper backdrop-blur-md lg:justify-end lg:px-6">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <Button
              variant="secondary"
              size="sm"
              className="h-11"
              aria-expanded={navOpen}
              aria-controls="ledger-nav"
              onClick={() => setNavOpen(true)}
            >
              <MenuGlyph />
              Menu
            </Button>
            <p className="truncate font-mono text-[11px] uppercase tracking-[0.22em] text-copper">Desk</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="h-11 shrink-0 lg:h-8"
            onClick={() => setCopilotOpen((v) => !v)}
          >
            {copilotOpen ? "Hide Tally" : "Tally"}
            <span className="hidden font-mono text-[10px] text-ink-muted sm:inline">⌘K</span>
          </Button>
        </header>
        <main className="px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-6 lg:py-6">{children}</main>
      </div>
      {copilotOpen ? <CopilotRail onClose={() => setCopilotOpen(false)} /> : null}
    </div>
  );
}
