"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileSpreadsheet, FileText, Loader2, UploadCloud, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toDateString } from "@/lib/utils";

interface UploadResult {
  reportDate: string;
  leads: number;
  uniqueLeads: number;
  tasks: number;
}

export default function UploadPage() {
  const router = useRouter();
  const [leadFile, setLeadFile] = useState<File | null>(null);
  const [taskFile, setTaskFile] = useState<File | null>(null);
  const [reportDate, setReportDate] = useState<string>(toDateString(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!leadFile && !taskFile) {
      setError("Please choose at least one file to upload.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      if (leadFile) fd.append("leads", leadFile);
      if (taskFile) fd.append("tasks", taskFile);
      fd.append("reportDate", reportDate);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed.");
      setResult(json);
      setLeadFile(null);
      setTaskFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Daily Upload</h1>
        <p className="text-muted-foreground">
          Upload the <strong>CRM Daily Leads</strong> and <strong>Followup</strong> exports for the selected date.
          Values are cleaned and normalized automatically (staff, source, project & funnel stage).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload files</CardTitle>
          <CardDescription>CSV or Excel — either or both.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FilePicker
                label="CRM Daily Leads"
                hint=".csv or .xlsx"
                icon={<FileText className="h-6 w-6" />}
                accept=".csv,.xlsx,.xls"
                file={leadFile}
                onSelect={setLeadFile}
              />
              <FilePicker
                label="Followup (Tasks)"
                hint=".xlsx or .csv"
                icon={<FileSpreadsheet className="h-6 w-6" />}
                accept=".xlsx,.xls,.csv"
                file={taskFile}
                onSelect={setTaskFile}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportDate">Report date</Label>
              <Input
                id="reportDate"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="sm:w-60"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                <XCircle className="h-4 w-4" /> {error}
              </div>
            )}

            {result && (
              <div className="space-y-3 rounded-md bg-emerald-50 p-4 text-sm text-emerald-800">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4" /> Processed for {result.reportDate}
                </div>
                <p>
                  Imported <strong>{result.leads}</strong> lead rows (<strong>{result.uniqueLeads}</strong> unique new
                  leads) and <strong>{result.tasks}</strong> followups.
                </p>
                <Button type="button" size="sm" onClick={() => router.push("/dashboard")}>
                  Go to dashboard
                </Button>
              </div>
            )}

            <Button type="submit" disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" /> Upload & process
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expected columns</CardTitle>
          <CardDescription>Headers are auto-detected — common variants are recognized.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="font-medium">CRM Daily Leads</p>
            <ul className="mt-1 list-disc pl-5 text-muted-foreground">
              <li>Contact Name / Phone</li>
              <li>Pipeline, Source, Tags</li>
              <li>Project Name</li>
              <li>Stage (New Lead, Interested, SV Scheduled, SV Done, Sale Done…)</li>
              <li>Status (Cold / Warm / Hot / Lost)</li>
              <li>Assigned Staff, Created date</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Followup</p>
            <ul className="mt-1 list-disc pl-5 text-muted-foreground">
              <li>Title / Description</li>
              <li>Contact, Phone</li>
              <li>Status (Completed / Pending)</li>
              <li>Assigned To / Staff</li>
              <li>Created On, Due Date</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FilePicker({
  label,
  hint,
  icon,
  accept,
  file,
  onSelect,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  accept: string;
  file: File | null;
  onSelect: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onSelect(f);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        dragOver ? "border-primary bg-primary/5" : "border-input hover:border-primary/50"
      }`}
    >
      <span className="text-muted-foreground">{icon}</span>
      <p className="text-sm font-medium">{label}</p>
      {file ? (
        <p className="max-w-full truncate text-xs text-emerald-600">{file.name}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Click or drag a file · {hint}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
