"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { itemsService } from "@/services/items";
import { useAsync } from "@/hooks/use-async";
import { Form } from "@/components/ui/Form";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { FieldConfig, CreateItemInput } from "@/types";
import Link from "next/link";

const fields: FieldConfig[] = [
  { key: "name", label: "Name", type: "text", required: true, placeholder: "Enter name" },
  { key: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" },
  { key: "amount", label: "Amount", type: "number", placeholder: "0.00" },
  {
    key: "status",
    label: "Status",
    type: "select",
    required: true,
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
      { label: "Pending", value: "pending" },
    ],
  },
  { key: "description", label: "Description", type: "textarea", placeholder: "Optional notes…" },
];

type FormValues = Record<string, string>;

const empty: FormValues = {
  name: "",
  email: "",
  amount: "",
  status: "",
  description: "",
};

function validate(values: FormValues): Partial<Record<string, string>> {
  const errors: Partial<Record<string, string>> = {};
  if (!values.name.trim()) errors.name = "Name is required";
  if (!values.email.trim()) errors.email = "Email is required";
  else if (!/\S+@\S+\.\S+/.test(values.email)) errors.email = "Invalid email";
  if (!values.status) errors.status = "Status is required";
  return errors;
}

export default function NewItemPage() {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(empty);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const { execute, loading, error } = useAsync(
    async (data: CreateItemInput) => {
      await itemsService.create(data);
      router.push("/items");
    }
  );

  const handleChange = (key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = (vals: FormValues) => {
    const errs = validate(vals);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    execute({
      name: vals.name,
      email: vals.email,
      amount: Number(vals.amount || 0),
      status: vals.status as CreateItemInput["status"],
      description: vals.description,
    });
  };

  return (
    <div className="max-w-xl">
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/items" className="hover:text-gray-700">Items</Link>
        <span>/</span>
        <span className="text-gray-900">New</span>
      </div>

      <Card>
        <CardHeader>
          <h1 className="text-lg font-semibold text-gray-900">Create Item</h1>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <Form
            fields={fields}
            values={values}
            onChange={handleChange}
            onSubmit={handleSubmit}
            errors={errors}
            loading={loading}
            submitLabel="Create Item"
            onCancel={() => router.push("/items")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
