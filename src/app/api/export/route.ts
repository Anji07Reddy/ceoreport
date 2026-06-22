import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getDashboardData } from "@/lib/dashboard";
import { readFilters } from "@/app/api/dashboard/route";
import type { GroupRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pct = (n: number) => Number(n.toFixed(1));

function groupSheet(rows: GroupRow[], keyHeader: string) {
  return rows.map((r) => ({
    [keyHeader]: r.key,
    "New Leads": r.newLeads,
    "Follow-ups": r.followUps,
    Interested: r.interested,
    "SV Scheduled": r.svScheduled,
    "SV Done": r.svDone,
    Closures: r.closures,
    "SV Show-up %": pct(r.svShowUpRate),
    "Closure / SV %": pct(r.closurePerSv),
  }));
}

/** GET /api/export?format=xlsx&...filters — multi-sheet Anuhar report. */
export async function GET(req: NextRequest) {
  try {
    const data = await getDashboardData(readFilters(req.nextUrl.searchParams));
    const wb = XLSX.utils.book_new();
    const o = data.overview;

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["ANUHAR HOMES — Executive Overview", data.monthLabel],
        [],
        ["Metric", "Value"],
        ["New Leads", o.newLeads],
        ["Follow-ups", o.followUps],
        ["Interested", o.interested],
        ["SV Scheduled", o.svScheduled],
        ["SV Done", o.svDone],
        ["Closures", o.closures],
        ["SV Show-up %", pct(o.svShowUpRate)],
        ["Lead → Interested %", pct(o.leadToInterested)],
        ["Interested → SV %", pct(o.interestedToSv)],
        ["Closure / SV %", pct(o.closurePerSv)],
        ["Completed Tasks", o.completedTasks],
        ["Pending Tasks", o.pendingTasks],
        ["Overdue Tasks", o.overdueTasks],
      ]),
      "Executive Overview"
    );

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(groupSheet(data.byStaff, "Team Member")), "Team Performance");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(groupSheet(data.bySource, "Lead Source")), "Source Performance");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(groupSheet(data.byProject, "Project")), "Project Performance");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(groupSheet(data.byWeek, "Week")), "Weekly Summary");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(groupSheet(data.byMonth, "Month")), "Monthly Summary");

    // Source × Project matrix
    const m = data.sourceProjectMatrix;
    const matrixAoa = [
      ["Lead Source", ...m.projects, "Total", "Share %"],
      ...m.rows.map((r) => [r.source, ...m.projects.map((p) => r.cells[p] ?? 0), r.total, pct(r.sharePct)]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(matrixAoa), "Source x Project");

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        data.followUps.map((f) => ({ Task: f.title, Contact: f.contact, Staff: f.staff, Status: f.status, "Due Date": f.dueDate }))
      ),
      "Followups"
    );

    const body = new Uint8Array(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="anuhar-crm-report-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Export failed." }, { status: 500 });
  }
}
