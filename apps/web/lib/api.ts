export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json().catch(() => ({}))) as {
    data?: T;
    meta?: unknown;
    error?: { code?: string; message?: string };
  };
  if (!res.ok) {
    throw new ApiError(
      res.status,
      json.error?.code ?? "INTERNAL",
      json.error?.message ?? "Request failed",
    );
  }
  return json as T;
}

export async function apiData<T>(path: string, init?: RequestInit): Promise<T> {
  const json = await api<{ data: T }>(path, init);
  return json.data;
}
