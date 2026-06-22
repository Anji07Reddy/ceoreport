"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Download, FileDown, Loader2, RefreshCw, UploadCloud } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { FilterBar } from "@/components/dashboard/filter-bar";
import {
  DailyTrendChart,
  SourceBarChart,
  StagePieChart,
  StaffPerformanceChart,
  TaskStatusChart,
} from "@/components/dashboard/charts";
import {
  FollowUpTable,
  ProjectTable,
  SourceTable,
  StaffTable,
} from "@/components/dashboard/report-tables";
import { exportDashboardPdf } from "@/lib/pdf";
import type { DashboardData, DashboardFilters } from "@/lib/types";

function buildQuery(filters: DashboardFilters): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v) sp.set(k, v);
  }
  return sp.toString();
}

export function DashboardClient() {
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildQuery(filters);
      const res = await fetch(`/api/dashboard?${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load dashboard.");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilters = (next: Partial<DashboardFilters>) =>
    setFilters((prev) => ({ ...prev, ...next }));
  const resetFilters = () => setFilters({});

  const dateLabel = (() => {
    const { dateFrom, dateTo } = filters;
    if (dateFrom && dateTo) return `${dateFrom} → ${dateTo}`;
    if (dateFrom) return `From ${dateFrom}`;
    if (dateTo) return `Up to ${dateTo}`;
    return "All dates";
  })();

  const handleExcel = () => {
    const qs = buildQuery(filters);
    window.location.href = `/api/export?format=xlsx&${qs}`;
  };

  const handlePdf = () => {
    if (data) exportDashboardPdf(data, dateLabel);
  };

  const hasData =
    data && (data.overview.totalLeads > 0 || data.overview.totalTasks > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold">Performance Dashboard</h1>
          <p className="text-sm text-muted-foreground">{dateLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExcel} disabled={!hasData}>
            <FileDown className="h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handlePdf} disabled={!hasData}>
            <Download className="h-4 w-4" /> PDF
          </Button>
          <Button asChild size="sm">
            <Link href="/upload">
              <UploadCloud className="h-4 w-4" /> Upload
            </Link>
          </Button>
        </div>
      </div>

      {data && (
        <FilterBar
          filters={filters}
          options={data.filterOptions}
          onChange={updateFilters}
          onReset={resetFilters}
        />
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {loading && !data ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading dashboard…
        </div>
      ) : !hasData ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-lg font-medium">No data yet</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Upload your Opportunities CSV and Tasks Excel to generate the dashboard. If you&apos;ve
              already uploaded, try resetting the filters.
            </p>
            <Button asChild>
              <Link href="/upload">
                <UploadCloud className="h-4 w-4" /> Upload files
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        data && (
          <div className="space-y-6">
            <KpiCards overview={data.overview} />

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Lead Stage Distribution">
                <StagePieChart data={data.stageBreakdown} />
              </ChartCard>
              <ChartCard title="Leads by Source">
                <SourceBarChart data={data.sourceBreakdown} />
              </ChartCard>
              <ChartCard title="Task Status">
                <TaskStatusChart data={data.taskStatusBreakdown} />
              </ChartCard>
              <ChartCard title="Staff Performance (Top 10)">
                <StaffPerformanceChart data={data.staffPerformance} />
              </ChartCard>
            </div>

            <ChartCard title="Daily Trend">
              <DailyTrendChart data={data.trend} />
            </ChartCard>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="project">
                  <TabsList className="flex flex-wrap">
                    <TabsTrigger value="project">Project-wise</TabsTrigger>
                    <TabsTrigger value="staff">Staff Performance</TabsTrigger>
                    <TabsTrigger value="source">Source Quality</TabsTrigger>
                    <TabsTrigger value="followup">Daily Follow-up</TabsTrigger>
                  </TabsList>
                  <TabsContent value="project">
                    <ProjectTable rows={data.projectReport} />
                  </TabsContent>
                  <TabsContent value="staff">
                    <StaffTable rows={data.staffPerformance} />
                  </TabsContent>
                  <TabsContent value="source">
                    <SourceTable rows={data.sourceReport} />
                  </TabsContent>
                  <TabsContent value="followup">
                    <FollowUpTable rows={data.followUps} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
