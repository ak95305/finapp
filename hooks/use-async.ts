"use client";

import { useState, useCallback } from "react";

export function useAsync<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      setLoading(true);
      setError(null);
      setSuccess(false);
      try {
        const result = await fn(...args);
        setSuccess(true);
        // Auto-clear success after 2.5 s
        setTimeout(() => setSuccess(false), 2500);
        return result;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [fn]
  );

  return { execute, loading, error, success };
}
