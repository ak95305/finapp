"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCrud } from "@/hooks/use-crud";
import { useAsync } from "@/hooks/use-async";
import { itemsService } from "@/services/items";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/Modal";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Item, TableColumn } from "@/types";

const statusVariant = {
  active: "success",
  inactive: "default",
  pending: "warning",
} as const;

export default function ItemsPage() {
  const router = useRouter();
  const { records, loading, error, refetch, remove } = useCrud(itemsService);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const { execute: confirmDelete, loading: deleting } = useAsync(
    async (item: Item) => {
      await remove(item.id);
      setDeleteTarget(null);
    }
  );

  const columns: TableColumn<Item>[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "status",
      label: "Status",
      render: (v) => (
        <Badge variant={statusVariant[v as Item["status"]]}>
          {String(v)}
        </Badge>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (v) => formatCurrency(Number(v)),
    },
    { key: "createdAt", label: "Created", render: (v) => formatDate(String(v)) },
  ];

  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Items</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {records.length} record{records.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/items/new">
          <Button>+ New Item</Button>
        </Link>
      </div>

      {!loading && records.length === 0 ? (
        <EmptyState
          action={{ label: "Create first item", onClick: () => router.push("/items/new") }}
        />
      ) : (
        <DataTable
          data={records}
          columns={columns}
          loading={loading}
          onRowClick={(row) => router.push(`/items/${row.id}`)}
          rowActions={(row) => (
            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Link href={`/items/${row.id}/edit`}>
                <Button variant="ghost" size="sm">Edit</Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => setDeleteTarget(row)}
              >
                Delete
              </Button>
            </div>
          )}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && confirmDelete(deleteTarget)}
        loading={deleting}
        title="Delete item?"
        message={`"${deleteTarget?.name}" will be permanently removed from the sheet.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
