"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchSupervisionResource } from "@/lib/supervision";

export function useSupervisionQuery<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchSupervisionResource<T>(path);
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load supervision data.");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    loading,
    error,
    refetch: load,
  };
}
