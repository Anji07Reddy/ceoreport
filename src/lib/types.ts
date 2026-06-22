// Shared data contracts for the Anuhar Homes CRM dashboard.

export interface DashboardFilters {
  dateFrom?: string;
  dateTo?: string;
  project?: string;
  staff?: string;
  source?: string;
  stage?: string;
  taskStatus?: string;
}

/** The core funnel metrics, reused across every report grouping. */
export interface FunnelMetrics {
  newLeads: number;
  followUps: number;
  interested: number;
  svScheduled: number;
  svDone: number;
  closures: number;
  svShowUpRate: number; // SV Done / SV Scheduled
  leadToInterested: number; // Interested / New Leads
  interestedToSv: number; // SV Scheduled / Interested
  closurePerSv: number; // Closures / SV Done
  leadToSvDone: number; // SV Done / New Leads
}

export interface OverviewCards extends FunnelMetrics {
  totalLeads: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  hot: number;
  warm: number;
  cold: number;
  lost: number;
}

export interface NamedCount {
  name: string;
  value: number;
}

export interface GroupRow extends FunnelMetrics {
  key: string; // staff / source / project / week / month label
}

export interface MatrixRow {
  source: string;
  cells: Record<string, number>; // project -> count
  total: number;
  sharePct: number;
}

export interface FollowUpRow {
  id: string;
  title: string;
  contact: string;
  staff: string;
  status: string;
  dueDate: string;
}

export interface RecentLead {
  id: string;
  contact: string;
  stage: string;
  source: string;
  project: string;
  staff: string;
  temperature: string;
  date: string;
}

export interface TrendPoint {
  date: string;
  newLeads: number;
  svDone: number;
  followUps: number;
}

export interface FilterOptions {
  projects: string[];
  staff: string[];
  sources: string[];
  stages: string[];
  taskStatuses: string[];
  dateRange: { min: string; max: string };
}

export interface DashboardData {
  monthLabel: string;
  overview: OverviewCards;
  stageBreakdown: NamedCount[];
  temperatureBreakdown: NamedCount[];
  taskStatusBreakdown: NamedCount[];
  sourceBreakdown: NamedCount[];
  byStaff: GroupRow[];
  bySource: GroupRow[];
  byProject: GroupRow[];
  byWeek: GroupRow[];
  byMonth: GroupRow[];
  sourceProjectMatrix: { projects: string[]; rows: MatrixRow[] };
  trend: TrendPoint[];
  followUps: FollowUpRow[];
  recentLeads: RecentLead[];
  filterOptions: FilterOptions;
}
