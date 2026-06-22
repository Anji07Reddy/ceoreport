"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Page title + optional description and right-aligned actions. */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** Rounded, soft-shadow surface used everywhere. */
export function Surface({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>{children}</div>
  );
}

export function SectionCard({
  title,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Surface className={className}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          {title && <h3 className="text-sm font-semibold text-slate-900">{title}</h3>}
          {action}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </Surface>
  );
}

const TONES: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600",
  indigo: "bg-indigo-50 text-indigo-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
  cyan: "bg-cyan-50 text-cyan-600",
  emerald: "bg-emerald-50 text-emerald-600",
  orange: "bg-orange-50 text-orange-600",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-100 text-slate-600",
};

export function StatCard({
  label,
  value,
  icon,
  tone = "blue",
  hint,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: keyof typeof TONES;
  hint?: string;
}) {
  return (
    <Surface className="p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", TONES[tone])}>{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </Surface>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex h-64 items-center justify-center text-slate-400">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {label}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <Surface className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-lg font-medium text-slate-700">{title}</p>
      {hint && <p className="max-w-md text-sm text-slate-500">{hint}</p>}
      {action}
    </Surface>
  );
}

const STAGE_STYLES: Record<string, string> = {
  New: "bg-blue-50 text-blue-700 ring-blue-600/20",
  Interested: "bg-amber-50 text-amber-700 ring-amber-600/20",
  "SV Scheduled": "bg-violet-50 text-violet-700 ring-violet-600/20",
  "SV Done": "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
  Closure: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Lost: "bg-red-50 text-red-700 ring-red-600/20",
};
const TEMP_STYLES: Record<string, string> = {
  Hot: "bg-red-50 text-red-700 ring-red-600/20",
  Warm: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Cold: "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
  Lost: "bg-slate-100 text-slate-600 ring-slate-500/20",
};
const STATUS_STYLES: Record<string, string> = {
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Overdue: "bg-red-50 text-red-700 ring-red-600/20",
};

export function Pill({ kind, value }: { kind: "stage" | "temperature" | "status"; value: string }) {
  const map = kind === "stage" ? STAGE_STYLES : kind === "temperature" ? TEMP_STYLES : STATUS_STYLES;
  const style = map[value] ?? "bg-slate-100 text-slate-600 ring-slate-500/20";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", style)}>
      {value}
    </span>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
      {initials || "?"}
    </span>
  );
}
