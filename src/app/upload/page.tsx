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
  opportunities: number;
  tasks: number;
}

export default function UploadPage() {
  const router = useRouter();
  const [oppFile, setOppFile] = useState<File | null>(null);
  const [taskFile, setTaskFile] = useState<File | null>(null);
  const [reportDate, setReportDate] = useState<string>(toDateString(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!oppFile && !taskFile) {
      setError("Please choose at least one file to upload.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      if (oppFile) fd.append("opportunities", oppFile);
      if (taskFile) fd.append("tasks", taskFile);
      fd.append("reportDate", reportDate);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed.");
      setResult(json);
      setOppFile(null);
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
          Upload the Opportunities CSV and Tasks Excel for the selected report date.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload files</CardTitle>
          <CardDescription>CSV for opportunities, XLSX for tasks. Either or both.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FilePicker
                label="Opportunities (.csv)"
                icon={<FileText className="h-6 w-6" />}
                accept=".csv"
                file={oppFile}
                onSelect={setOppFile}
              />
              <FilePicker
                label="Tasks (.xlsx)"
                icon={<FileSpreadsheet className="h-6 w-6" />}
                accept=".xlsx,.xls"
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
                  <CheckCircle2 className="h-4 w-4" /> Upload processed for {result.reportDate}
                </div>
                <p>
                  Imported <strong>{result.opportunities}</strong> opportunities and{" "}
                  <strong>{result.tasks}</strong> tasks.
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
          <CardDescription>Headers are auto-detected — these are common names we recognize.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="font-medium">Opportunities CSV</p>
            <ul className="mt-1 list-disc pl-5 text-muted-foreground">
              <li>Name / Customer</li>
              <li>Project</li>
              <li>Source / Lead Source</li>
              <li>Lead Stage / Status (New, Warm, Cold, Site Visit, Won, Lost)</li>
              <li>Assigned To / Staff</li>
              <li>Created Date</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Tasks XLSX</p>
            <ul className="mt-1 list-disc pl-5 text-muted-foreground">
              <li>Task / Title</li>
              <li>Project</li>
              <li>Assigned To / Staff</li>
              <li>Status (Completed, Pending, Overdue)</li>
              <li>Due Date</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FilePicker({
  label,
  icon,
  accept,
  file,
  onSelect,
}: {
  label: string;
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
        <p className="text-xs text-muted-foreground">Click or drag a file here</p>
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
