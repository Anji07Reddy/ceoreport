"use client";

import { useState } from "react";
import { useDashboard } from "@/lib/use-dashboard";
import { PageHeader, SectionCard, Spinner, Surface } from "@/components/dashboard/ui";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ConversionTable, GroupTable } from "@/components/dashboard/report-tables";
import type { DashboardFilters } from "@/lib/types";

export default function ProjectsPage() {
  const [filters, setFilters] = useState<DashboardFilters>({});
  const { data, loading, error } = useDashboard(filters);

  return (
    <>
      <PageHeader title="Project Performance" description="Lead funnel & conversion by project" />
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
            <SectionCard title="Project Funnel" bodyClassName="p-0">
              <GroupTable rows={data.byProject} keyHeader="Project" emptyLabel="No project data" />
            </SectionCard>
            <SectionCard title="Conversion (Lead → SV Done)" bodyClassName="p-0">
              <ConversionTable rows={data.byProject} keyHeader="Project" />
            </SectionCard>
          </div>
        )
      )}
    </>
  );
}
