"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type {
  SalaryCycle,
  Category,
  Budget,
  Transaction,
  CyclePeriod,
  CategoryStat,
  DashboardSummary,
  CreateTransactionInput,
} from "@/types/finance";
import { salaryCyclesService } from "@/services/salary-cycles";
import { categoriesService } from "@/services/categories";
import { budgetsService } from "@/services/budgets";
import { transactionsService } from "@/services/transactions";
import { getCyclePeriod } from "@/lib/cycle";
import { computeCategoryStats, computeSummary } from "@/lib/calculations";
import {
  fetchBootstrap,
  readLocalCache,
  writeLocalCache,
  clearLocalCache,
} from "@/lib/bootstrap";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppDataContextValue {
  // Raw collections
  salaryCycles: SalaryCycle[];
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];

  // Derived — computed client-side, zero network
  salaryCycle: SalaryCycle | null;
  activeCycle: CyclePeriod | null;
  categoryStats: CategoryStat[];
  summary: DashboardSummary;

  // Bootstrap state
  loading: boolean;
  bootstrapped: boolean;
  error: string | null;

  // Mutations (all optimistic — UI updates instantly)
  saveSalaryCycle: (startDay: number, salary: number) => Promise<void>;
  addCategory: (name: string, type: "expense" | "saving") => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setBudget: (categoryId: string, amount: number) => Promise<void>;
  addTransaction: (data: CreateTransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  refetch: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AppDataContext = createContext<AppDataContextValue | null>(null);

// ── Helpers ───────────────────────────────────────────────────────────────────

function tempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function isoNow() {
  return new Date().toISOString();
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [salaryCycles, setSalaryCycles] = useState<SalaryCycle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchTick, setFetchTick] = useState(0);

  // Refs for stable access inside callbacks (avoids stale closures)
  const salaryCyclesRef = useRef(salaryCycles);
  const categoriesRef = useRef(categories);
  const budgetsRef = useRef(budgets);
  const transactionsRef = useRef(transactions);

  useEffect(() => { salaryCyclesRef.current = salaryCycles; }, [salaryCycles]);
  useEffect(() => { categoriesRef.current = categories; }, [categories]);
  useEffect(() => { budgetsRef.current = budgets; }, [budgets]);
  useEffect(() => { transactionsRef.current = transactions; }, [transactions]);

  // ── Bootstrap: stale-while-revalidate ───────────────────────────────────────

  useEffect(() => {
    // 1. Serve from localStorage immediately (synchronous, zero network)
    const cached = readLocalCache();
    if (cached) {
      setSalaryCycles(cached.salaryCycles);
      setCategories(cached.categories);
      setBudgets(cached.budgets);
      setTransactions(cached.transactions);
      setBootstrapped(true);
      setLoading(false);
    }

    // 2. Refresh from Apps Script in background (single request)
    fetchBootstrap()
      .then((fresh) => {
        setSalaryCycles(fresh.salaryCycles);
        setCategories(fresh.categories);
        setBudgets(fresh.budgets);
        setTransactions(fresh.transactions);
        writeLocalCache(fresh);
        setBootstrapped(true);
        setError(null);
      })
      .catch((e) => {
        // If we had cache, stay silent — stale data is still usable
        if (!cached) {
          setError(e instanceof Error ? e.message : "Failed to load data");
        }
      })
      .finally(() => setLoading(false));

    // fetchTick intentionally not in deps — we want to re-run manually via refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTick]);

  const refetch = useCallback(() => {
    clearLocalCache();
    setFetchTick((t) => t + 1);
  }, []);

  // ── Derived state (all client-side, zero network) ──────────────────────────

  const salaryCycle = salaryCycles[0] ?? null;

  const activeCycle = useMemo(
    () => (salaryCycle ? getCyclePeriod(Number(salaryCycle.startDay)) : null),
    // Recompute only when startDay changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [salaryCycle?.startDay]
  );

  const activeCycleRef = useRef(activeCycle);
  useEffect(() => { activeCycleRef.current = activeCycle; }, [activeCycle]);

  const categoryStats = useMemo(
    () =>
      activeCycle && categories.length > 0
        ? computeCategoryStats(categories, budgets, transactions, activeCycle.cycleStart)
        : [],
    [activeCycle, categories, budgets, transactions]
  );

  const summary = useMemo(
    () => computeSummary(salaryCycle, categoryStats),
    [salaryCycle, categoryStats]
  );

  // ── Mutations ─────────────────────────────────────────────────────────────

  const saveSalaryCycle = useCallback(
    async (startDay: number, salary: number): Promise<void> => {
      const existing = salaryCyclesRef.current[0];

      if (existing) {
        const prev = salaryCyclesRef.current;
        const optimistic: SalaryCycle = { ...existing, startDay, salary, updatedAt: isoNow() };
        setSalaryCycles([optimistic]);
        try {
          const real = await salaryCyclesService.update(existing.id, { startDay, salary });
          setSalaryCycles([real]);
          clearLocalCache();
        } catch (e) {
          setSalaryCycles(prev);
          throw e;
        }
      } else {
        const tid = tempId();
        const optimistic: SalaryCycle = { id: tid, startDay, salary, createdAt: isoNow(), updatedAt: isoNow() };
        setSalaryCycles([optimistic]);
        try {
          const real = await salaryCyclesService.create({ startDay, salary });
          setSalaryCycles([real]);
          clearLocalCache();
        } catch (e) {
          setSalaryCycles([]);
          throw e;
        }
      }
    },
    []
  );

  const addCategory = useCallback(
    async (name: string, type: "expense" | "saving"): Promise<void> => {
      const tid = tempId();
      const optimistic: Category = { id: tid, name, type, createdAt: isoNow(), updatedAt: isoNow() };
      setCategories((prev) => [...prev, optimistic]);
      try {
        const real = await categoriesService.create({ name, type });
        setCategories((prev) => prev.map((c) => (c.id === tid ? real : c)));
        clearLocalCache();
      } catch (e) {
        setCategories((prev) => prev.filter((c) => c.id !== tid));
        throw e;
      }
    },
    []
  );

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    const prevCategories = categoriesRef.current;
    const prevBudgets = budgetsRef.current;
    const prevTransactions = transactionsRef.current;

    setCategories((prev) => prev.filter((c) => c.id !== id));
    setBudgets((prev) => prev.filter((b) => b.categoryId !== id));
    setTransactions((prev) => prev.filter((t) => t.categoryId !== id));

    try {
      await categoriesService.delete(id);
      clearLocalCache();
    } catch (e) {
      setCategories(prevCategories);
      setBudgets(prevBudgets);
      setTransactions(prevTransactions);
      throw e;
    }
  }, []);

  const setBudget = useCallback(
    async (categoryId: string, amount: number): Promise<void> => {
      const cycle = activeCycleRef.current;
      if (!cycle) throw new Error("No active cycle");
      const { cycleStart } = cycle;

      const existing = budgetsRef.current.find(
        (b) => b.categoryId === categoryId && b.cycleStart === cycleStart
      );

      if (existing) {
        const prev = budgetsRef.current;
        const optimistic: Budget = { ...existing, amount, updatedAt: isoNow() };
        setBudgets((prev) => prev.map((b) => (b.id === existing.id ? optimistic : b)));
        try {
          const real = await budgetsService.update(existing.id, { amount });
          setBudgets((prev) => prev.map((b) => (b.id === existing.id ? real : b)));
          clearLocalCache();
        } catch (e) {
          setBudgets(prev);
          throw e;
        }
      } else {
        const tid = tempId();
        const optimistic: Budget = { id: tid, categoryId, cycleStart, amount, createdAt: isoNow(), updatedAt: isoNow() };
        setBudgets((prev) => [...prev, optimistic]);
        try {
          const real = await budgetsService.create({ categoryId, cycleStart, amount });
          setBudgets((prev) => prev.map((b) => (b.id === tid ? real : b)));
          clearLocalCache();
        } catch (e) {
          setBudgets((prev) => prev.filter((b) => b.id !== tid));
          throw e;
        }
      }
    },
    []
  );

  const addTransaction = useCallback(
    async (input: CreateTransactionInput): Promise<void> => {
      const tid = tempId();
      const optimistic: Transaction = { ...input, id: tid, createdAt: isoNow(), updatedAt: isoNow() };
      setTransactions((prev) => [...prev, optimistic]);
      try {
        const real = await transactionsService.create(input);
        setTransactions((prev) => prev.map((t) => (t.id === tid ? real : t)));
        clearLocalCache();
      } catch (e) {
        setTransactions((prev) => prev.filter((t) => t.id !== tid));
        throw e;
      }
    },
    []
  );

  const deleteTransaction = useCallback(async (id: string): Promise<void> => {
    const prev = transactionsRef.current;
    setTransactions((t) => t.filter((tx) => tx.id !== id));
    try {
      await transactionsService.delete(id);
      clearLocalCache();
    } catch (e) {
      setTransactions(prev);
      throw e;
    }
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────

  const value: AppDataContextValue = {
    salaryCycles,
    categories,
    budgets,
    transactions,
    salaryCycle,
    activeCycle,
    categoryStats,
    summary,
    loading,
    bootstrapped,
    error,
    saveSalaryCycle,
    addCategory,
    deleteCategory,
    setBudget,
    addTransaction,
    deleteTransaction,
    refetch,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

// ── Consumer hook ─────────────────────────────────────────────────────────────

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside <AppDataProvider>");
  return ctx;
}
