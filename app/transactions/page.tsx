"use client";

import { useState, useMemo } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { TransactionItem } from "@/components/ui/TransactionItem";
import { FAB } from "@/components/ui/FAB";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useAppData } from "@/hooks/use-app-data";
import { useAsync } from "@/hooks/use-async";
import { formatMoney } from "@/lib/calculations";
import type { Category, Transaction } from "@/types/finance";

type Filter = "all" | "expense" | "saving";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function groupByDate(
  transactions: Transaction[],
  categories: Category[]
): { date: string; label: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  sorted.forEach((t) => {
    const key = t.date.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  });
  return Array.from(map.entries()).map(([date, items]) => {
    const d = new Date(date);
    const label = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    return { date, label, items };
  });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function TransactionsPage() {
  const data = useAppData();
  const [filter, setFilter] = useState<Filter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const [form, setForm] = useState({
    categoryId: "",
    amount: "",
    date: today(),
    notes: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<typeof form>>({});

  const { execute: submitTx, loading: submitting, error: txError } = useAsync(
    async () => {
      if (!data.activeCycle) throw new Error("No active cycle");
      await data.addTransaction({
        categoryId: form.categoryId,
        amount: Number(form.amount),
        date: form.date,
        notes: form.notes,
        cycleStart: data.activeCycle.cycleStart,
      });
      setSheetOpen(false);
      setForm({ categoryId: "", amount: "", date: today(), notes: "" });
    }
  );

  const { execute: confirmDelete, loading: deleting } = useAsync(
    async (tx: Transaction) => {
      await data.deleteTransaction(tx.id);
      setDeleteTarget(null);
    }
  );

  const set = (k: keyof typeof form, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setFormErrors((p) => ({ ...p, [k]: undefined }));
  };

  const validate = () => {
    const errs: Partial<typeof form> = {};
    if (!form.categoryId) errs.categoryId = "Required";
    if (!form.amount || Number(form.amount) <= 0) errs.amount = "Enter a valid amount";
    if (!form.date) errs.date = "Required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Filter transactions to active cycle only
  const cycleTxns = data.transactions.filter(
    (t) => t.cycleStart === data.activeCycle?.cycleStart
  );

  const filtered = cycleTxns.filter((t) => {
    if (filter === "all") return true;
    const cat = data.categories.find((c) => c.id === t.categoryId);
    return cat?.type === filter;
  });

  const groups = useMemo(
    () => groupByDate(filtered, data.categories),
    [filtered, data.categories]
  );

  const totalExpenses = cycleTxns
    .filter((t) => data.categories.find((c) => c.id === t.categoryId)?.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalSavings = cycleTxns
    .filter((t) => data.categories.find((c) => c.id === t.categoryId)?.type === "saving")
    .reduce((s, t) => s + Number(t.amount), 0);

  const filterOptions: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "expense", label: "Expenses" },
    { value: "saving", label: "Savings" },
  ];

  return (
    <>
      <TopBar title="Activity" subtitle={data.activeCycle?.label} />

      <div className="flex flex-col gap-4 px-4 py-4">
        {/* Totals strip */}
        {cycleTxns.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-3 shadow-sm">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">Total Expenses</p>
              <p className="text-base font-bold text-rose-500 tabular-nums">{formatMoney(totalExpenses)}</p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-3 shadow-sm">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">Total Savings</p>
              <p className="text-base font-bold text-emerald-500 tabular-nums">{formatMoney(totalSavings)}</p>
            </div>
          </div>
        )}

        {/* Filter chips */}
        <div className="flex gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === opt.value
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Transaction groups */}
        {data.loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-4xl">📭</span>
            <p className="font-semibold text-gray-900 dark:text-gray-50">No transactions yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Tap + to record your first transaction.
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.date}>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 mb-2 px-1">
                {group.label}
              </p>
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm px-4 divide-y divide-gray-50 dark:divide-gray-800">
                {group.items.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    category={data.categories.find((c) => c.id === tx.categoryId)}
                    onDelete={() => setDeleteTarget(tx)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <FAB onClick={() => setSheetOpen(true)} />

      {/* Add transaction sheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Add Transaction"
      >
        <div className="flex flex-col gap-4 pb-2">
          {txError && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400">
              {txError}
            </div>
          )}
          <Select
            label="Category"
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            error={formErrors.categoryId}
            options={data.categories.map((c) => ({ label: `${c.name} (${c.type})`, value: c.id }))}
            required
          />
          <Input
            label="Amount (₹)"
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            error={formErrors.amount}
            required
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            error={formErrors.date}
            required
          />
          <Textarea
            label="Notes (optional)"
            placeholder="What was this for?"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
          />
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" onClick={() => setSheetOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => validate() && submitTx()}
              loading={submitting}
              className="flex-1"
            >
              Add
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
        title="Delete transaction?"
        message="This will remove the transaction and update your totals."
        confirmLabel="Delete"
      />
    </>
  );
}
