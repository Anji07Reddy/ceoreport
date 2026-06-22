"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FollowUpRow, GroupRow, MatrixRow } from "@/lib/types";
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

/** Funnel report grouped by staff / source / project / week / month. */
export function GroupTable({ rows, keyHeader, emptyLabel }: { rows: GroupRow[]; keyHeader: string; emptyLabel: string }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{keyHeader}</TableHead>
          <TableHead className="text-right">New Leads</TableHead>
          <TableHead className="text-right">Follow-ups</TableHead>
          <TableHead className="text-right">Interested</TableHead>
          <TableHead className="text-right">SV Scheduled</TableHead>
          <TableHead className="text-right">SV Done</TableHead>
          <TableHead className="text-right">Closures</TableHead>
          <TableHead className="text-right">SV Show-up %</TableHead>
          <TableHead className="text-right">Closure / SV</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <Empty cols={9} label={emptyLabel} />
        ) : (
          rows.map((r) => (
            <TableRow key={r.key}>
              <TableCell className="font-medium">{r.key}</TableCell>
              <TableCell className="text-right">{r.newLeads}</TableCell>
              <TableCell className="text-right">{r.followUps}</TableCell>
              <TableCell className="text-right">{r.interested}</TableCell>
              <TableCell className="text-right">{r.svScheduled}</TableCell>
              <TableCell className="text-right">{r.svDone}</TableCell>
              <TableCell className="text-right">{r.closures}</TableCell>
              <TableCell className="text-right">{formatPercent(r.svShowUpRate)}</TableCell>
              <TableCell className="text-right">{formatPercent(r.closurePerSv)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

/** Conversion analytics: Lead → SV Done % per group (team & project). */
export function ConversionTable({ rows, keyHeader }: { rows: GroupRow[]; keyHeader: string }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{keyHeader}</TableHead>
          <TableHead className="text-right">New Leads</TableHead>
          <TableHead className="text-right">Interested</TableHead>
          <TableHead className="text-right">SV Scheduled</TableHead>
          <TableHead className="text-right">SV Done</TableHead>
          <TableHead className="text-right">Closures</TableHead>
          <TableHead className="text-right">Lead → SV Done %</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <Empty cols={7} label="No data" />
        ) : (
          rows.map((r) => (
            <TableRow key={r.key}>
              <TableCell className="font-medium">{r.key}</TableCell>
              <TableCell className="text-right">{r.newLeads}</TableCell>
              <TableCell className="text-right">{r.interested}</TableCell>
              <TableCell className="text-right">{r.svScheduled}</TableCell>
              <TableCell className="text-right">{r.svDone}</TableCell>
              <TableCell className="text-right">{r.closures}</TableCell>
              <TableCell className="text-right">
                <Badge variant={r.leadToSvDone >= 5 ? "success" : r.leadToSvDone >= 2 ? "warning" : "danger"}>
                  {formatPercent(r.leadToSvDone)}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

/** Source × Project lead matrix. */
export function MatrixTable({ projects, rows }: { projects: string[]; rows: MatrixRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lead Source</TableHead>
          {projects.map((p) => (
            <TableHead key={p} className="text-right">
              {p}
            </TableHead>
          ))}
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Share %</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <Empty cols={projects.length + 3} label="No data" />
        ) : (
          rows.map((r) => (
            <TableRow key={r.source}>
              <TableCell className="font-medium">{r.source}</TableCell>
              {projects.map((p) => (
                <TableCell key={p} className="text-right">
                  {r.cells[p] ?? 0}
                </TableCell>
              ))}
              <TableCell className="text-right font-semibold">{r.total}</TableCell>
              <TableCell className="text-right">{formatPercent(r.sharePct)}</TableCell>
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
          <TableHead>Contact</TableHead>
          <TableHead>Staff</TableHead>
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
              <TableCell className="max-w-[260px] truncate font-medium">{r.title}</TableCell>
              <TableCell>{r.contact}</TableCell>
              <TableCell>{r.staff}</TableCell>
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
