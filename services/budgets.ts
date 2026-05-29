import { createApiClient } from "./api-client";
import type { Budget, CreateBudgetInput } from "@/types/finance";

export const budgetsService = createApiClient<Budget, CreateBudgetInput>("Budgets");
