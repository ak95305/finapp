"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRecord } from "@/hooks/use-record";
import { useAsync } from "@/hooks/use-async";
import { itemsService } from "@/services/items";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/Modal";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useState } from "react";
import type { Item } from "@/types";

const statusVariant = {
  active: "success",
  inactive: "default",
  pending: "warning",
} as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-gray-900">{children}</p>
    </div>
  );
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { record, loading, error } = useRecord(itemsService, id);
  const [showDelete, setShowDelete] = useState(false);
  const { execute: deleteItem, loading: deleting } = useAsync(async () => {
    await itemsService.delete(id);
    router.push("/items");
  });

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-gray-400 text-sm">
        Loading…
      </div>
    );
  }
  if (error) return <ErrorMessage message={error} onRetry={() => router.refresh()} />;
  if (!record) return null;

  const item = record as Item;

  return (
    <div className="max-w-xl">
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/items" className="hover:text-gray-700">Items</Link>
        <span>/</span>
        <span className="text-gray-900">{item.name}</span>
      </div>

      <Card>
        <CardHeader>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{item.name}</h1>
            <p className="text-sm text-gray-500">{item.email}</p>
          </div>
          <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-5">
          <Field label="Amount">{formatCurrency(item.amount)}</Field>
          <Field label="Status">{item.status}</Field>
          <Field label="Created">{formatDate(item.createdAt)}</Field>
          <Field label="Updated">{formatDate(item.updatedAt)}</Field>
          {item.description && (
            <div className="col-span-2">
              <Field label="Description">{item.description}</Field>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDelete(true)}
          >
            Delete
          </Button>
          <Link href={`/items/${id}/edit`}>
            <Button size="sm">Edit</Button>
          </Link>
        </CardFooter>
      </Card>

      <ConfirmModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={deleteItem}
        loading={deleting}
        title="Delete item?"
        message={`"${item.name}" will be permanently removed.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
