"use client";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/calculations";
import type { Transaction, Category } from "@/types/finance";

interface TransactionItemProps {
  transaction: Transaction;
  category: Category | undefined;
  onDelete?: () => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function TransactionItem({ transaction, category, onDelete }: TransactionItemProps) {
  const isExpense = category?.type === "expense";

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold",
          isExpense
            ? "bg-rose-50 text-rose-500 dark:bg-rose-950"
            : "bg-emerald-50 text-emerald-500 dark:bg-emerald-950"
        )}
      >
        {isExpense ? "↑" : "↓"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-gray-900 dark:text-gray-50 truncate">
          {category?.name ?? "Unknown"}
        </p>
        {transaction.notes && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{transaction.notes}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <p
          className={cn(
            "text-[15px] font-semibold tabular-nums",
            isExpense ? "text-rose-500" : "text-emerald-500"
          )}
        >
          {isExpense ? "−" : "+"}{formatMoney(Number(transaction.amount))}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500">
          {formatDate(transaction.date)}
        </p>
      </div>
      {onDelete && (
        <button
          onClick={onDelete}
          className="ml-1 flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
          aria-label="Delete transaction"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
