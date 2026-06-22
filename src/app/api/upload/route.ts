import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ingestFile, markFirstContacts, type ParsedLead, type ParsedTask } from "@/lib/parse";

export const runtime = "nodejs";

/**
 * POST /api/upload  (multipart/form-data)
 *   - leads:      CRM Daily Leads export (.csv or .xlsx)
 *   - tasks:      Followup export (.xlsx or .csv)
 *   - reportDate: YYYY-MM-DD (optional, defaults to today)
 *
 * Each file is auto-detected; an xlsx containing a "CRM Daily Leads" /
 * "Followup" sheet is handled too. Leads are de-duplicated by contact so
 * "New Leads" counts unique first contacts.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const leadFile = form.get("leads") as File | null;
    const taskFile = form.get("tasks") as File | null;
    const reportDateRaw = (form.get("reportDate") as string | null)?.trim();

    if (!leadFile && !taskFile) {
      return NextResponse.json(
        { error: "Please upload at least one file (CRM Daily Leads or Followup)." },
        { status: 400 }
      );
    }

    let reportDate = new Date();
    if (reportDateRaw) {
      const d = new Date(reportDateRaw);
      if (!Number.isNaN(d.getTime())) reportDate = d;
    }
    reportDate.setHours(0, 0, 0, 0);

    let leads: ParsedLead[] = [];
    let tasks: ParsedTask[] = [];

    if (leadFile) {
      const buf = Buffer.from(await leadFile.arrayBuffer());
      const res = ingestFile(leadFile.name, buf, "leads");
      leads = leads.concat(res.leads);
      tasks = tasks.concat(res.tasks); // in case the leads file also held a Followup sheet
    }
    if (taskFile) {
      const buf = Buffer.from(await taskFile.arrayBuffer());
      const res = ingestFile(taskFile.name, buf, "tasks");
      tasks = tasks.concat(res.tasks);
      leads = leads.concat(res.leads);
    }

    if (leads.length === 0 && tasks.length === 0) {
      return NextResponse.json(
        { error: "No valid rows found. Make sure the files have the expected columns." },
        { status: 422 }
      );
    }

    markFirstContacts(leads);
    const uniqueLeads = leads.filter((l) => l.isFirst).length;

    const upload = await prisma.upload.create({
      data: {
        reportDate,
        leadFileName: leadFile?.name ?? null,
        taskFileName: taskFile?.name ?? null,
        leadCount: leads.length,
        taskCount: tasks.length,
        leads: {
          create: leads.map((l) => ({
            externalId: l.externalId ?? null,
            contact: l.contact ?? null,
            phone: l.phone ?? null,
            email: l.email ?? null,
            pipeline: l.pipeline ?? null,
            rawStage: l.rawStage ?? null,
            rawSource: l.rawSource ?? null,
            rawProject: l.rawProject ?? null,
            staff: l.staff,
            source: l.source,
            project: l.project,
            stage: l.stage,
            temperature: l.temperature,
            isFirst: l.isFirst,
            createdDate: l.createdDate,
            reportDate,
          })),
        },
        tasks: {
          create: tasks.map((t) => ({
            externalId: t.externalId ?? null,
            title: t.title ?? null,
            description: t.description ?? null,
            contact: t.contact ?? null,
            phone: t.phone ?? null,
            staff: t.staff,
            status: t.status,
            createdDate: t.createdDate,
            dueDate: t.dueDate,
            reportDate,
          })),
        },
      },
    });

    return NextResponse.json({
      success: true,
      uploadId: upload.id,
      reportDate: reportDate.toISOString().slice(0, 10),
      leads: leads.length,
      uniqueLeads,
      tasks: tasks.length,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process upload." },
      { status: 500 }
    );
  }
}
