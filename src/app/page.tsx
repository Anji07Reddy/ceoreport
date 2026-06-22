"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
  UploadCloud,
  Users,
} from "lucide-react";
import { useDashboard } from "@/lib/use-dashboard";
import { Avatar, EmptyState, PageHeader, Pill, SectionCard, Spinner, StatCard, Surface } from "@/components/dashboard/ui";
import { SourceBar, StagePie, TeamBar, TrendChart } from "@/components/dashboard/charts";
import { formatNumber, formatPercent } from "@/lib/utils";

interface UploadRow {
  id: string;
  reportDate: string;
  createdAt: string;
  leadFileName: string | null;
  taskFileName: string | null;
  leadCount: number;
  taskCount: number;
}

export default function DashboardHome() {
  const { data, loading, error } = useDashboard();
  const [uploads, setUploads] = useState<UploadRow[]>([]);

  useEffect(() => {
    fetch("/api/uploads")
      .then((r) => r.json())
      .then((j) => setUploads(j.uploads ?? []))
      .catch(() => {});
  }, []);

  if (loading && !data) return <Spinner label="Loading dashboard…" />;
  if (error) return <Surface className="p-4 text-sm text-red-600">{error}</Surface>;

  const o = data?.overview;
  const hasData = o && (o.totalLeads > 0 || o.followUps > 0);

  if (!hasData) {
    return (
      <>
        <PageHeader title="Dashboard" description="Your CRM performance at a glance" />
        <EmptyState
          title="No data yet"
          hint="Upload the CRM Daily Leads and Followup exports to populate your dashboard."
          action={
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
            >
              <UploadCloud className="h-4 w-4" /> Upload files
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Dashboard" description={`${data?.monthLabel} · CRM performance overview`}>
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <FileSpreadsheet className="h-4 w-4" /> Reports
        </Link>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          <UploadCloud className="h-4 w-4" /> Upload
        </Link>
      </PageHeader>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-7">
        <StatCard label="Total Leads" value={formatNumber(o!.totalLeads)} icon={<Users className="h-5 w-5" />} tone="blue" />
        <StatCard label="New Leads" value={formatNumber(o!.newLeads)} icon={<Sparkles className="h-5 w-5" />} tone="indigo" />
        <StatCard label="Warm Leads" value={formatNumber(o!.warm)} icon={<Flame className="h-5 w-5" />} tone="amber" />
        <StatCard label="Site Visits" value={formatNumber(o!.svDone)} icon={<CalendarCheck className="h-5 w-5" />} tone="cyan" />
        <StatCard label="Completed Tasks" value={formatNumber(o!.completedTasks)} icon={<CheckCircle2 className="h-5 w-5" />} tone="emerald" />
        <StatCard label="Pending Tasks" value={formatNumber(o!.pendingTasks)} icon={<Clock className="h-5 w-5" />} tone="orange" />
        <StatCard label="Conversion Rate" value={formatPercent(o!.leadToSvDone)} icon={<Target className="h-5 w-5" />} tone="violet" hint="Lead → Site Visit" />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <SectionCard title="Lead Status Distribution">
          <StagePie data={data!.stageBreakdown} />
        </SectionCard>
        <SectionCard title="Daily Leads Trend">
          <TrendChart data={data!.trend} />
        </SectionCard>
        <SectionCard title="Source Performance">
          <SourceBar data={data!.sourceBreakdown} />
        </SectionCard>
        <SectionCard title="Staff Performance">
          <TeamBar data={data!.byStaff} />
        </SectionCard>
      </div>

      {/* Activities + widgets */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <SectionCard
          title="Recent Activities"
          className="lg:col-span-2"
          bodyClassName="p-0"
          action={
            <Link href="/opportunities" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Stage</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 font-medium">Staff</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data!.recentLeads.map((l) => (
                  <tr key={l.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-medium text-slate-800">{l.contact}</td>
                    <td className="px-5 py-3">
                      <Pill kind="stage" value={l.stage} />
                    </td>
                    <td className="px-5 py-3 text-slate-600">{l.source}</td>
                    <td className="px-5 py-3 text-slate-600">{l.staff}</td>
                    <td className="px-5 py-3 text-slate-500">{l.date || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="space-y-5">
          {/* Top performing staff */}
          <SectionCard title="Top Performing Staff" bodyClassName="p-4">
            <ul className="space-y-1">
              {data!.byStaff.slice(0, 5).map((s, i) => (
                <li key={s.key} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                  <span className="w-4 text-sm font-semibold text-slate-400">{i + 1}</span>
                  <Avatar name={s.key} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{s.key}</p>
                    <p className="text-xs text-slate-400">{s.newLeads} leads · {s.svDone} site visits</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {formatPercent(s.svShowUpRate)}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* Pending follow-ups */}
          <SectionCard
            title="Pending Follow-Ups"
            bodyClassName="p-4"
            action={
              <Link href="/followups" className="text-xs font-medium text-primary hover:underline">
                View all
              </Link>
            }
          >
            {data!.followUps.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">All caught up 🎉</p>
            ) : (
              <ul className="space-y-1">
                {data!.followUps.slice(0, 5).map((f) => (
                  <li key={f.id} className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${f.status === "Overdue" ? "bg-red-500" : "bg-amber-500"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{f.title}</p>
                      <p className="text-xs text-slate-400">
                        {f.contact} · {f.staff}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{f.dueDate || "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Recent uploads */}
      <SectionCard title="Recent Uploads" className="mt-6" bodyClassName="p-0">
        {uploads.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">No uploads yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Report Date</th>
                  <th className="px-5 py-3 font-medium">Leads File</th>
                  <th className="px-5 py-3 font-medium">Followup File</th>
                  <th className="px-5 py-3 text-right font-medium">Leads</th>
                  <th className="px-5 py-3 text-right font-medium">Followups</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-medium text-slate-800">{u.reportDate.slice(0, 10)}</td>
                    <td className="max-w-[220px] truncate px-5 py-3 text-slate-600">
                      <FileSpreadsheet className="mr-1.5 inline h-4 w-4 text-slate-400" />
                      {u.leadFileName || "—"}
                    </td>
                    <td className="max-w-[220px] truncate px-5 py-3 text-slate-600">
                      <FileSpreadsheet className="mr-1.5 inline h-4 w-4 text-slate-400" />
                      {u.taskFileName || "—"}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-700">{formatNumber(u.leadCount)}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{formatNumber(u.taskCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </>
  );
}
