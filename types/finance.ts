import type { BaseRecord } from "./index";

export interface SalaryCycle extends BaseRecord {
  startDay: number;
  salary: number;
}

export interface Category extends BaseRecord {
  name: string;
  type: "expense" | "saving";
}

export interface Budget extends BaseRecord {
  categoryId: string;
  cycleStart: string;
  amount: number;
}

export interface Transaction extends BaseRecord {
  categoryId: string;
  cycleStart: string;
  amount: number;
  date: string;
  notes: string;
}

export interface CyclePeriod {
  start: Date;
  end: Date;
  cycleStart: string;
  label: string;
}

export interface CategoryStat {
  category: Category;
  budgeted: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

export interface DashboardSummary {
  salary: number;
  totalExpenses: number;
  totalSavings: number;
  remaining: number;
}

export type CreateCategoryInput = Omit<Category, keyof BaseRecord>;
export type CreateBudgetInput = Omit<Budget, keyof BaseRecord>;
export type CreateTransactionInput = Omit<Transaction, keyof BaseRecord>;
export type CreateSalaryCycleInput = Omit<SalaryCycle, keyof BaseRecord>;
