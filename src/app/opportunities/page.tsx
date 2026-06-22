"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useDashboard, buildQuery } from "@/lib/use-dashboard";
import { PageHeader, Pill, SectionCard, Spinner, Surface } from "@/components/dashboard/ui";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { formatNumber, toDateString } from "@/lib/utils";
import type { DashboardFilters } from "@/lib/types";

interface LeadRow {
  id: string;
  contact: string | null;
  phone: string | null;
  stage: string;
  temperature: string;
  source: string;
  project: string;
  staff: string;
  createdDate: string | null;
}

function OpportunitiesInner() {
  const params = useSearchParams();
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [q, setQ] = useState(params.get("q") ?? "");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 25;

  const { data } = useDashboard(filters); // for filter options

  useEffect(() => {
    setLoading(true);
    const qs = buildQuery(filters);
    fetch(`/api/leads?${qs}&q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`)
      .then((r) => r.json())
      .then((j) => {
        setRows(j.rows ?? []);
        setTotal(j.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [filters, q, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <PageHeader title="Opportunities" description={`${formatNumber(total)} unique leads`} />

      {data && (
        <div className="mb-5">
          <FilterBar
            filters={filters}
            options={data.filterOptions}
            onChange={(n) => {
              setPage(1);
              setFilters((p) => ({ ...p, ...n }));
            }}
            onReset={() => {
              setPage(1);
              setFilters({});
            }}
          />
        </div>
      )}

      <SectionCard
        bodyClassName="p-0"
        title="Leads"
        action={
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="Search contact / phone…"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-primary focus:bg-white"
            />
          </div>
        }
      >
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-400">No leads match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Stage</th>
                  <th className="px-5 py-3 font-medium">Temp</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-5 py-3 font-medium">Staff</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-medium text-slate-800">{r.contact || "—"}</td>
                    <td className="px-5 py-3 text-slate-500">{r.phone || "—"}</td>
                    <td className="px-5 py-3"><Pill kind="stage" value={r.stage} /></td>
                    <td className="px-5 py-3"><Pill kind="temperature" value={r.temperature} /></td>
                    <td className="px-5 py-3 text-slate-600">{r.source}</td>
                    <td className="px-5 py-3 text-slate-600">{r.project}</td>
                    <td className="px-5 py-3 text-slate-600">{r.staff}</td>
                    <td className="px-5 py-3 text-slate-500">{toDateString(r.createdDate) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 hover:bg-slate-50"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SectionCard>
    </>
  );
}

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <OpportunitiesInner />
    </Suspense>
  );
}
