import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/uploads — most recent daily ingests. */
export async function GET() {
  try {
    const uploads = await prisma.upload.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        reportDate: true,
        createdAt: true,
        leadFileName: true,
        taskFileName: true,
        leadCount: true,
        taskCount: true,
      },
    });
    return NextResponse.json({ uploads });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load uploads." },
      { status: 500 }
    );
  }
}
