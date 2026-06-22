import { NextRequest, NextResponse } from "next/server";
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

export async function GET(req: NextRequest) {
  try {
    const data = await getDashboardData(readFilters(req));
    return NextResponse.json(data);
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load dashboard data." },
      { status: 500 }
    );
  }
}
