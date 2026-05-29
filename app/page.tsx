"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { FAB } from "@/components/ui/FAB";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useAppData } from "@/hooks/use-app-data";
import { useAsync } from "@/hooks/use-async";
import type { Category } from "@/types/finance";

// ─── Transaction form ────────────────────────────────────────────────────────

interface TxFormState {
  categoryId: string;
  amount: string;
  date: string;
  notes: string;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function TxForm({
  categories,
  defaultType,
  cycleStart,
  onSave,
  onCancel,
}: {
  categories: Category[];
  defaultType: "expense" | "saving";
  cycleStart: string;
  onSave: (data: TxFormState & { cycleStart: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const filtered = categories.filter((c) => c.type === defaultType);
  const [values, setValues] = useState<TxFormState>({
    categoryId: filtered[0]?.id ?? "",
    amount: "",
    date: today(),
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<TxFormState>>({});
  const { execute, loading } = useAsync(
    async (v: TxFormState) => onSave({ ...v, cycleStart })
  );

  const set = (k: keyof TxFormState, v: string) => {
    setValues((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const submit = () => {
    const errs: Partial<TxFormState> = {};
    if (!values.categoryId) errs.categoryId = "Required";
    if (!values.amount || isNaN(Number(values.amount)) || Number(values.amount) <= 0)
      errs.amount = "Enter a valid amount";
    if (!values.date) errs.date = "Required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    execute(values);
  };

  return (
    <div className="flex flex-col gap-4 pb-2">
      <Select
        label="Category"
        value={values.categoryId}
        onChange={(e) => set("categoryId", e.target.value)}
        error={errors.categoryId}
        options={filtered.map((c) => ({ label: c.name, value: c.id }))}
        required
      />
      <Input
        label="Amount (₹)"
        type="number"
        inputMode="decimal"
        placeholder="0"
        value={values.amount}
        onChange={(e) => set("amount", e.target.value)}
        error={errors.amount}
        required
      />
      <Input
        label="Date"
        type="date"
        value={values.date}
        onChange={(e) => set("date", e.target.value)}
        error={errors.date}
        required
      />
      <Textarea
        label="Notes (optional)"
        placeholder="What was this for?"
        value={values.notes}
        onChange={(e) => set("notes", e.target.value)}
        rows={2}
      />
      <div className="flex gap-2 pt-1">
        <Button variant="secondary" onClick={onCancel} className="flex-1" disabled={loading}>
          Cancel
        </Button>
        <Button onClick={submit} loading={loading} className="flex-1">
          Add
        </Button>
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

type SheetType = "expense" | "saving" | "budget" | null;

export default function DashboardPage() {
  const router = useRouter();
  const data = useAppData();
  const [sheet, setSheet] = useState<SheetType>(null);
  const [budgetCategoryId, setBudgetCategoryId] = useState<string | null>(null);
  const [budgetAmount, setBudgetAmount] = useState("");
  const { execute: saveBudget, loading: savingBudget } = useAsync(
    async (categoryId: string, amount: number) => {
      await data.setBudget(categoryId, amount);
    }
  );

  const activeCycle = data.activeCycle;
  const { summary, categoryStats, categories, loading } = data;

  const expenseStats = categoryStats.filter((s) => s.category.type === "expense");
  const savingStats = categoryStats.filter((s) => s.category.type === "saving");

  const openBudget = (categoryId: string) => {
    const existing = data.budgets.find(
      (b) => b.categoryId === categoryId && b.cycleStart === activeCycle?.cycleStart
    );
    setBudgetAmount(existing ? String(existing.amount) : "");
    setBudgetCategoryId(categoryId);
    setSheet("budget");
  };

  const handleAddTx = async (formData: {
    categoryId: string;
    amount: string;
    date: string;
    notes: string;
    cycleStart: string;
  }) => {
    await data.addTransaction({
      categoryId: formData.categoryId,
      amount: Number(formData.amount),
      date: formData.date,
      notes: formData.notes,
      cycleStart: formData.cycleStart,
    });
    setSheet(null);
  };

  return (
    <>
      <TopBar
        title="FinApp"
        subtitle={activeCycle?.label ?? "Set up your salary cycle"}
        right={
          <div className="flex items-center gap-1">
            <button
              onClick={() => data.refetch()}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Refresh data"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => router.push("/settings")}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        }
      />

      <div className="flex flex-col gap-5 px-4 py-4">

        {/* Fetch error banner */}
        {data.error && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950 px-4 py-3 text-sm text-rose-600 dark:text-rose-400 flex items-center justify-between gap-2">
            <span>Could not reach server: {data.error}</span>
            <button onClick={() => data.refetch()} className="font-semibold underline shrink-0">Retry</button>
          </div>
        )}

        {/* No cycle setup prompt */}
        {!loading && !data.salaryCycle && (
          <div className="rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-6 text-center">
            <p className="text-2xl mb-2">👋</p>
            <p className="font-semibold text-gray-900 dark:text-gray-50 mb-1">Welcome to FinApp</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Set up your salary cycle to start tracking your finances.
            </p>
            <Button onClick={() => router.push("/settings")} size="sm">
              Set up now
            </Button>
          </div>
        )}

        {/* Summary strip */}
        {data.salaryCycle && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600 mb-3">
              This cycle
            </p>
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard
                label="Salary"
                amount={summary.salary}
                icon="💰"
                colorClass="text-gray-900 dark:text-gray-50"
                bgClass="bg-gray-100 dark:bg-gray-800"
              />
              <SummaryCard
                label="Expenses"
                amount={summary.totalExpenses}
                icon="↑"
                colorClass="text-rose-500"
                bgClass="bg-rose-50 dark:bg-rose-950"
              />
              <SummaryCard
                label="Savings"
                amount={summary.totalSavings}
                icon="↓"
                colorClass="text-emerald-500"
                bgClass="bg-emerald-50 dark:bg-emerald-950"
              />
              <SummaryCard
                label="Balance"
                amount={summary.remaining}
                icon="✦"
                colorClass={summary.remaining < 0 ? "text-rose-500" : "text-blue-600 dark:text-blue-400"}
                bgClass="bg-blue-50 dark:bg-blue-950"
              />
            </div>
          </div>
        )}

        {/* Quick actions */}
        {data.salaryCycle && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Expense", icon: "↑", color: "text-rose-500 bg-rose-50 dark:bg-rose-950", action: () => setSheet("expense") },
              { label: "Saving", icon: "↓", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950", action: () => setSheet("saving") },
              { label: "Category", icon: "+", color: "text-purple-500 bg-purple-50 dark:bg-purple-950", action: () => router.push("/categories") },
              { label: "Budget", icon: "◎", color: "text-amber-500 bg-amber-50 dark:bg-amber-950", action: () => router.push("/settings") },
            ].map((q) => (
              <button
                key={q.label}
                onClick={q.action}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 py-3 shadow-sm active:scale-95 transition-transform"
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold ${q.color}`}>
                  {q.icon}
                </span>
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{q.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Expenses section */}
        {expenseStats.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600 mb-3">
              Expenses
            </p>
            <div className="flex flex-col gap-3">
              {expenseStats.map((stat) => (
                <CategoryCard
                  key={stat.category.id}
                  stat={stat}
                  onSetBudget={() => openBudget(stat.category.id)}
                  onAddTransaction={() => {
                    setSheet("expense");
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Savings section */}
        {savingStats.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600 mb-3">
              Savings
            </p>
            <div className="flex flex-col gap-3">
              {savingStats.map((stat) => (
                <CategoryCard
                  key={stat.category.id}
                  stat={stat}
                  onSetBudget={() => openBudget(stat.category.id)}
                  onAddTransaction={() => setSheet("saving")}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state: have cycle but no categories */}
        {!loading && data.salaryCycle && categories.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center">
            <p className="text-gray-400 dark:text-gray-600 text-sm mb-3">No categories yet.</p>
            <Button variant="secondary" size="sm" onClick={() => router.push("/categories")}>
              Add categories
            </Button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse" />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      {data.salaryCycle && (
        <FAB onClick={() => setSheet("expense")} />
      )}

      {/* Add Expense / Saving sheet */}
      <BottomSheet
        open={sheet === "expense" || sheet === "saving"}
        onClose={() => setSheet(null)}
        title={sheet === "expense" ? "Add Expense" : "Add Saving"}
      >
        {activeCycle && (sheet === "expense" || sheet === "saving") && (
          <TxForm
            categories={categories}
            defaultType={sheet as "expense" | "saving"}
            cycleStart={activeCycle.cycleStart}
            onSave={handleAddTx}
            onCancel={() => setSheet(null)}
          />
        )}
        {!activeCycle && (
          <p className="text-sm text-gray-400 py-4 text-center">
            Set up your salary cycle in Settings first.
          </p>
        )}
      </BottomSheet>

      {/* Set Budget sheet */}
      <BottomSheet
        open={sheet === "budget" && !!budgetCategoryId}
        onClose={() => setSheet(null)}
        title="Set Budget"
      >
        {budgetCategoryId && (
          <div className="flex flex-col gap-4 pb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Budget for{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-50">
                {categories.find((c) => c.id === budgetCategoryId)?.name}
              </span>{" "}
              in this cycle.
            </p>
            <Input
              label="Amount (₹)"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              required
            />
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" onClick={() => setSheet(null)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!budgetCategoryId || !budgetAmount) return;
                  await saveBudget(budgetCategoryId, Number(budgetAmount));
                  setSheet(null);
                }}
                loading={savingBudget}
                className="flex-1"
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
