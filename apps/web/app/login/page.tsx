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
    <main className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="w-full max-w-[420px] rounded-[10px] border border-line bg-panel p-8 shadow-paper">
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
