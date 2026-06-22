"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Loader2, Trash2 } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/dashboard/ui";

const STAFF = ["Nikhita", "Anusha", "Jyothi", "Nalini"];
const PROJECTS = ["Anuhar Towers", "RR Towers", "Gauthami Heights", "Pocharam"];
const SOURCES = ["Google", "Meta", "Organic", "99 Acres", "Housing", "Hoarding", "CP"];
const FUNNEL = ["New", "Interested", "SV Scheduled", "SV Done", "Closure", "Lost"];

const NORM_RULES = [
  ["Nikitha / Nikitha vihaan", "Nikhita"],
  ["Kenyt / Chatbot / Google Ads", "Google"],
  ["Facebook / Instagram", "Meta"],
  ["SEO / Website / Whatsapp", "Organic"],
  ["Anuhar Rami Reddy Towers", "RR Towers"],
  ["Gautami / GAUTAMI HEIGHTS", "Gauthami Heights"],
  ["site visite done / SV done", "SV Done"],
  ["sale done / booked", "Closure"],
];

export default function SettingsPage() {
  const router = useRouter();
  const [clearing, setClearing] = useState(false);

  const clearData = async () => {
    if (!confirm("This permanently deletes all uploaded leads, tasks and uploads. Continue?")) return;
    setClearing(true);
    try {
      await fetch("/api/reset", { method: "DELETE" });
      router.push("/");
      router.refresh();
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" description="Normalization rules & data management" />

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Team Members">
          <Chips items={STAFF} />
        </SectionCard>
        <SectionCard title="Projects">
          <Chips items={PROJECTS} />
        </SectionCard>
        <SectionCard title="Lead Sources">
          <Chips items={SOURCES} />
        </SectionCard>
        <SectionCard title="Funnel Stages">
          <Chips items={FUNNEL} />
        </SectionCard>
      </div>

      <SectionCard title="Normalization Rules (Engine)" className="mt-5" bodyClassName="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">Raw value (examples)</th>
              <th className="px-5 py-3 font-medium">Normalized to</th>
            </tr>
          </thead>
          <tbody>
            {NORM_RULES.map(([from, to]) => (
              <tr key={from} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3 text-slate-600">{from}</td>
                <td className="px-5 py-3 font-medium text-slate-800">→ {to}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="Data Management" className="mt-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <Database className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-800">Clear all data</p>
              <p className="text-sm text-slate-500">Remove every uploaded lead, task and daily upload. This cannot be undone.</p>
            </div>
          </div>
          <button
            onClick={clearData}
            disabled={clearing}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Clear data
          </button>
        </div>
      </SectionCard>
    </>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => (
        <span key={i} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          {i}
        </span>
      ))}
    </div>
  );
}
