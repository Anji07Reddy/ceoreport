import { prisma } from "@/lib/prisma";
import type {
  DashboardData,
  DashboardFilters,
  FilterOptions,
  FollowUpRow,
  NamedCount,
  OverviewCards,
  ProjectReportRow,
  SourceReportRow,
  StaffReportRow,
  TrendPoint,
} from "@/lib/types";
import { toDateString } from "@/lib/utils";

type OppWhere = {
  reportDate?: { gte?: Date; lte?: Date };
  project?: string;
  assignedTo?: string;
  source?: string;
  stage?: string;
};

type TaskWhere = {
  reportDate?: { gte?: Date; lte?: Date };
  project?: string;
  assignedTo?: string;
  status?: string;
};

function dateRange(filters: DashboardFilters) {
  const range: { gte?: Date; lte?: Date } = {};
  if (filters.dateFrom) range.gte = new Date(filters.dateFrom);
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    range.lte = to;
  }
  return Object.keys(range).length ? range : undefined;
}

function buildOppWhere(filters: DashboardFilters): OppWhere {
  const where: OppWhere = {};
  const range = dateRange(filters);
  if (range) where.reportDate = range;
  if (filters.project) where.project = filters.project;
  if (filters.assignedTo) where.assignedTo = filters.assignedTo;
  if (filters.source) where.source = filters.source;
  if (filters.stage) where.stage = filters.stage;
  return where;
}

function buildTaskWhere(filters: DashboardFilters): TaskWhere {
  const where: TaskWhere = {};
  const range = dateRange(filters);
  if (range) where.reportDate = range;
  if (filters.project) where.project = filters.project;
  if (filters.assignedTo) where.assignedTo = filters.assignedTo;
  if (filters.taskStatus) where.status = filters.taskStatus;
  return where;
}

const labelOf = (v: string | null | undefined) => (v && v.trim() ? v.trim() : "Unassigned");

export async function getDashboardData(
  filters: DashboardFilters
): Promise<DashboardData> {
  const oppWhere = buildOppWhere(filters);
  const taskWhere = buildTaskWhere(filters);

  const [opps, tasks, allOpps, allTasks] = await Promise.all([
    prisma.opportunity.findMany({ where: oppWhere }),
    prisma.task.findMany({ where: taskWhere }),
    // Unfiltered sets are used only to compute available filter options.
    prisma.opportunity.findMany({
      select: { project: true, source: true, assignedTo: true, stage: true, reportDate: true },
    }),
    prisma.task.findMany({
      select: { project: true, assignedTo: true, status: true, reportDate: true },
    }),
  ]);

  // --- Overview cards -------------------------------------------------------
  const overview: OverviewCards = {
    totalLeads: opps.length,
    newLeads: opps.filter((o) => o.stage === "New").length,
    warmLeads: opps.filter((o) => o.stage === "Warm").length,
    coldLeads: opps.filter((o) => o.stage === "Cold").length,
    siteVisits: opps.filter((o) => o.siteVisit || o.stage === "Site Visit").length,
    completedTasks: tasks.filter((t) => t.status === "Completed").length,
    pendingTasks: tasks.filter((t) => t.status === "Pending").length,
    overdueTasks: tasks.filter((t) => t.status === "Overdue").length,
    totalTasks: tasks.length,
    conversionRate: 0,
  };
  const won = opps.filter((o) => o.stage === "Won").length;
  overview.conversionRate = opps.length ? (won / opps.length) * 100 : 0;

  // --- Stage breakdown (pie) ------------------------------------------------
  const stageMap = new Map<string, number>();
  for (const o of opps) {
    const k = o.stage || "Other";
    stageMap.set(k, (stageMap.get(k) || 0) + 1);
  }
  const stageBreakdown: NamedCount[] = [...stageMap.entries()].map(([name, value]) => ({ name, value }));

  // --- Source breakdown (bar) -----------------------------------------------
  const sourceMap = new Map<string, number>();
  for (const o of opps) {
    const k = labelOf(o.source);
    sourceMap.set(k, (sourceMap.get(k) || 0) + 1);
  }
  const sourceBreakdown: NamedCount[] = [...sourceMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // --- Task status breakdown ------------------------------------------------
  const taskStatusMap = new Map<string, number>();
  for (const t of tasks) {
    const k = t.status || "Other";
    taskStatusMap.set(k, (taskStatusMap.get(k) || 0) + 1);
  }
  const taskStatusBreakdown: NamedCount[] = [...taskStatusMap.entries()].map(([name, value]) => ({ name, value }));

  // --- Staff performance ----------------------------------------------------
  const staffMap = new Map<string, StaffReportRow>();
  const ensureStaff = (name: string): StaffReportRow => {
    let row = staffMap.get(name);
    if (!row) {
      row = {
        staff: name,
        leads: 0,
        siteVisits: 0,
        won: 0,
        tasks: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        completionRate: 0,
      };
      staffMap.set(name, row);
    }
    return row;
  };
  for (const o of opps) {
    const row = ensureStaff(labelOf(o.assignedTo));
    row.leads += 1;
    if (o.siteVisit || o.stage === "Site Visit") row.siteVisits += 1;
    if (o.stage === "Won") row.won += 1;
  }
  for (const t of tasks) {
    const row = ensureStaff(labelOf(t.assignedTo));
    row.tasks += 1;
    if (t.status === "Completed") row.completed += 1;
    else if (t.status === "Pending") row.pending += 1;
    else if (t.status === "Overdue") row.overdue += 1;
  }
  const staffPerformance = [...staffMap.values()]
    .map((r) => ({ ...r, completionRate: r.tasks ? (r.completed / r.tasks) * 100 : 0 }))
    .sort((a, b) => b.leads + b.tasks - (a.leads + a.tasks));

  // --- Project report -------------------------------------------------------
  const projectMap = new Map<string, ProjectReportRow>();
  const ensureProject = (name: string): ProjectReportRow => {
    let row = projectMap.get(name);
    if (!row) {
      row = { project: name, totalLeads: 0, siteVisits: 0, won: 0, tasks: 0, completedTasks: 0 };
      projectMap.set(name, row);
    }
    return row;
  };
  for (const o of opps) {
    const row = ensureProject(labelOf(o.project));
    row.totalLeads += 1;
    if (o.siteVisit || o.stage === "Site Visit") row.siteVisits += 1;
    if (o.stage === "Won") row.won += 1;
  }
  for (const t of tasks) {
    const row = ensureProject(labelOf(t.project));
    row.tasks += 1;
    if (t.status === "Completed") row.completedTasks += 1;
  }
  const projectReport = [...projectMap.values()].sort((a, b) => b.totalLeads - a.totalLeads);

  // --- Source quality report ------------------------------------------------
  const srcMap = new Map<string, SourceReportRow>();
  const ensureSrc = (name: string): SourceReportRow => {
    let row = srcMap.get(name);
    if (!row) {
      row = { source: name, totalLeads: 0, warm: 0, cold: 0, won: 0, siteVisits: 0, qualityScore: 0 };
      srcMap.set(name, row);
    }
    return row;
  };
  for (const o of opps) {
    const row = ensureSrc(labelOf(o.source));
    row.totalLeads += 1;
    if (o.stage === "Warm") row.warm += 1;
    if (o.stage === "Cold") row.cold += 1;
    if (o.stage === "Won") row.won += 1;
    if (o.siteVisit || o.stage === "Site Visit") row.siteVisits += 1;
  }
  const sourceReport = [...srcMap.values()]
    .map((r) => {
      // Weighted quality: won counts most, then site visits, then warm leads.
      const score = r.totalLeads
        ? ((r.won * 3 + r.siteVisits * 2 + r.warm * 1) / (r.totalLeads * 3)) * 100
        : 0;
      return { ...r, qualityScore: Math.min(100, score) };
    })
    .sort((a, b) => b.qualityScore - a.qualityScore);

  // --- Daily follow-up report (pending + overdue tasks) ---------------------
  const followUps: FollowUpRow[] = tasks
    .filter((t) => t.status === "Pending" || t.status === "Overdue")
    .sort((a, b) => {
      const da = a.dueDate ? a.dueDate.getTime() : Infinity;
      const db = b.dueDate ? b.dueDate.getTime() : Infinity;
      return da - db;
    })
    .slice(0, 200)
    .map((t) => ({
      id: t.id,
      title: t.title || "(Untitled task)",
      project: labelOf(t.project),
      assignedTo: labelOf(t.assignedTo),
      status: t.status || "Pending",
      dueDate: toDateString(t.dueDate),
    }));

  // --- Daily trend ----------------------------------------------------------
  const trendMap = new Map<string, TrendPoint>();
  const ensureTrend = (date: string): TrendPoint => {
    let row = trendMap.get(date);
    if (!row) {
      row = { date, leads: 0, siteVisits: 0, completedTasks: 0 };
      trendMap.set(date, row);
    }
    return row;
  };
  for (const o of opps) {
    const d = toDateString(o.reportDate);
    if (!d) continue;
    const row = ensureTrend(d);
    row.leads += 1;
    if (o.siteVisit || o.stage === "Site Visit") row.siteVisits += 1;
  }
  for (const t of tasks) {
    const d = toDateString(t.reportDate);
    if (!d) continue;
    const row = ensureTrend(d);
    if (t.status === "Completed") row.completedTasks += 1;
  }
  const trend = [...trendMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  // --- Filter options (from full dataset) -----------------------------------
  const uniq = (arr: (string | null)[]) =>
    [...new Set(arr.map((v) => (v && v.trim() ? v.trim() : "")).filter(Boolean))].sort();

  const allDates = [...allOpps.map((o) => o.reportDate), ...allTasks.map((t) => t.reportDate)]
    .map((d) => toDateString(d))
    .filter(Boolean)
    .sort();

  const filterOptions: FilterOptions = {
    projects: uniq([...allOpps.map((o) => o.project), ...allTasks.map((t) => t.project)]),
    staff: uniq([...allOpps.map((o) => o.assignedTo), ...allTasks.map((t) => t.assignedTo)]),
    sources: uniq(allOpps.map((o) => o.source)),
    stages: uniq(allOpps.map((o) => o.stage)),
    taskStatuses: uniq(allTasks.map((t) => t.status)),
    dateRange: {
      min: allDates[0] || "",
      max: allDates[allDates.length - 1] || "",
    },
  };

  return {
    overview,
    stageBreakdown,
    sourceBreakdown,
    staffPerformance,
    taskStatusBreakdown,
    trend,
    projectReport,
    sourceReport,
    followUps,
    filterOptions,
  };
}
