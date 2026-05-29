import { cn } from "@/lib/utils";
import { formatMoney, formatMoneyCompact } from "@/lib/calculations";
import { ProgressBar } from "./ProgressBar";
import type { CategoryStat } from "@/types/finance";

interface CategoryCardProps {
  stat: CategoryStat;
  onSetBudget?: () => void;
  onAddTransaction?: () => void;
  onDelete?: () => void;
}

const typeConfig = {
  expense: {
    icon: "↑",
    iconBg: "bg-rose-50 dark:bg-rose-950",
    iconColor: "text-rose-500",
    label: "Expense",
  },
  saving: {
    icon: "↓",
    iconBg: "bg-emerald-50 dark:bg-emerald-950",
    iconColor: "text-emerald-500",
    label: "Saving",
  },
};

export function CategoryCard({ stat, onSetBudget, onAddTransaction, onDelete }: CategoryCardProps) {
  const { category, budgeted, spent, remaining, percentUsed } = stat;
  const cfg = typeConfig[category.type];
  const isOverBudget = remaining < 0 && budgeted > 0;
  const hasNoBudget = budgeted === 0;

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold", cfg.iconBg, cfg.iconColor)}>
            {cfg.icon}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-50 text-[15px]">{category.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{cfg.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasNoBudget ? (
            <button
              onClick={onSetBudget}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg"
            >
              Set budget
            </button>
          ) : (
            <div className="text-right">
              <p className={cn("text-sm font-bold tabular-nums", isOverBudget ? "text-rose-500" : "text-gray-900 dark:text-gray-50")}>
                {formatMoneyCompact(remaining)}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">remaining</p>
            </div>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-300 dark:text-gray-700 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {!hasNoBudget && (
        <>
          <ProgressBar value={percentUsed} />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatMoney(spent)} spent
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatMoney(budgeted)} budget
            </span>
          </div>
        </>
      )}

      {onAddTransaction && (
        <button
          onClick={onAddTransaction}
          className="mt-3 w-full text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          + Add transaction
        </button>
      )}
    </div>
  );
}
