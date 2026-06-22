import Link from "next/link";
import { ArrowRight, Database, LayoutDashboard, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatNumber, toDateString } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  let uploadCount = 0;
  let leadCount = 0;
  let taskCount = 0;
  let lastUpload: { reportDate: Date } | null = null;

  try {
    [uploadCount, leadCount, taskCount, lastUpload] = await Promise.all([
      prisma.upload.count(),
      prisma.lead.count(),
      prisma.task.count(),
      prisma.upload.findFirst({ orderBy: { reportDate: "desc" }, select: { reportDate: true } }),
    ]);
  } catch {
    // Database may not be migrated yet; show zeros.
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-primary to-blue-700 p-8 text-primary-foreground shadow-lg sm:p-12">
        <h1 className="text-3xl font-bold sm:text-4xl">Anuhar Homes — CRM Performance Dashboard</h1>
        <p className="mt-3 max-w-2xl text-primary-foreground/90">
          Upload your daily <strong>CRM Daily Leads</strong> and <strong>Followup</strong> exports. We automatically
          clean &amp; normalize them (staff, source, project, funnel stage) and build every report — Executive
          Overview, Team &amp; Source Performance, Weekly/Monthly summaries and more.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link href="/upload">
              <Upload className="h-4 w-4" /> Upload today&apos;s files
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4" /> View dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Daily uploads" value={formatNumber(uploadCount)} icon={<Database className="h-5 w-5" />} />
        <StatCard label="Leads stored" value={formatNumber(leadCount)} icon={<Upload className="h-5 w-5" />} />
        <StatCard label="Followups stored" value={formatNumber(taskCount)} icon={<LayoutDashboard className="h-5 w-5" />} />
        <StatCard
          label="Latest report date"
          value={lastUpload ? toDateString(lastUpload.reportDate) : "—"}
          icon={<ArrowRight className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>1. Upload</CardTitle>
            <CardDescription>How the daily ingest works</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Drop the CRM Daily Leads and Followup exports for the day.</p>
            <p>• Messy values are normalized (Nikitha→Nikhita, Kenyt→Google, Rami Reddy→RR Towers…).</p>
            <p>• Leads are de-duplicated by contact so New Leads counts unique people.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>2. Analyze</CardTitle>
            <CardDescription>What the dashboard delivers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Executive Overview, Team &amp; Source Performance, conversion analytics, Source × Project matrix.</p>
            <p>• Funnel, source, team, stage &amp; trend charts with date/project/staff/source/stage filters.</p>
            <p>• One-click export to PDF and Excel.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}
