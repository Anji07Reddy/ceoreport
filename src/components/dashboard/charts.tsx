"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NamedCount, StaffReportRow, TrendPoint } from "@/lib/types";

const PALETTE = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#ea580c",
  "#475569",
];

const STAGE_COLORS: Record<string, string> = {
  New: "#2563eb",
  Warm: "#f59e0b",
  Cold: "#0891b2",
  "Site Visit": "#7c3aed",
  Won: "#16a34a",
  Lost: "#dc2626",
  Other: "#94a3b8",
};

const TASK_COLORS: Record<string, string> = {
  Completed: "#16a34a",
  Pending: "#f59e0b",
  Overdue: "#dc2626",
  Other: "#94a3b8",
};

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

export function StagePieChart({ data }: { data: NamedCount[] }) {
  if (!data.length) return <EmptyState label="No lead stage data" />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={STAGE_COLORS[entry.name] ?? PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SourceBarChart({ data }: { data: NamedCount[] }) {
  if (!data.length) return <EmptyState label="No source data" />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="value" name="Leads" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StaffPerformanceChart({ data }: { data: StaffReportRow[] }) {
  const top = data.slice(0, 10);
  if (!top.length) return <EmptyState label="No staff data" />;
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={top} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="staff" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="leads" name="Leads" fill="#2563eb" radius={[4, 4, 0, 0]} />
        <Bar dataKey="siteVisits" name="Site Visits" fill="#7c3aed" radius={[4, 4, 0, 0]} />
        <Bar dataKey="completed" name="Tasks Done" fill="#16a34a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TaskStatusChart({ data }: { data: NamedCount[] }) {
  if (!data.length) return <EmptyState label="No task data" />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} label>
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={TASK_COLORS[entry.name] ?? PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DailyTrendChart({ data }: { data: TrendPoint[] }) {
  if (!data.length) return <EmptyState label="No trend data" />;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="leads" name="Leads" stroke="#2563eb" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="siteVisits" name="Site Visits" stroke="#7c3aed" strokeWidth={2} dot={false} />
        <Line
          type="monotone"
          dataKey="completedTasks"
          name="Completed Tasks"
          stroke="#16a34a"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
