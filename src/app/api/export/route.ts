import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getDashboardData } from "@/lib/dashboard";
import type { DashboardFilters } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readFilters(req: NextRequest): DashboardFilters {
  const sp = req.nextUrl.searchParams;
  const get = (k: string) => {
    const v = sp.get(k);
    return v && v.trim() && v !== "all" ? v.trim() : undefined;
  };
  return {
    dateFrom: get("dateFrom"),
    dateTo: get("dateTo"),
    project: get("project"),
    assignedTo: get("assignedTo"),
    source: get("source"),
    stage: get("stage"),
    taskStatus: get("taskStatus"),
  };
}

/**
 * GET /api/export?format=xlsx&...filters
 * Builds a multi-sheet Excel workbook of the current (filtered) report.
 */
export async function GET(req: NextRequest) {
  try {
    const data = await getDashboardData(readFilters(req));
    const wb = XLSX.utils.book_new();

    // Overview sheet
    const overviewRows = [
      ["Metric", "Value"],
      ["Total Leads", data.overview.totalLeads],
      ["New Leads", data.overview.newLeads],
      ["Warm Leads", data.overview.warmLeads],
      ["Cold Leads", data.overview.coldLeads],
      ["Site Visits", data.overview.siteVisits],
      ["Completed Tasks", data.overview.completedTasks],
      ["Pending Tasks", data.overview.pendingTasks],
      ["Overdue Tasks", data.overview.overdueTasks],
      ["Conversion Rate (%)", Number(data.overview.conversionRate.toFixed(1))],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overviewRows), "Overview");

    // Project report
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        data.projectReport.map((p) => ({
          Project: p.project,
          "Total Leads": p.totalLeads,
          "Site Visits": p.siteVisits,
          Won: p.won,
          Tasks: p.tasks,
          "Completed Tasks": p.completedTasks,
        }))
      ),
      "Projects"
    );

    // Staff performance
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        data.staffPerformance.map((s) => ({
          Staff: s.staff,
          Leads: s.leads,
          "Site Visits": s.siteVisits,
          Won: s.won,
          Tasks: s.tasks,
          Completed: s.completed,
          Pending: s.pending,
          Overdue: s.overdue,
          "Completion Rate (%)": Number(s.completionRate.toFixed(1)),
        }))
      ),
      "Staff"
    );

    // Source quality
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        data.sourceReport.map((s) => ({
          Source: s.source,
          "Total Leads": s.totalLeads,
          Warm: s.warm,
          Cold: s.cold,
          "Site Visits": s.siteVisits,
          Won: s.won,
          "Quality Score (%)": Number(s.qualityScore.toFixed(1)),
        }))
      ),
      "Sources"
    );

    // Follow-ups
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        data.followUps.map((f) => ({
          Task: f.title,
          Project: f.project,
          "Assigned To": f.assignedTo,
          Status: f.status,
          "Due Date": f.dueDate,
        }))
      ),
      "Follow-ups"
    );

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    const filename = `crm-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
    const body = new Uint8Array(buf);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate export." },
      { status: 500 }
    );
  }
}
