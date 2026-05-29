"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { FAB } from "@/components/ui/FAB";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { useAppData } from "@/hooks/use-app-data";
import { useAsync } from "@/hooks/use-async";
import type { Category } from "@/types/finance";

export default function CategoriesPage() {
  const data = useAppData();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [budgetSheet, setBudgetSheet] = useState<Category | null>(null);
  const [budgetAmount, setBudgetAmount] = useState("");

  const [form, setForm] = useState({ name: "", type: "expense" as "expense" | "saving" });
  const [formErrors, setFormErrors] = useState<{ name?: string; type?: string }>({});

  const { execute: addCat, loading: adding, error: addError } = useAsync(async () => {
    if (!form.name.trim()) { setFormErrors({ name: "Name is required" }); return; }
    await data.addCategory(form.name.trim(), form.type);
    setSheetOpen(false);
    setForm({ name: "", type: "expense" });
  });

  const { execute: confirmDelete, loading: deleting } = useAsync(
    async (cat: Category) => {
      await data.deleteCategory(cat.id);
      setDeleteTarget(null);
    }
  );

  const { execute: saveBudget, loading: savingBudget } = useAsync(
    async (cat: Category, amount: number) => {
      await data.setBudget(cat.id, amount);
      setBudgetSheet(null);
    }
  );

  const expenseStats = data.categoryStats.filter((s) => s.category.type === "expense");
  const savingStats = data.categoryStats.filter((s) => s.category.type === "saving");

  const openBudget = (cat: Category) => {
    const existing = data.budgets.find(
      (b) => b.categoryId === cat.id && b.cycleStart === data.activeCycle?.cycleStart
    );
    setBudgetAmount(existing ? String(existing.amount) : "");
    setBudgetSheet(cat);
  };

  return (
    <>
      <TopBar
        title="Categories"
        subtitle={`${data.categories.length} total`}
      />

      <div className="flex flex-col gap-5 px-4 py-4">

        {/* Expenses */}
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
                  onSetBudget={() => openBudget(stat.category)}
                  onDelete={() => setDeleteTarget(stat.category)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Savings */}
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
                  onSetBudget={() => openBudget(stat.category)}
                  onDelete={() => setDeleteTarget(stat.category)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!data.loading && data.categories.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-4xl">🗂️</span>
            <p className="font-semibold text-gray-900 dark:text-gray-50">No categories yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Add categories like Rent, Groceries, Emergency Fund…
            </p>
            <Button onClick={() => setSheetOpen(true)} size="sm">Add category</Button>
          </div>
        )}

        {data.loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse" />
            ))}
          </div>
        )}
      </div>

      <FAB onClick={() => setSheetOpen(true)} />

      {/* Add category sheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="New Category"
      >
        <div className="flex flex-col gap-4 pb-2">
          {addError && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400">
              {addError}
            </div>
          )}
          <Input
            label="Category name"
            placeholder="e.g. Groceries"
            value={form.name}
            onChange={(e) => {
              setForm((p) => ({ ...p, name: e.target.value }));
              setFormErrors({});
            }}
            error={formErrors.name}
            required
          />
          <Select
            label="Type"
            value={form.type}
            onChange={(e) =>
              setForm((p) => ({ ...p, type: e.target.value as "expense" | "saving" }))
            }
            options={[
              { label: "Expense", value: "expense" },
              { label: "Saving", value: "saving" },
            ]}
            required
          />
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" onClick={() => setSheetOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={() => addCat()} loading={adding} className="flex-1">
              Add
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Set budget sheet */}
      <BottomSheet
        open={!!budgetSheet}
        onClose={() => setBudgetSheet(null)}
        title={`Budget for ${budgetSheet?.name}`}
      >
        <div className="flex flex-col gap-4 pb-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Set the budget for this category in the current cycle ({data.activeCycle?.label ?? "—"}).
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
            <Button variant="secondary" onClick={() => setBudgetSheet(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => budgetSheet && saveBudget(budgetSheet, Number(budgetAmount))}
              loading={savingBudget}
              className="flex-1"
              disabled={!budgetAmount || Number(budgetAmount) <= 0}
            >
              Save
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Confirm delete */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && confirmDelete(deleteTarget)}
        loading={deleting}
        title="Delete category?"
        message={`"${deleteTarget?.name}" and all its transactions will be removed.`}
        confirmLabel="Delete"
      />
    </>
  );
}
