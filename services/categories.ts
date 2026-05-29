import { createApiClient } from "./api-client";
import type { Category, CreateCategoryInput } from "@/types/finance";

export const categoriesService = createApiClient<Category, CreateCategoryInput>("Categories");
