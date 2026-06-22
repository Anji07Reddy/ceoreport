"use client";

import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Flame,
  Snowflake,
  Sparkles,
  Users,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { OverviewCards } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

const cardDefs: {
  key: keyof OverviewCards;
  label: string;
  icon: React.ReactNode;
  tone: string;
}[] = [
  { key: "totalLeads", label: "Total Leads", icon: <Users className="h-5 w-5" />, tone: "bg-blue-50 text-blue-600" },
  { key: "newLeads", label: "New Leads", icon: <Sparkles className="h-5 w-5" />, tone: "bg-indigo-50 text-indigo-600" },
  { key: "warmLeads", label: "Warm Leads", icon: <Flame className="h-5 w-5" />, tone: "bg-amber-50 text-amber-600" },
  { key: "coldLeads", label: "Cold Leads", icon: <Snowflake className="h-5 w-5" />, tone: "bg-cyan-50 text-cyan-600" },
  { key: "siteVisits", label: "Site Visits", icon: <CalendarCheck className="h-5 w-5" />, tone: "bg-violet-50 text-violet-600" },
  { key: "completedTasks", label: "Completed Tasks", icon: <CheckCircle2 className="h-5 w-5" />, tone: "bg-emerald-50 text-emerald-600" },
  { key: "pendingTasks", label: "Pending Tasks", icon: <Clock className="h-5 w-5" />, tone: "bg-orange-50 text-orange-600" },
  { key: "overdueTasks", label: "Overdue Tasks", icon: <AlertTriangle className="h-5 w-5" />, tone: "bg-red-50 text-red-600" },
];

export function KpiCards({ overview }: { overview: OverviewCards }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cardDefs.map((def) => (
        <Card key={def.key}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground sm:text-sm">{def.label}</p>
              <p className="mt-1 text-2xl font-bold">{formatNumber(overview[def.key] as number)}</p>
            </div>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${def.tone}`}>
              {def.icon}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
