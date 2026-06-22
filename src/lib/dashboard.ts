import { prisma } from "@/lib/prisma";
import { PROJECTS } from "@/lib/parse";
import type {
  DashboardData,
  DashboardFilters,
  FilterOptions,
  FollowUpRow,
  FunnelMetrics,
  GroupRow,
  MatrixRow,
  NamedCount,
  OverviewCards,
  TrendPoint,
} from "@/lib/types";
import { toDateString } from "@/lib/utils";

type LeadRow = {
  id: string;
  staff: string;
  source: string;
  project: string;
  stage: string;
  temperature: string;
  isFirst: boolean;
  contact: string | null;
  reportDate: Date;
  createdDate: Date | null;
};

type TaskRow = {
  id: string;
  staff: string;
  status: string;
  title: string | null;
  contact: string | null;
  dueDate: Date | null;
  reportDate: Date;
};

function dateRange(f: DashboardFilters) {
  const range: { gte?: Date; lte?: Date } = {};
  if (f.dateFrom) range.gte = new Date(f.dateFrom);
  if (f.dateTo) {
    const to = new Date(f.dateTo);
    to.setHours(23, 59, 59, 999);
    range.lte = to;
  }
  return Object.keys(range).length ? range : undefined;
}

const rate = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);

/** Compute the funnel metrics for a set of (deduped) leads + their tasks. */
function funnel(leads: LeadRow[], followUpCount: number): FunnelMetrics {
  const newLeads = leads.length; // already deduped to first/representative rows
  const interested = leads.filter((l) => l.stage === "Interested").length;
  const svScheduled = leads.filter((l) => l.stage === "SV Scheduled").length;
  const svDone = leads.filter((l) => l.stage === "SV Done").length;
  const closures = leads.filter((l) => l.stage === "Closure").length;
  return {
    newLeads,
    followUps: followUpCount,
    interested,
    svScheduled,
    svDone,
    closures,
    svShowUpRate: rate(svDone, svScheduled),
    leadToInterested: rate(interested, newLeads),
    interestedToSv: rate(svScheduled, interested),
    closurePerSv: rate(closures, svDone),
    leadToSvDone: rate(svDone, newLeads),
  };
}

function groupBy(
  leads: LeadRow[],
  tasks: TaskRow[],
  keyFn: (l: LeadRow) => string,
  /** Omit to skip task attribution (e.g. tasks have no source/project). */
  taskKeyFn?: (t: TaskRow) => string
): GroupRow[] {
  const leadGroups = new Map<string, LeadRow[]>();
  for (const l of leads) {
    const k = keyFn(l);
    const arr = leadGroups.get(k) ?? [];
    arr.push(l);
    leadGroups.set(k, arr);
  }
  const taskCounts = new Map<string, number>();
  if (taskKeyFn) {
    for (const t of tasks) {
      const k = taskKeyFn(t);
      taskCounts.set(k, (taskCounts.get(k) ?? 0) + 1);
    }
  }
  const keys = new Set<string>([...leadGroups.keys(), ...taskCounts.keys()]);
  return [...keys]
    .map((key) => ({ key, ...funnel(leadGroups.get(key) ?? [], taskCounts.get(key) ?? 0) }))
    .sort((a, b) => b.svDone - a.svDone || b.newLeads - a.newLeads);
}

/** ISO week-of-month bucket label, e.g. "Week 1". */
function weekOfMonth(d: Date): string {
  return `Week ${Math.ceil(d.getDate() / 7)}`;
}
function monthLabelOf(d: Date): string {
  return d.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export async function getDashboardData(filters: DashboardFilters): Promise<DashboardData> {
  const range = dateRange(filters);

  const leadWhere: Record<string, unknown> = { isFirst: true };
  if (range) leadWhere.reportDate = range;
  if (filters.project) leadWhere.project = filters.project;
  if (filters.staff) leadWhere.staff = filters.staff;
  if (filters.source) leadWhere.source = filters.source;
  if (filters.stage) leadWhere.stage = filters.stage;

  const taskWhere: Record<string, unknown> = {};
  if (range) taskWhere.reportDate = range;
  if (filters.staff) taskWhere.staff = filters.staff;
  if (filters.project) {
    // tasks have no project; skip project filter for tasks
  }
  if (filters.taskStatus) taskWhere.status = filters.taskStatus;

  const [leadsRaw, tasksRaw, allLeads, allTasks] = await Promise.all([
    prisma.lead.findMany({ where: leadWhere }),
    prisma.task.findMany({ where: taskWhere }),
    prisma.lead.findMany({ where: { isFirst: true }, select: { project: true, source: true, staff: true, stage: true, reportDate: true } }),
    prisma.task.findMany({ select: { staff: true, status: true, reportDate: true } }),
  ]);
  const leads = leadsRaw as LeadRow[];
  const tasks = tasksRaw as TaskRow[];

  // --- Overview -------------------------------------------------------------
  const base = funnel(leads, tasks.length);
  const overview: OverviewCards = {
    ...base,
    totalLeads: leads.length,
    completedTasks: tasks.filter((t) => t.status === "Completed").length,
    pendingTasks: tasks.filter((t) => t.status === "Pending").length,
    overdueTasks: tasks.filter((t) => t.status === "Overdue").length,
    hot: leads.filter((l) => l.temperature === "Hot").length,
    warm: leads.filter((l) => l.temperature === "Warm").length,
    cold: leads.filter((l) => l.temperature === "Cold").length,
    lost: leads.filter((l) => l.temperature === "Lost").length,
  };

  // --- Breakdowns -----------------------------------------------------------
  const countMap = (arr: string[]): NamedCount[] => {
    const m = new Map<string, number>();
    for (const v of arr) m.set(v, (m.get(v) ?? 0) + 1);
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  };

  const stageBreakdown = countMap(leads.map((l) => l.stage));
  const temperatureBreakdown = countMap(leads.map((l) => l.temperature));
  const taskStatusBreakdown = countMap(tasks.map((t) => t.status));
  const sourceBreakdown = countMap(leads.map((l) => l.source));

  // --- Grouped reports ------------------------------------------------------
  const byStaff = groupBy(leads, tasks, (l) => l.staff, (t) => t.staff);
  const bySource = groupBy(leads, tasks, (l) => l.source);
  const byProject = groupBy(leads, tasks, (l) => l.project);
  const byWeek = groupBy(
    leads,
    tasks,
    (l) => weekOfMonth(l.reportDate),
    (t) => weekOfMonth(t.reportDate)
  ).sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
  const byMonth = groupBy(
    leads,
    tasks,
    (l) => monthLabelOf(l.reportDate),
    (t) => monthLabelOf(t.reportDate)
  );

  // --- Source × Project matrix ---------------------------------------------
  const projectCols = [...PROJECTS];
  const matrixMap = new Map<string, MatrixRow>();
  for (const l of leads) {
    let row = matrixMap.get(l.source);
    if (!row) {
      row = { source: l.source, cells: Object.fromEntries(projectCols.map((p) => [p, 0])), total: 0, sharePct: 0 };
      matrixMap.set(l.source, row);
    }
    const col = projectCols.includes(l.project as (typeof PROJECTS)[number]) ? l.project : "Other";
    if (!(col in row.cells)) row.cells[col] = 0;
    row.cells[col] += 1;
    row.total += 1;
  }
  const grand = [...matrixMap.values()].reduce((s, r) => s + r.total, 0);
  const matrixRows = [...matrixMap.values()]
    .map((r) => ({ ...r, sharePct: rate(r.total, grand) }))
    .sort((a, b) => b.total - a.total);
  const matrixProjects = [...new Set([...projectCols, ...matrixRows.flatMap((r) => Object.keys(r.cells))])];

  // --- Trend ----------------------------------------------------------------
  const trendMap = new Map<string, TrendPoint>();
  const ensureTrend = (d: string) => {
    let r = trendMap.get(d);
    if (!r) {
      r = { date: d, newLeads: 0, svDone: 0, followUps: 0 };
      trendMap.set(d, r);
    }
    return r;
  };
  for (const l of leads) {
    const d = toDateString(l.reportDate);
    if (!d) continue;
    const r = ensureTrend(d);
    r.newLeads += 1;
    if (l.stage === "SV Done") r.svDone += 1;
  }
  for (const t of tasks) {
    const d = toDateString(t.reportDate);
    if (!d) continue;
    ensureTrend(d).followUps += 1;
  }
  const trend = [...trendMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  // --- Follow-up list -------------------------------------------------------
  const followUps: FollowUpRow[] = tasks
    .filter((t) => t.status !== "Completed")
    .sort((a, b) => (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity))
    .slice(0, 250)
    .map((t) => ({
      id: t.id,
      title: t.title || "(Untitled)",
      contact: t.contact || "—",
      staff: t.staff,
      status: t.status,
      dueDate: toDateString(t.dueDate),
    }));

  // --- Recent activity ------------------------------------------------------
  const recentLeads = [...leads]
    .sort((a, b) => (b.createdDate?.getTime() ?? 0) - (a.createdDate?.getTime() ?? 0))
    .slice(0, 12)
    .map((l) => ({
      id: l.id,
      contact: l.contact || "—",
      stage: l.stage,
      source: l.source,
      project: l.project,
      staff: l.staff,
      temperature: l.temperature,
      date: toDateString(l.createdDate) || toDateString(l.reportDate),
    }));

  // --- Filter options -------------------------------------------------------
  const uniq = (arr: string[]) => [...new Set(arr.filter(Boolean))].sort();
  const allDates = [...allLeads.map((l) => l.reportDate), ...allTasks.map((t) => t.reportDate)]
    .map(toDateString)
    .filter(Boolean)
    .sort();
  const filterOptions: FilterOptions = {
    projects: uniq(allLeads.map((l) => l.project)),
    staff: uniq([...allLeads.map((l) => l.staff), ...allTasks.map((t) => t.staff)]),
    sources: uniq(allLeads.map((l) => l.source)),
    stages: uniq(allLeads.map((l) => l.stage)),
    taskStatuses: uniq(allTasks.map((t) => t.status)),
    dateRange: { min: allDates[0] || "", max: allDates[allDates.length - 1] || "" },
  };

  const monthLabel = byMonth[0]?.key || (allDates.length ? monthLabelOf(new Date(allDates[allDates.length - 1])) : "—");

  return {
    monthLabel,
    overview,
    stageBreakdown,
    temperatureBreakdown,
    taskStatusBreakdown,
    sourceBreakdown,
    byStaff,
    bySource,
    byProject,
    byWeek,
    byMonth,
    sourceProjectMatrix: { projects: matrixProjects, rows: matrixRows },
    trend,
    followUps,
    recentLeads,
    filterOptions,
  };
}
