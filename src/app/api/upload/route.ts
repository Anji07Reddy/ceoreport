import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseOpportunitiesCsv, parseTasksXlsx } from "@/lib/parse";

export const runtime = "nodejs";

/**
 * POST /api/upload
 * multipart/form-data with fields:
 *   - opportunities: CSV file (optional but recommended)
 *   - tasks:         XLSX file (optional but recommended)
 *   - reportDate:    YYYY-MM-DD (optional, defaults to today)
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const oppFile = form.get("opportunities") as File | null;
    const taskFile = form.get("tasks") as File | null;
    const reportDateRaw = (form.get("reportDate") as string | null)?.trim();

    if (!oppFile && !taskFile) {
      return NextResponse.json(
        { error: "Please upload at least one file (Opportunities CSV or Tasks XLSX)." },
        { status: 400 }
      );
    }

    // Resolve the business date for this snapshot.
    let reportDate = new Date();
    if (reportDateRaw) {
      const d = new Date(reportDateRaw);
      if (!Number.isNaN(d.getTime())) reportDate = d;
    }
    reportDate.setHours(0, 0, 0, 0);

    // --- Parse opportunities --------------------------------------------------
    let parsedOpps: ReturnType<typeof parseOpportunitiesCsv> = [];
    if (oppFile) {
      const name = oppFile.name.toLowerCase();
      if (!name.endsWith(".csv")) {
        return NextResponse.json(
          { error: "Opportunities file must be a .csv file." },
          { status: 400 }
        );
      }
      const text = await oppFile.text();
      parsedOpps = parseOpportunitiesCsv(text);
    }

    // --- Parse tasks ----------------------------------------------------------
    let parsedTasks: ReturnType<typeof parseTasksXlsx> = [];
    if (taskFile) {
      const name = taskFile.name.toLowerCase();
      if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
        return NextResponse.json(
          { error: "Tasks file must be a .xlsx / .xls file." },
          { status: 400 }
        );
      }
      const buf = Buffer.from(await taskFile.arrayBuffer());
      parsedTasks = parseTasksXlsx(buf);
    }

    if (parsedOpps.length === 0 && parsedTasks.length === 0) {
      return NextResponse.json(
        { error: "No valid rows were found in the uploaded files. Please check the format." },
        { status: 422 }
      );
    }

    // --- Persist as one dated snapshot ---------------------------------------
    const upload = await prisma.upload.create({
      data: {
        reportDate,
        oppFileName: oppFile?.name ?? null,
        taskFileName: taskFile?.name ?? null,
        oppCount: parsedOpps.length,
        taskCount: parsedTasks.length,
        opportunities: {
          create: parsedOpps.map((o) => ({
            externalId: o.externalId ?? null,
            name: o.name ?? null,
            project: o.project ?? null,
            source: o.source ?? null,
            stage: o.stage,
            assignedTo: o.assignedTo ?? null,
            status: o.status ?? null,
            value: o.value,
            siteVisit: o.siteVisit,
            createdDate: o.createdDate,
            reportDate,
          })),
        },
        tasks: {
          create: parsedTasks.map((t) => ({
            externalId: t.externalId ?? null,
            title: t.title ?? null,
            project: t.project ?? null,
            assignedTo: t.assignedTo ?? null,
            status: t.status,
            dueDate: t.dueDate,
            createdDate: t.createdDate,
            reportDate,
          })),
        },
      },
    });

    return NextResponse.json({
      success: true,
      uploadId: upload.id,
      reportDate: reportDate.toISOString().slice(0, 10),
      opportunities: parsedOpps.length,
      tasks: parsedTasks.length,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process upload." },
      { status: 500 }
    );
  }
}
