"use client";

import { FormEvent } from "react";
import { Input, Textarea, Select } from "./Input";
import { Button } from "./Button";
import type { FieldConfig } from "@/types";

interface FormProps<T extends Record<string, string>> {
  fields: FieldConfig[];
  values: T;
  onChange: (key: string, value: string) => void;
  onSubmit: (values: T) => void;
  errors?: Partial<Record<string, string>>;
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
}

export function Form<T extends Record<string, string>>({
  fields,
  values,
  onChange,
  onSubmit,
  errors,
  loading,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  onCancel,
}: FormProps<T>) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {fields.map((field) => {
        const commonProps = {
          label: field.label,
          required: field.required,
          placeholder: field.placeholder,
          error: errors?.[field.key],
          value: values[field.key] ?? "",
          onChange: (
            e: React.ChangeEvent<
              HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            >
          ) => onChange(field.key, e.target.value),
        };

        if (field.type === "textarea") {
          return <Textarea key={field.key} {...commonProps} />;
        }
        if (field.type === "select" && field.options) {
          return <Select key={field.key} {...commonProps} options={field.options} />;
        }
        return <Input key={field.key} {...commonProps} type={field.type} />;
      })}

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
