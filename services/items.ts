import { createApiClient } from "./api-client";
import type { Item, CreateItemInput } from "@/types";

export const itemsService = createApiClient<Item, CreateItemInput>("Items");
