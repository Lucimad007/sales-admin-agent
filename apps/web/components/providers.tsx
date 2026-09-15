"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 10_000, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "font-sans",
          classNames: {
            toast: "border-line bg-panel text-ink shadow-paper",
            success: "border-success/40 bg-success/10 text-success",
            error: "border-danger/40 bg-danger/10 text-danger",
          },
        }}
      />
    </QueryClientProvider>
  );
}
