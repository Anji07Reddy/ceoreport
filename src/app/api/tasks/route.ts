import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFilters } from "@/app/api/dashboard/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/tasks — filtered, paginated followup rows for the Tasks page. */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const f = readFilters(sp);
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(10, parseInt(sp.get("pageSize") || "25", 10)));
    const search = (sp.get("q") || "").trim();

    const where: Record<string, unknown> = {};
    if (f.dateFrom || f.dateTo) {
      const range: { gte?: Date; lte?: Date } = {};
      if (f.dateFrom) range.gte = new Date(f.dateFrom);
      if (f.dateTo) {
        const to = new Date(f.dateTo);
        to.setHours(23, 59, 59, 999);
        range.lte = to;
      }
      where.reportDate = range;
    }
    if (f.staff) where.staff = f.staff;
    if (f.taskStatus) where.status = f.taskStatus;
    if (search) {
      where.OR = [{ title: { contains: search } }, { contact: { contains: search } }];
    }

    const [total, rows] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        orderBy: { dueDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          contact: true,
          staff: true,
          status: true,
          createdDate: true,
          dueDate: true,
        },
      }),
    ]);

    return NextResponse.json({ total, page, pageSize, rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load tasks." },
      { status: 500 }
    );
  }
}
