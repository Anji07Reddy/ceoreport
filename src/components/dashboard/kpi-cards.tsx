"use client";

import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Handshake,
  Home,
  PhoneCall,
  Sparkles,
  Star,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { OverviewCards } from "@/lib/types";
import { formatNumber, formatPercent } from "@/lib/utils";

const funnelDefs: { key: keyof OverviewCards; label: string; icon: React.ReactNode; tone: string }[] = [
  { key: "newLeads", label: "New Leads", icon: <Sparkles className="h-5 w-5" />, tone: "bg-blue-50 text-blue-600" },
  { key: "followUps", label: "Follow-ups", icon: <PhoneCall className="h-5 w-5" />, tone: "bg-indigo-50 text-indigo-600" },
  { key: "interested", label: "Interested", icon: <Star className="h-5 w-5" />, tone: "bg-amber-50 text-amber-600" },
  { key: "svScheduled", label: "SV Scheduled", icon: <CalendarCheck className="h-5 w-5" />, tone: "bg-violet-50 text-violet-600" },
  { key: "svDone", label: "SV Done", icon: <Home className="h-5 w-5" />, tone: "bg-cyan-50 text-cyan-600" },
  { key: "closures", label: "Closures", icon: <Handshake className="h-5 w-5" />, tone: "bg-emerald-50 text-emerald-600" },
];

const taskDefs: { key: keyof OverviewCards; label: string; icon: React.ReactNode; tone: string }[] = [
  { key: "completedTasks", label: "Completed Tasks", icon: <CheckCircle2 className="h-5 w-5" />, tone: "bg-emerald-50 text-emerald-600" },
  { key: "pendingTasks", label: "Pending Tasks", icon: <Clock className="h-5 w-5" />, tone: "bg-orange-50 text-orange-600" },
  { key: "overdueTasks", label: "Overdue Tasks", icon: <AlertTriangle className="h-5 w-5" />, tone: "bg-red-50 text-red-600" },
];

export function KpiCards({ overview }: { overview: OverviewCards }) {
  const conversions = [
    { label: "SV Show-up %", value: overview.svShowUpRate },
    { label: "Lead → Interested", value: overview.leadToInterested },
    { label: "Interested → SV", value: overview.interestedToSv },
    { label: "Closure / SV", value: overview.closurePerSv },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {funnelDefs.map((d) => (
          <Card key={d.key}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{d.label}</p>
                <p className="mt-1 text-2xl font-bold">{formatNumber(overview[d.key] as number)}</p>
              </div>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${d.tone}`}>{d.icon}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {conversions.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
              <p className="mt-1 text-xl font-bold text-primary">{formatPercent(c.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {taskDefs.map((d) => (
          <Card key={d.key}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{d.label}</p>
                <p className="mt-1 text-2xl font-bold">{formatNumber(overview[d.key] as number)}</p>
              </div>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${d.tone}`}>{d.icon}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
