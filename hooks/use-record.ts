"use client";

import { useState, useEffect } from "react";

interface ServiceWithGetById<T> {
  getById(id: string): Promise<T>;
}

export function useRecord<T>(service: ServiceWithGetById<T>, id: string) {
  const [record, setRecord] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    service
      .getById(id)
      .then((data) => {
        if (!cancelled) setRecord(data);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load record");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [service, id]);

  return { record, loading, error };
}
