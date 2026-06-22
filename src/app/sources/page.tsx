"use client";

import { useState } from "react";
import { useDashboard } from "@/lib/use-dashboard";
import { PageHeader, SectionCard, Spinner, Surface } from "@/components/dashboard/ui";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { SourceBar } from "@/components/dashboard/charts";
import { GroupTable, MatrixTable } from "@/components/dashboard/report-tables";
import type { DashboardFilters } from "@/lib/types";

export default function SourcesPage() {
  const [filters, setFilters] = useState<DashboardFilters>({});
  const { data, loading, error } = useDashboard(filters);

  return (
    <>
      <PageHeader title="Source Analysis" description="Lead quality & volume by acquisition source" />
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
          <div className="space-y-5">
            <SectionCard title="Leads by Source">
              <SourceBar data={data.sourceBreakdown} />
            </SectionCard>
            <SectionCard title="Source Funnel" bodyClassName="p-0">
              <GroupTable rows={data.bySource} keyHeader="Lead Source" emptyLabel="No source data" />
            </SectionCard>
            <SectionCard title="Source × Project Matrix" bodyClassName="p-0">
              <MatrixTable projects={data.sourceProjectMatrix.projects} rows={data.sourceProjectMatrix.rows} />
            </SectionCard>
          </div>
        )
      )}
    </>
  );
}
