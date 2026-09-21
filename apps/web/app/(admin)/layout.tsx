"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { apiData, ApiError } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { User } from "@sales/shared";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const me = useQuery({
    queryKey: qk.me,
    queryFn: () => apiData<User>("/api/auth/me"),
    retry: false,
  });

  useEffect(() => {
    if (me.error instanceof ApiError && me.error.status === 401) {
      router.replace("/login");
    }
  }, [me.error, router]);

  if (me.isLoading) {
    return <div className="flex min-h-[100dvh] items-center justify-center text-sm text-ink-muted">Loading desk…</div>;
  }
  if (!me.data) {
    return null;
  }

  return (
    <AppShell user={me.data} pathname={pathname}>
      {children}
    </AppShell>
  );
}
