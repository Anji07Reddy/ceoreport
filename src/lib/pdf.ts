"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DashboardData, GroupRow } from "@/lib/types";

const pct = (n: number) => `${n.toFixed(0)}%`;
const lastY = (doc: jsPDF) => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

function groupBody(rows: GroupRow[]) {
  return rows.map((r) => [
    r.key,
    r.newLeads,
    r.followUps,
    r.interested,
    r.svScheduled,
    r.svDone,
    r.closures,
    pct(r.svShowUpRate),
  ]);
}
const GROUP_HEAD = [["", "New", "Follow-ups", "Interested", "SV Sched", "SV Done", "Closures", "Show-up %"]];

/** Build and download a PDF of the Anuhar CRM report. */
export function exportDashboardPdf(data: DashboardData, dateLabel: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const x = 40;

  doc.setFontSize(18).setTextColor(30, 64, 175);
  doc.text("ANUHAR HOMES — CRM Performance Report", x, 44);
  doc.setFontSize(10).setTextColor(110);
  doc.text(`${data.monthLabel}  ·  ${dateLabel}`, x, 60);

  const o = data.overview;
  autoTable(doc, {
    startY: 74,
    head: [["New Leads", "Follow-ups", "Interested", "SV Scheduled", "SV Done", "Closures", "Show-up %", "Closure/SV %"]],
    body: [[
      o.newLeads, o.followUps, o.interested, o.svScheduled, o.svDone, o.closures,
      pct(o.svShowUpRate), pct(o.closurePerSv),
    ]],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 9, halign: "center" },
  });

  const section = (title: string, rows: GroupRow[], head = GROUP_HEAD) => {
    doc.setFontSize(12).setTextColor(30, 64, 175);
    doc.text(title, x, lastY(doc) + 22);
    autoTable(doc, {
      startY: lastY(doc) + 28,
      head: [[title.split(" ")[0], ...head[0].slice(1)]],
      body: groupBody(rows),
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 8 },
    });
  };

  section("Team Performance", data.byStaff);
  section("Source Performance", data.bySource);
  section("Project Performance", data.byProject);
  section("Weekly Summary", data.byWeek);

  doc.save(`anuhar-crm-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
