import { createApiClient } from "./api-client";
import type { SalaryCycle, CreateSalaryCycleInput } from "@/types/finance";

export const salaryCyclesService = createApiClient<SalaryCycle, CreateSalaryCycleInput>("SalaryCycles");
