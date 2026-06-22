import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFilters } from "@/app/api/dashboard/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/leads — filtered, paginated lead rows for the Opportunities page. */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const f = readFilters(sp);
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(10, parseInt(sp.get("pageSize") || "25", 10)));
    const search = (sp.get("q") || "").trim();

    const where: Record<string, unknown> = { isFirst: true };
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
    if (f.project) where.project = f.project;
    if (f.staff) where.staff = f.staff;
    if (f.source) where.source = f.source;
    if (f.stage) where.stage = f.stage;
    if (search) {
      where.OR = [
        { contact: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        orderBy: { createdDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          contact: true,
          phone: true,
          stage: true,
          temperature: true,
          source: true,
          project: true,
          staff: true,
          createdDate: true,
          reportDate: true,
        },
      }),
    ]);

    return NextResponse.json({ total, page, pageSize, rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load leads." },
      { status: 500 }
    );
  }
}
