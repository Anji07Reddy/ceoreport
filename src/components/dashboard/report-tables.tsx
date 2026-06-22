"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type {
  FollowUpRow,
  ProjectReportRow,
  SourceReportRow,
  StaffReportRow,
} from "@/lib/types";
import { formatPercent } from "@/lib/utils";

function Empty({ cols, label }: { cols: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} className="h-24 text-center text-muted-foreground">
        {label}
      </TableCell>
    </TableRow>
  );
}

export function ProjectTable({ rows }: { rows: ProjectReportRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead className="text-right">Leads</TableHead>
          <TableHead className="text-right">Site Visits</TableHead>
          <TableHead className="text-right">Won</TableHead>
          <TableHead className="text-right">Tasks</TableHead>
          <TableHead className="text-right">Completed</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <Empty cols={6} label="No project data" />
        ) : (
          rows.map((r) => (
            <TableRow key={r.project}>
              <TableCell className="font-medium">{r.project}</TableCell>
              <TableCell className="text-right">{r.totalLeads}</TableCell>
              <TableCell className="text-right">{r.siteVisits}</TableCell>
              <TableCell className="text-right">{r.won}</TableCell>
              <TableCell className="text-right">{r.tasks}</TableCell>
              <TableCell className="text-right">{r.completedTasks}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export function StaffTable({ rows }: { rows: StaffReportRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Staff</TableHead>
          <TableHead className="text-right">Leads</TableHead>
          <TableHead className="text-right">Site Visits</TableHead>
          <TableHead className="text-right">Won</TableHead>
          <TableHead className="text-right">Tasks</TableHead>
          <TableHead className="text-right">Done</TableHead>
          <TableHead className="text-right">Pending</TableHead>
          <TableHead className="text-right">Overdue</TableHead>
          <TableHead className="text-right">Completion</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <Empty cols={9} label="No staff data" />
        ) : (
          rows.map((r) => (
            <TableRow key={r.staff}>
              <TableCell className="font-medium">{r.staff}</TableCell>
              <TableCell className="text-right">{r.leads}</TableCell>
              <TableCell className="text-right">{r.siteVisits}</TableCell>
              <TableCell className="text-right">{r.won}</TableCell>
              <TableCell className="text-right">{r.tasks}</TableCell>
              <TableCell className="text-right">{r.completed}</TableCell>
              <TableCell className="text-right">{r.pending}</TableCell>
              <TableCell className="text-right">{r.overdue}</TableCell>
              <TableCell className="text-right">{formatPercent(r.completionRate)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export function SourceTable({ rows }: { rows: SourceReportRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Source</TableHead>
          <TableHead className="text-right">Leads</TableHead>
          <TableHead className="text-right">Warm</TableHead>
          <TableHead className="text-right">Cold</TableHead>
          <TableHead className="text-right">Site Visits</TableHead>
          <TableHead className="text-right">Won</TableHead>
          <TableHead className="text-right">Quality</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <Empty cols={7} label="No source data" />
        ) : (
          rows.map((r) => (
            <TableRow key={r.source}>
              <TableCell className="font-medium">{r.source}</TableCell>
              <TableCell className="text-right">{r.totalLeads}</TableCell>
              <TableCell className="text-right">{r.warm}</TableCell>
              <TableCell className="text-right">{r.cold}</TableCell>
              <TableCell className="text-right">{r.siteVisits}</TableCell>
              <TableCell className="text-right">{r.won}</TableCell>
              <TableCell className="text-right">
                <Badge variant={r.qualityScore >= 60 ? "success" : r.qualityScore >= 30 ? "warning" : "danger"}>
                  {formatPercent(r.qualityScore)}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export function FollowUpTable({ rows }: { rows: FollowUpRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <Empty cols={5} label="No pending follow-ups 🎉" />
        ) : (
          rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="max-w-[280px] truncate font-medium">{r.title}</TableCell>
              <TableCell>{r.project}</TableCell>
              <TableCell>{r.assignedTo}</TableCell>
              <TableCell>{r.dueDate || "—"}</TableCell>
              <TableCell>
                <Badge variant={r.status === "Overdue" ? "danger" : "warning"}>{r.status}</Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
