"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAppData } from "@/hooks/use-app-data";
import { useAsync } from "@/hooks/use-async";
import { getCyclePeriod } from "@/lib/cycle";
import { formatMoney } from "@/lib/calculations";

export default function SettingsPage() {
  const data = useAppData();

  // ── Salary Cycle form ─────────────────────────────────────────────────────
  const [startDay, setStartDay] = useState("");
  const [salary, setSalary] = useState("");
  const [cycleErrors, setCycleErrors] = useState<{ startDay?: string; salary?: string }>({});

  useEffect(() => {
    if (data.salaryCycle) {
      setStartDay(String(data.salaryCycle.startDay));
      setSalary(String(data.salaryCycle.salary));
    }
  }, [data.salaryCycle]);

  const { execute: saveCycle, loading: savingCycle, error: cycleError, success: cycleSaved } = useAsync(
    async () => {
      const errs: { startDay?: string; salary?: string } = {};
      const sd = Number(startDay);
      const sal = Number(salary);
      if (!startDay || isNaN(sd) || sd < 1 || sd > 28) errs.startDay = "Enter a day between 1 and 28";
      if (!salary || isNaN(sal) || sal <= 0) errs.salary = "Enter a valid salary";
      if (Object.keys(errs).length) { setCycleErrors(errs); return; }
      setCycleErrors({});
      await data.saveSalaryCycle(sd, sal);
    }
  );

  // Preview cycle period
  const previewCycle =
    startDay && !isNaN(Number(startDay)) && Number(startDay) >= 1 && Number(startDay) <= 28
      ? getCyclePeriod(Number(startDay))
      : null;

  // ── Budget Allocation ─────────────────────────────────────────────────────
  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>({});
  const [savingBudgetFor, setSavingBudgetFor] = useState<string | null>(null);

  const cycleStart = data.activeCycle?.cycleStart;
  const { categories, budgets } = data;

  useEffect(() => {
    if (!cycleStart) return;
    const init: Record<string, string> = {};
    categories.forEach((cat) => {
      const b = budgets.find(
        (bud) => bud.categoryId === cat.id && bud.cycleStart === cycleStart
      );
      init[cat.id] = b ? String(b.amount) : "";
    });
    setBudgetInputs(init);
  }, [cycleStart, categories, budgets]);

  const saveBudgetFor = async (categoryId: string) => {
    const amount = Number(budgetInputs[categoryId]);
    if (isNaN(amount) || amount < 0) return;
    setSavingBudgetFor(categoryId);
    try {
      await data.setBudget(categoryId, amount);
    } finally {
      setSavingBudgetFor(null);
    }
  };

  const expenseCategories = data.categories.filter((c) => c.type === "expense");
  const savingCategories = data.categories.filter((c) => c.type === "saving");

  return (
    <>
      <TopBar title="Settings" />

      <div className="flex flex-col gap-6 px-4 py-4">

        {/* ── Salary Cycle ─────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-50">Salary Cycle</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
              Define when your salary cycle starts each month.
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 shadow-sm flex flex-col gap-4">
            {cycleError && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400">
                {cycleError}
              </div>
            )}
            {cycleSaved && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950 px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400">
                Cycle saved successfully.
              </div>
            )}

            <Input
              label="Cycle start day"
              type="number"
              inputMode="numeric"
              placeholder="e.g. 5"
              value={startDay}
              onChange={(e) => { setStartDay(e.target.value); setCycleErrors({}); }}
              error={cycleErrors.startDay}
              hint="Day of month (1–28) when your salary arrives"
              required
            />

            <Input
              label="Monthly salary (₹)"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 80000"
              value={salary}
              onChange={(e) => { setSalary(e.target.value); setCycleErrors({}); }}
              error={cycleErrors.salary}
              required
            />

            {previewCycle && (
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 px-4 py-3 text-sm">
                <p className="text-xs font-medium text-blue-500 dark:text-blue-400 mb-0.5">Current cycle</p>
                <p className="font-semibold text-blue-700 dark:text-blue-300">{previewCycle.label}</p>
              </div>
            )}

            <Button onClick={() => saveCycle()} loading={savingCycle} className="w-full">
              {data.salaryCycle ? "Update cycle" : "Set up cycle"}
            </Button>
          </div>
        </section>

        {/* ── Budget Allocation ─────────────────────────────────────────── */}
        {data.activeCycle && data.categories.length > 0 && (
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-50">Budget Allocation</h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                Set budgets for {data.activeCycle.label}.
              </p>
            </div>

            {expenseCategories.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600 px-1 mb-1">
                  Expenses
                </p>
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                  {expenseCategories.map((cat, idx) => {
                    const stat = data.categoryStats.find((s) => s.category.id === cat.id);
                    return (
                      <div
                        key={cat.id}
                        className={`px-4 py-3 ${idx > 0 ? "border-t border-gray-50 dark:border-gray-800" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{cat.name}</p>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              inputMode="decimal"
                              placeholder="0"
                              value={budgetInputs[cat.id] ?? ""}
                              onChange={(e) =>
                                setBudgetInputs((p) => ({ ...p, [cat.id]: e.target.value }))
                              }
                              onBlur={() => saveBudgetFor(cat.id)}
                              className="w-24 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 py-1 text-sm text-right text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {savingBudgetFor === cat.id && (
                              <span className="text-xs text-blue-500">Saving…</span>
                            )}
                          </div>
                        </div>
                        {stat && stat.budgeted > 0 && (
                          <div>
                            <ProgressBar value={stat.percentUsed} />
                            <div className="flex justify-between mt-1">
                              <span className="text-[11px] text-gray-400">{formatMoney(stat.spent)} spent</span>
                              <span className="text-[11px] text-gray-400">{formatMoney(stat.budgeted)} budget</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {savingCategories.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600 px-1 mb-1">
                  Savings
                </p>
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                  {savingCategories.map((cat, idx) => {
                    const stat = data.categoryStats.find((s) => s.category.id === cat.id);
                    return (
                      <div
                        key={cat.id}
                        className={`px-4 py-3 ${idx > 0 ? "border-t border-gray-50 dark:border-gray-800" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{cat.name}</p>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              inputMode="decimal"
                              placeholder="0"
                              value={budgetInputs[cat.id] ?? ""}
                              onChange={(e) =>
                                setBudgetInputs((p) => ({ ...p, [cat.id]: e.target.value }))
                              }
                              onBlur={() => saveBudgetFor(cat.id)}
                              className="w-24 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 py-1 text-sm text-right text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {savingBudgetFor === cat.id && (
                              <span className="text-xs text-blue-500">Saving…</span>
                            )}
                          </div>
                        </div>
                        {stat && stat.budgeted > 0 && (
                          <div>
                            <ProgressBar
                              value={stat.percentUsed}
                              colorClass="bg-emerald-500"
                            />
                            <div className="flex justify-between mt-1">
                              <span className="text-[11px] text-gray-400">{formatMoney(stat.spent)} saved</span>
                              <span className="text-[11px] text-gray-400">{formatMoney(stat.budgeted)} goal</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* No categories hint */}
        {data.activeCycle && data.categories.length === 0 && !data.loading && (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-5 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-600">
              Add categories first to allocate budgets.
            </p>
          </div>
        )}

        {/* App info */}
        <div className="flex flex-col items-center gap-1 py-4 text-center">
          <p className="text-xs text-gray-300 dark:text-gray-700">FinApp · Phase 1</p>
        </div>
      </div>
    </>
  );
}
