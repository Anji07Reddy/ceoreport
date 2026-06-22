"use client";

import { useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { useDashboard } from "@/lib/use-dashboard";
import { PageHeader, SectionCard, Spinner, StatCard, Surface } from "@/components/dashboard/ui";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { FollowUpTable } from "@/components/dashboard/report-tables";
import { formatNumber } from "@/lib/utils";
import type { DashboardFilters } from "@/lib/types";

export default function FollowUpsPage() {
  const [filters, setFilters] = useState<DashboardFilters>({});
  const { data, loading, error } = useDashboard(filters);

  return (
    <>
      <PageHeader title="Follow-Ups" description="Pending & overdue follow-up tasks, soonest first" />
      {data && (
        <>
          <div className="mb-5 grid grid-cols-2 gap-4 sm:max-w-md">
            <StatCard label="Pending" value={formatNumber(data.overview.pendingTasks)} icon={<Clock className="h-5 w-5" />} tone="amber" />
            <StatCard label="Overdue" value={formatNumber(data.overview.overdueTasks)} icon={<AlertTriangle className="h-5 w-5" />} tone="red" />
          </div>
          <div className="mb-5">
            <FilterBar
              filters={filters}
              options={data.filterOptions}
              onChange={(n) => setFilters((p) => ({ ...p, ...n }))}
              onReset={() => setFilters({})}
            />
          </div>
        </>
      )}
      {error && <Surface className="p-4 text-sm text-red-600">{error}</Surface>}
      {loading && !data ? (
        <Spinner />
      ) : (
        data && (
          <SectionCard title={`${data.followUps.length} open follow-ups`} bodyClassName="p-0">
            <FollowUpTable rows={data.followUps} />
          </SectionCard>
        )
      )}
    </>
  );
}
