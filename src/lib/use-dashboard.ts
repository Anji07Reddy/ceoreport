"use client";

import { useCallback, useEffect, useState } from "react";
import type { DashboardData, DashboardFilters } from "@/lib/types";

export function buildQuery(filters: DashboardFilters): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) sp.set(k, v);
  return sp.toString();
}

/** Fetch the dashboard payload for a given filter set. */
export function useDashboard(filters: DashboardFilters = {}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const qs = buildQuery(filters);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard?${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load.");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
