"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { salaryCyclesService } from "@/services/salary-cycles";
import { categoriesService } from "@/services/categories";
import { budgetsService } from "@/services/budgets";
import { transactionsService } from "@/services/transactions";
import { getCyclePeriod } from "@/lib/cycle";
import { computeCategoryStats, computeSummary } from "@/lib/calculations";
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

export interface FinanceData {
  salaryCycle: SalaryCycle | null;
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  activeCycle: CyclePeriod | null;
  categoryStats: CategoryStat[];
  summary: DashboardSummary;
  loading: boolean;
  error: string | null;
  saveSalaryCycle: (startDay: number, salary: number) => Promise<void>;
  addCategory: (name: string, type: "expense" | "saving") => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setBudget: (categoryId: string, amount: number) => Promise<void>;
  addTransaction: (data: CreateTransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  refetch: () => void;
}

const emptySummary: DashboardSummary = {
  salary: 0,
  totalExpenses: 0,
  totalSavings: 0,
  remaining: 0,
};

export function useFinanceData(): FinanceData {
  const [salaryCycle, setSalaryCycle] = useState<SalaryCycle | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      salaryCyclesService.getAll().catch(() => [] as SalaryCycle[]),
      categoriesService.getAll().catch(() => [] as Category[]),
      budgetsService.getAll().catch(() => [] as Budget[]),
      transactionsService.getAll().catch(() => [] as Transaction[]),
    ])
      .then(([cycles, cats, buds, txns]) => {
        if (cancelled) return;
        // Use the most recently created salary cycle
        const sorted = [...cycles].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt)
        );
        setSalaryCycle(sorted[0] ?? null);
        setCategories(cats);
        setBudgets(buds);
        setTransactions(txns);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  const activeCycle = useMemo(
    () => (salaryCycle ? getCyclePeriod(Number(salaryCycle.startDay)) : null),
    // Re-compute only when startDay changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [salaryCycle?.startDay]
  );

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

  // ── Mutations ──────────────────────────────────────────────────────────────

  const saveSalaryCycle = useCallback(
    async (startDay: number, salary: number) => {
      if (salaryCycle) {
        const updated = await salaryCyclesService.update(salaryCycle.id, {
          startDay,
          salary,
        });
        setSalaryCycle(updated);
      } else {
        const created = await salaryCyclesService.create({ startDay, salary });
        setSalaryCycle(created);
      }
    },
    [salaryCycle]
  );

  const addCategory = useCallback(
    async (name: string, type: "expense" | "saving") => {
      const created = await categoriesService.create({ name, type });
      setCategories((prev) => [...prev, created]);
    },
    []
  );

  const deleteCategory = useCallback(async (id: string) => {
    await categoriesService.delete(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setBudgets((prev) => prev.filter((b) => b.categoryId !== id));
    setTransactions((prev) => prev.filter((t) => t.categoryId !== id));
  }, []);

  const setBudget = useCallback(
    async (categoryId: string, amount: number) => {
      if (!activeCycle) throw new Error("No active cycle");
      const { cycleStart } = activeCycle;
      const existing = budgets.find(
        (b) => b.categoryId === categoryId && b.cycleStart === cycleStart
      );
      if (existing) {
        const updated = await budgetsService.update(existing.id, { amount });
        setBudgets((prev) =>
          prev.map((b) => (b.id === existing.id ? updated : b))
        );
      } else {
        const created = await budgetsService.create({
          categoryId,
          cycleStart,
          amount,
        });
        setBudgets((prev) => [...prev, created]);
      }
    },
    [activeCycle, budgets]
  );

  const addTransaction = useCallback(
    async (data: CreateTransactionInput) => {
      const created = await transactionsService.create(data);
      setTransactions((prev) => [...prev, created]);
    },
    []
  );

  const deleteTransaction = useCallback(async (id: string) => {
    await transactionsService.delete(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    salaryCycle,
    categories,
    budgets,
    transactions,
    activeCycle,
    categoryStats,
    summary,
    loading,
    error,
    saveSalaryCycle,
    addCategory,
    deleteCategory,
    setBudget,
    addTransaction,
    deleteTransaction,
    refetch,
  };
}
