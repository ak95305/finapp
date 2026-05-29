import type { SalaryCycle, Category, Budget, Transaction } from "@/types/finance";

export interface BootstrapData {
  salaryCycles: SalaryCycle[];
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
}

const LS_KEY = "finapp_bs_v1";
const LS_TTL = 5 * 60 * 1000; // 5 min — stale-while-revalidate window

interface LocalCache {
  data: BootstrapData;
  ts: number;
}

export function readLocalCache(): BootstrapData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const { data, ts }: LocalCache = JSON.parse(raw);
    if (Date.now() - ts > LS_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeLocalCache(data: BootstrapData): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

export function clearLocalCache(): void {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
}

export async function fetchBootstrap(): Promise<BootstrapData> {
  const res = await fetch("/api/sheets?action=bootstrap", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Bootstrap failed");
  return json.data as BootstrapData;
}
