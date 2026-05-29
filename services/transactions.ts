import { createApiClient } from "./api-client";
import type { Transaction, CreateTransactionInput } from "@/types/finance";

export const transactionsService = createApiClient<Transaction, CreateTransactionInput>("Transactions");
