"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DashboardData } from "@/lib/types";

/** Build and download a PDF summary of the current dashboard data. */
export function exportDashboardPdf(data: DashboardData, dateLabel: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const marginX = 40;
  let y = 48;

  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175);
  doc.text("CRM Performance Report", marginX, y);
  doc.setFontSize(10);
  doc.setTextColor(100);
  y += 18;
  doc.text(dateLabel, marginX, y);
  y += 16;

  const o = data.overview;
  autoTable(doc, {
    startY: y,
    head: [["Executive Overview", "Value"]],
    body: [
      ["Total Leads", String(o.totalLeads)],
      ["New Leads", String(o.newLeads)],
      ["Warm Leads", String(o.warmLeads)],
      ["Cold Leads", String(o.coldLeads)],
      ["Site Visits", String(o.siteVisits)],
      ["Completed Tasks", String(o.completedTasks)],
      ["Pending Tasks", String(o.pendingTasks)],
      ["Overdue Tasks", String(o.overdueTasks)],
      ["Conversion Rate", `${o.conversionRate.toFixed(1)}%`],
    ],
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 9 },
  });

  // Project report
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 18,
    head: [["Project", "Leads", "Site Visits", "Won", "Tasks", "Completed"]],
    body: data.projectReport.map((p) => [
      p.project,
      p.totalLeads,
      p.siteVisits,
      p.won,
      p.tasks,
      p.completedTasks,
    ]),
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 8 },
  });

  // Staff performance
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 18,
    head: [["Staff", "Leads", "Visits", "Won", "Tasks", "Done", "Pending", "Overdue", "Rate"]],
    body: data.staffPerformance.map((s) => [
      s.staff,
      s.leads,
      s.siteVisits,
      s.won,
      s.tasks,
      s.completed,
      s.pending,
      s.overdue,
      `${s.completionRate.toFixed(0)}%`,
    ]),
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 8 },
  });

  // Source quality
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 18,
    head: [["Source", "Leads", "Warm", "Cold", "Site Visits", "Won", "Quality"]],
    body: data.sourceReport.map((s) => [
      s.source,
      s.totalLeads,
      s.warm,
      s.cold,
      s.siteVisits,
      s.won,
      `${s.qualityScore.toFixed(0)}%`,
    ]),
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 8 },
  });

  doc.save(`crm-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
