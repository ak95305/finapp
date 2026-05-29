import type { ApiResponse, PaginatedResponse } from "@/types";

// All requests go through the Next.js proxy at /api/sheets to avoid CORS.
// Apps Script doesn't handle POST bodies reliably after its redirect, so
// mutating actions (create/update/delete) are also sent as GET query params.
const PROXY = "/api/sheets";

async function request<T>(
  _method: "GET" | "POST",
  params: Record<string, string | undefined>
): Promise<T> {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
    )
  ).toString();
  const res = await fetch(`${PROXY}?${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === undefined) {
    throw new Error(response.error ?? "Unknown API error");
  }
  return response.data;
}

export function createApiClient<TRecord extends { id: string }, TCreate>(
  sheet: string
) {
  return {
    async getAll(): Promise<TRecord[]> {
      const res = await request<PaginatedResponse<TRecord>>("GET", {
        action: "getAll",
        sheet,
      });
      return unwrap(res);
    },

    async getById(id: string): Promise<TRecord> {
      const res = await request<ApiResponse<TRecord>>("GET", {
        action: "getById",
        sheet,
        id,
      });
      return unwrap(res);
    },

    async create(data: TCreate): Promise<TRecord> {
      const res = await request<ApiResponse<TRecord>>("POST", {
        action: "create",
        sheet,
        ...flattenData(data),
      });
      return unwrap(res);
    },

    async update(id: string, data: Partial<TCreate>): Promise<TRecord> {
      const res = await request<ApiResponse<TRecord>>("POST", {
        action: "update",
        sheet,
        id,
        ...flattenData(data),
      });
      return unwrap(res);
    },

    async delete(id: string): Promise<void> {
      const res = await request<ApiResponse<null>>("POST", {
        action: "delete",
        sheet,
        id,
      });
      if (!res.success) throw new Error(res.error ?? "Delete failed");
    },
  };
}

function flattenData(data: unknown): Record<string, string> {
  if (typeof data !== "object" || data === null) return {};
  return Object.fromEntries(
    Object.entries(data as Record<string, unknown>).map(([k, v]) => [
      k,
      String(v ?? ""),
    ])
  );
}
