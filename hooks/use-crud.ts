"use client";

import { useState, useEffect, useCallback } from "react";

interface CrudService<TRecord extends { id: string }, TCreate> {
  getAll(): Promise<TRecord[]>;
  getById(id: string): Promise<TRecord>;
  create(data: TCreate): Promise<TRecord>;
  update(id: string, data: Partial<TCreate>): Promise<TRecord>;
  delete(id: string): Promise<void>;
}

export function useCrud<TRecord extends { id: string }, TCreate>(
  service: CrudService<TRecord, TCreate>
) {
  const [records, setRecords] = useState<TRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await service.getAll();
      setRecords(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = useCallback(
    async (data: TCreate): Promise<TRecord> => {
      const created = await service.create(data);
      setRecords((prev) => [...prev, created]);
      return created;
    },
    [service]
  );

  const update = useCallback(
    async (id: string, data: Partial<TCreate>): Promise<TRecord> => {
      const updated = await service.update(id, data);
      setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    },
    [service]
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await service.delete(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    },
    [service]
  );

  return { records, loading, error, refetch: fetchAll, create, update, remove };
}
