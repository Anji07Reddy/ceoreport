import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard";
import type { DashboardFilters } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function readFilters(sp: URLSearchParams): DashboardFilters {
  const get = (k: string) => {
    const v = sp.get(k);
    return v && v.trim() && v !== "all" ? v.trim() : undefined;
  };
  return {
    dateFrom: get("dateFrom"),
    dateTo: get("dateTo"),
    project: get("project"),
    staff: get("staff"),
    source: get("source"),
    stage: get("stage"),
    taskStatus: get("taskStatus"),
  };
}

export async function GET(req: NextRequest) {
  try {
    const data = await getDashboardData(readFilters(req.nextUrl.searchParams));
    return NextResponse.json(data);
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load dashboard data." },
      { status: 500 }
    );
  }
}
