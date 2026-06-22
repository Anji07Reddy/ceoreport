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
import type { GroupRow, NamedCount, OverviewCards, TrendPoint } from "@/lib/types";

const PALETTE = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#65a30d", "#ea580c", "#475569"];

const STAGE_COLORS: Record<string, string> = {
  New: "#2563eb",
  Interested: "#f59e0b",
  "SV Scheduled": "#7c3aed",
  "SV Done": "#0891b2",
  Closure: "#16a34a",
  Lost: "#dc2626",
};
const TEMP_COLORS: Record<string, string> = { Hot: "#dc2626", Warm: "#f59e0b", Cold: "#0891b2", Lost: "#94a3b8" };
const TASK_COLORS: Record<string, string> = { Completed: "#16a34a", Pending: "#f59e0b", Overdue: "#dc2626" };

function Empty({ label }: { label: string }) {
  return <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">{label}</div>;
}

/** Horizontal funnel bar: New → Interested → SV Scheduled → SV Done → Closures. */
export function FunnelChart({ overview }: { overview: OverviewCards }) {
  const data = [
    { name: "New Leads", value: overview.newLeads },
    { name: "Interested", value: overview.interested },
    { name: "SV Scheduled", value: overview.svScheduled },
    { name: "SV Done", value: overview.svDone },
    { name: "Closures", value: overview.closures },
  ];
  if (!overview.newLeads) return <Empty label="No lead data" />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 24, right: 24, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="value" name="Leads" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StagePie({ data }: { data: NamedCount[] }) {
  if (!data.length) return <Empty label="No stage data" />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
          {data.map((e, i) => (
            <Cell key={e.name} fill={STAGE_COLORS[e.name] ?? PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TemperaturePie({ data }: { data: NamedCount[] }) {
  if (!data.length) return <Empty label="No temperature data" />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} label>
          {data.map((e, i) => (
            <Cell key={e.name} fill={TEMP_COLORS[e.name] ?? PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TaskStatusPie({ data }: { data: NamedCount[] }) {
  if (!data.length) return <Empty label="No task data" />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} label>
          {data.map((e, i) => (
            <Cell key={e.name} fill={TASK_COLORS[e.name] ?? PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SourceBar({ data }: { data: NamedCount[] }) {
  if (!data.length) return <Empty label="No source data" />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={56} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="value" name="Leads" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Grouped bars per team member: New / SV Done / Closures. */
export function TeamBar({ data }: { data: GroupRow[] }) {
  const rows = data.slice(0, 10);
  if (!rows.length) return <Empty label="No team data" />;
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={rows} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="key" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={56} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="newLeads" name="New Leads" fill="#2563eb" radius={[4, 4, 0, 0]} />
        <Bar dataKey="svDone" name="SV Done" fill="#0891b2" radius={[4, 4, 0, 0]} />
        <Bar dataKey="closures" name="Closures" fill="#16a34a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  if (!data.length) return <Empty label="No trend data" />;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="newLeads" name="New Leads" stroke="#2563eb" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="followUps" name="Follow-ups" stroke="#f59e0b" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="svDone" name="SV Done" stroke="#16a34a" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
