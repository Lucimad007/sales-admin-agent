export const qk = {
  me: ["me"] as const,
  dashboard: ["dashboard"] as const,
  customers: (filters: unknown) => ["customers", filters] as const,
  customer: (id: string) => ["customer", id] as const,
  sales: (filters: unknown) => ["sales", filters] as const,
  sale: (id: string) => ["sale", id] as const,
  agentHealth: ["agent-health"] as const,
};
