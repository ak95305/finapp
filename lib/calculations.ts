import type {
  Category,
  Budget,
  Transaction,
  CategoryStat,
  DashboardSummary,
  SalaryCycle,
} from "@/types/finance";

// ── Named calculation utilities ───────────────────────────────────────────────

export function getCategorySpent(
  transactions: Transaction[],
  categoryId: string,
  cycleStart: string
): number {
  return transactions
    .filter((t) => t.categoryId === categoryId && t.cycleStart === cycleStart)
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

export function getCategoryBudget(
  budgets: Budget[],
  categoryId: string,
  cycleStart: string
): number {
  const b = budgets.find(
    (b) => b.categoryId === categoryId && b.cycleStart === cycleStart
  );
  return b ? Number(b.amount) : 0;
}

export function getCategoryRemaining(budgeted: number, spent: number): number {
  return budgeted - spent;
}

export function getBudgetProgress(spent: number, budgeted: number): number {
  if (budgeted <= 0) return 0;
  return Math.min(100, (spent / budgeted) * 100);
}

export function getTotalExpenses(
  transactions: Transaction[],
  categories: Category[],
  cycleStart: string
): number {
  const ids = new Set(
    categories.filter((c) => c.type === "expense").map((c) => c.id)
  );
  return transactions
    .filter((t) => t.cycleStart === cycleStart && ids.has(t.categoryId))
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

export function getTotalSavings(
  transactions: Transaction[],
  categories: Category[],
  cycleStart: string
): number {
  const ids = new Set(
    categories.filter((c) => c.type === "saving").map((c) => c.id)
  );
  return transactions
    .filter((t) => t.cycleStart === cycleStart && ids.has(t.categoryId))
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

export function getRemainingBalance(
  salary: number,
  transactions: Transaction[],
  categories: Category[],
  cycleStart: string
): number {
  return (
    salary -
    getTotalExpenses(transactions, categories, cycleStart) -
    getTotalSavings(transactions, categories, cycleStart)
  );
}

// ── Derived-state builders (used by context) ──────────────────────────────────

export function computeCategoryStats(
  categories: Category[],
  budgets: Budget[],
  transactions: Transaction[],
  cycleStart: string
): CategoryStat[] {
  return categories.map((category) => {
    const spent = getCategorySpent(transactions, category.id, cycleStart);
    const budgeted = getCategoryBudget(budgets, category.id, cycleStart);
    const remaining = getCategoryRemaining(budgeted, spent);
    const percentUsed = getBudgetProgress(spent, budgeted);
    return { category, budgeted, spent, remaining, percentUsed };
  });
}

export function computeSummary(
  salaryCycle: SalaryCycle | null,
  categoryStats: CategoryStat[]
): DashboardSummary {
  const salary = salaryCycle ? Number(salaryCycle.salary) : 0;
  const totalExpenses = categoryStats
    .filter((s) => s.category.type === "expense")
    .reduce((sum, s) => sum + s.spent, 0);
  const totalSavings = categoryStats
    .filter((s) => s.category.type === "saving")
    .reduce((sum, s) => sum + s.spent, 0);
  return { salary, totalExpenses, totalSavings, remaining: salary - totalExpenses - totalSavings };
}

// ── Formatting ────────────────────────────────────────────────────────────────

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMoneyCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 100_000) return `${sign}₹${(abs / 100_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₹${abs}`;
}
