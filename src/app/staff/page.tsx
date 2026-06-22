"use client";

import { useState } from "react";
import { useDashboard } from "@/lib/use-dashboard";
import { PageHeader, SectionCard, Spinner, Surface } from "@/components/dashboard/ui";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { TeamBar } from "@/components/dashboard/charts";
import { ConversionTable, GroupTable } from "@/components/dashboard/report-tables";
import type { DashboardFilters } from "@/lib/types";

export default function StaffPage() {
  const [filters, setFilters] = useState<DashboardFilters>({});
  const { data, loading, error } = useDashboard(filters);

  return (
    <>
      <PageHeader title="Staff Performance" description="Telesales team funnel & conversion metrics" />
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
            <SectionCard title="Team Comparison">
              <TeamBar data={data.byStaff} />
            </SectionCard>
            <SectionCard title="Staff Funnel" bodyClassName="p-0">
              <GroupTable rows={data.byStaff} keyHeader="Team Member" emptyLabel="No staff data" />
            </SectionCard>
            <SectionCard title="Conversion (Lead → SV Done)" bodyClassName="p-0">
              <ConversionTable rows={data.byStaff} keyHeader="Team Member" />
            </SectionCard>
          </div>
        )
      )}
    </>
  );
}
