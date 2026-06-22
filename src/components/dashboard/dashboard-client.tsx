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
  FunnelChart,
  SourceBar,
  StagePie,
  TaskStatusPie,
  TeamBar,
  TemperaturePie,
  TrendChart,
} from "@/components/dashboard/charts";
import {
  ConversionTable,
  FollowUpTable,
  GroupTable,
  MatrixTable,
} from "@/components/dashboard/report-tables";
import { exportDashboardPdf } from "@/lib/pdf";
import type { DashboardData, DashboardFilters } from "@/lib/types";

function buildQuery(filters: DashboardFilters): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) sp.set(k, v);
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
      const res = await fetch(`/api/dashboard?${buildQuery(filters)}`, { cache: "no-store" });
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

  const updateFilters = (next: Partial<DashboardFilters>) => setFilters((p) => ({ ...p, ...next }));
  const resetFilters = () => setFilters({});

  const dateLabel = (() => {
    const { dateFrom, dateTo } = filters;
    if (dateFrom && dateTo) return `${dateFrom} → ${dateTo}`;
    if (dateFrom) return `From ${dateFrom}`;
    if (dateTo) return `Up to ${dateTo}`;
    return "All dates";
  })();

  const handleExcel = () => {
    window.location.href = `/api/export?format=xlsx&${buildQuery(filters)}`;
  };
  const handlePdf = () => data && exportDashboardPdf(data, dateLabel);

  const hasData = data && (data.overview.totalLeads > 0 || data.overview.followUps > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold">Anuhar Homes — CRM Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {data?.monthLabel ? `${data.monthLabel} · ` : ""}
            {dateLabel}
          </p>
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
        <FilterBar filters={filters} options={data.filterOptions} onChange={updateFilters} onReset={resetFilters} />
      )}

      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading && !data ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading dashboard…
        </div>
      ) : !hasData ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-lg font-medium">No data yet</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Upload the <strong>CRM Daily Leads</strong> and <strong>Followup</strong> exports to generate the
              reports. If you already uploaded, try resetting the filters.
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
              <ChartCard title="Lead Funnel">
                <FunnelChart overview={data.overview} />
              </ChartCard>
              <ChartCard title="Leads by Source">
                <SourceBar data={data.sourceBreakdown} />
              </ChartCard>
              <ChartCard title="Lead Stage Distribution">
                <StagePie data={data.stageBreakdown} />
              </ChartCard>
              <ChartCard title="Lead Temperature">
                <TemperaturePie data={data.temperatureBreakdown} />
              </ChartCard>
              <ChartCard title="Team Performance (Top 10)">
                <TeamBar data={data.byStaff} />
              </ChartCard>
              <ChartCard title="Task Status">
                <TaskStatusPie data={data.taskStatusBreakdown} />
              </ChartCard>
            </div>

            <ChartCard title="Daily Trend">
              <TrendChart data={data.trend} />
            </ChartCard>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="team">
                  <TabsList className="flex flex-wrap">
                    <TabsTrigger value="team">Team Performance</TabsTrigger>
                    <TabsTrigger value="source">Source Performance</TabsTrigger>
                    <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="matrix">Source × Project</TabsTrigger>
                    <TabsTrigger value="followup">Followups</TabsTrigger>
                  </TabsList>
                  <TabsContent value="team">
                    <GroupTable rows={data.byStaff} keyHeader="Team Member" emptyLabel="No team data" />
                  </TabsContent>
                  <TabsContent value="source">
                    <GroupTable rows={data.bySource} keyHeader="Lead Source" emptyLabel="No source data" />
                  </TabsContent>
                  <TabsContent value="analytics">
                    <div className="space-y-6">
                      <div>
                        <p className="mb-2 text-sm font-medium text-muted-foreground">Team Conversion</p>
                        <ConversionTable rows={data.byStaff} keyHeader="Team Member" />
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-medium text-muted-foreground">Project Conversion</p>
                        <ConversionTable rows={data.byProject} keyHeader="Project" />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="weekly">
                    <GroupTable rows={data.byWeek} keyHeader="Week" emptyLabel="No weekly data" />
                  </TabsContent>
                  <TabsContent value="monthly">
                    <GroupTable rows={data.byMonth} keyHeader="Month" emptyLabel="No monthly data" />
                  </TabsContent>
                  <TabsContent value="matrix">
                    <MatrixTable projects={data.sourceProjectMatrix.projects} rows={data.sourceProjectMatrix.rows} />
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
