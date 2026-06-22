// Shared types for the dashboard data contracts.

export interface DashboardFilters {
  dateFrom?: string;
  dateTo?: string;
  project?: string;
  assignedTo?: string;
  source?: string;
  stage?: string;
  taskStatus?: string;
}

export interface OverviewCards {
  totalLeads: number;
  newLeads: number;
  warmLeads: number;
  coldLeads: number;
  siteVisits: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  totalTasks: number;
  conversionRate: number; // won / total leads %
}

export interface NamedCount {
  name: string;
  value: number;
}

export interface ProjectReportRow {
  project: string;
  totalLeads: number;
  siteVisits: number;
  won: number;
  tasks: number;
  completedTasks: number;
}

export interface StaffReportRow {
  staff: string;
  leads: number;
  siteVisits: number;
  won: number;
  tasks: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
}

export interface SourceReportRow {
  source: string;
  totalLeads: number;
  warm: number;
  cold: number;
  won: number;
  siteVisits: number;
  qualityScore: number; // weighted quality %
}

export interface FollowUpRow {
  id: string;
  title: string;
  project: string;
  assignedTo: string;
  status: string;
  dueDate: string;
}

export interface TrendPoint {
  date: string;
  leads: number;
  siteVisits: number;
  completedTasks: number;
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
  overview: OverviewCards;
  stageBreakdown: NamedCount[];
  sourceBreakdown: NamedCount[];
  staffPerformance: StaffReportRow[];
  taskStatusBreakdown: NamedCount[];
  trend: TrendPoint[];
  projectReport: ProjectReportRow[];
  sourceReport: SourceReportRow[];
  followUps: FollowUpRow[];
  filterOptions: FilterOptions;
}
