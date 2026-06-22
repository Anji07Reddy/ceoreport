import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** DELETE /api/reset — clear all uploaded data (leads, tasks, uploads). */
export async function DELETE() {
  try {
    await prisma.lead.deleteMany();
    await prisma.task.deleteMany();
    await prisma.upload.deleteMany();
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reset." },
      { status: 500 }
    );
  }
}
