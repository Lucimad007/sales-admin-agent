"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiData, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("leo.a@example.org");
  const [password, setPassword] = useState("demo1234");

  const login = useMutation({
    mutationFn: () => apiData("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    onSuccess: () => router.replace("/dashboard"),
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Could not sign in");
    },
  });

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_12%,rgba(196,78,31,0.22),transparent_52%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_110%,rgba(40,24,12,0.16),transparent_55%)]" />
      <div className="relative w-full max-w-[420px] rounded-[14px] border border-line bg-panel p-6 shadow-float ring-1 ring-white/40 sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-copper">Ledger</p>
        <h1 className="mt-3 text-2xl font-medium tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">Sales admin for the book of business.</p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            login.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button className="w-full" type="submit" disabled={login.isPending}>
            {login.isPending ? "Signing in…" : "Continue"}
          </Button>
        </form>
      </div>
    </main>
  );
}
