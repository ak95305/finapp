export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total?: number;
}

export interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "number" | "email" | "date" | "textarea" | "select";
  required?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

// Example domain type — replace or extend for your use case
export interface Item extends BaseRecord {
  name: string;
  description: string;
  status: "active" | "inactive" | "pending";
  amount: number;
  email: string;
}

export type CreateItemInput = Omit<Item, keyof BaseRecord>;
export type UpdateItemInput = Partial<CreateItemInput>;
