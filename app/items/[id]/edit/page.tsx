"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { itemsService } from "@/services/items";
import { useRecord } from "@/hooks/use-record";
import { useAsync } from "@/hooks/use-async";
import { Form } from "@/components/ui/Form";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import type { FieldConfig, Item, UpdateItemInput } from "@/types";

const fields: FieldConfig[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "email", label: "Email", type: "email", required: true },
  { key: "amount", label: "Amount", type: "number" },
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
  { key: "description", label: "Description", type: "textarea" },
];

type FormValues = Record<string, string>;

function validate(values: FormValues) {
  const errors: Partial<Record<string, string>> = {};
  if (!values.name?.trim()) errors.name = "Name is required";
  if (!values.email?.trim()) errors.email = "Email is required";
  else if (!/\S+@\S+\.\S+/.test(values.email)) errors.email = "Invalid email";
  if (!values.status) errors.status = "Status is required";
  return errors;
}

export default function EditItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { record, loading: fetching, error: fetchError } = useRecord(itemsService, id);
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (record) {
      const item = record as Item;
      setValues({
        name: item.name,
        email: item.email,
        amount: String(item.amount),
        status: item.status,
        description: item.description ?? "",
      });
    }
  }, [record]);

  const { execute, loading, error } = useAsync(
    async (data: UpdateItemInput) => {
      await itemsService.update(id, data);
      router.push(`/items/${id}`);
    }
  );

  if (fetching) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-400">
        Loading…
      </div>
    );
  }
  if (fetchError) return <ErrorMessage message={fetchError} />;

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
      status: vals.status as Item["status"],
      description: vals.description,
    });
  };

  return (
    <div className="max-w-xl">
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/items" className="hover:text-gray-700">Items</Link>
        <span>/</span>
        <Link href={`/items/${id}`} className="hover:text-gray-700">
          {(record as Item)?.name ?? id}
        </Link>
        <span>/</span>
        <span className="text-gray-900">Edit</span>
      </div>

      <Card>
        <CardHeader>
          <h1 className="text-lg font-semibold text-gray-900">Edit Item</h1>
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
            submitLabel="Save Changes"
            onCancel={() => router.push(`/items/${id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
