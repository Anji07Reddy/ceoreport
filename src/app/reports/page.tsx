"use client";

import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { useDashboard, buildQuery } from "@/lib/use-dashboard";
import { PageHeader, SectionCard, Spinner, Surface } from "@/components/dashboard/ui";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { GroupTable, MatrixTable } from "@/components/dashboard/report-tables";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportDashboardPdf } from "@/lib/pdf";
import type { DashboardFilters } from "@/lib/types";

export default function ReportsPage() {
  const [filters, setFilters] = useState<DashboardFilters>({});
  const { data, loading, error } = useDashboard(filters);

  const dateLabel = filters.dateFrom || filters.dateTo ? `${filters.dateFrom ?? "…"} → ${filters.dateTo ?? "…"}` : "All dates";

  return (
    <>
      <PageHeader title="Reports" description="Generate and export the full CRM report set">
        <button
          onClick={() => (window.location.href = `/api/export?format=xlsx&${buildQuery(filters)}`)}
          disabled={!data}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <FileSpreadsheet className="h-4 w-4" /> Export Excel
        </button>
        <button
          onClick={() => data && exportDashboardPdf(data, dateLabel)}
          disabled={!data}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> Export PDF
        </button>
      </PageHeader>

      {data && (
        <div className="mb-5">
          <FilterBar
            filters={filters}
            options={data.filterOptions}
            onChange={(n) => setFilters((p) => ({ ...p, ...n }))}
            onReset={() => setFilters({})}
          />
        </div>
      )}
      {error && <Surface className="p-4 text-sm text-red-600">{error}</Surface>}
      {loading && !data ? (
        <Spinner />
      ) : (
        data && (
          <SectionCard>
            <Tabs defaultValue="team">
              <TabsList className="flex flex-wrap">
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="source">Source</TabsTrigger>
                <TabsTrigger value="project">Project</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="matrix">Source × Project</TabsTrigger>
              </TabsList>
              <TabsContent value="team">
                <GroupTable rows={data.byStaff} keyHeader="Team Member" emptyLabel="No data" />
              </TabsContent>
              <TabsContent value="source">
                <GroupTable rows={data.bySource} keyHeader="Lead Source" emptyLabel="No data" />
              </TabsContent>
              <TabsContent value="project">
                <GroupTable rows={data.byProject} keyHeader="Project" emptyLabel="No data" />
              </TabsContent>
              <TabsContent value="weekly">
                <GroupTable rows={data.byWeek} keyHeader="Week" emptyLabel="No data" />
              </TabsContent>
              <TabsContent value="monthly">
                <GroupTable rows={data.byMonth} keyHeader="Month" emptyLabel="No data" />
              </TabsContent>
              <TabsContent value="matrix">
                <MatrixTable projects={data.sourceProjectMatrix.projects} rows={data.sourceProjectMatrix.rows} />
              </TabsContent>
            </Tabs>
          </SectionCard>
        )
      )}
    </>
  );
}
