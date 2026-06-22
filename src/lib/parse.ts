import Papa from "papaparse";
import * as XLSX from "xlsx";

// ---------------------------------------------------------------------------
// Generic helpers for cleaning messy spreadsheet input.
// ---------------------------------------------------------------------------

/** Normalize a header cell to a comparable key: lowercase, alnum only. */
function normKey(s: string): string {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Given a row keyed by original headers and a list of candidate header names,
 * return the first matching value. Matching is fuzzy (normalized + contains).
 */
function pick(
  row: Record<string, unknown>,
  normalizedRow: Record<string, unknown>,
  candidates: string[]
): string | undefined {
  for (const cand of candidates) {
    const key = normKey(cand);
    if (key in normalizedRow) {
      const v = normalizedRow[key];
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        return String(v).trim();
      }
    }
  }
  // contains-based fallback
  const keys = Object.keys(normalizedRow);
  for (const cand of candidates) {
    const key = normKey(cand);
    const hit = keys.find((k) => k.includes(key) || key.includes(k));
    if (hit) {
      const v = normalizedRow[hit];
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        return String(v).trim();
      }
    }
  }
  return undefined;
}

/** Build a normalized-key view of a row for fuzzy lookups. */
function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[normKey(k)] = v;
  }
  return out;
}

/** Parse a wide variety of date formats into a Date (or null). */
export function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;

  // Excel serial date number
  if (typeof value === "number" && value > 0 && value < 100000) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0));
    }
  }

  const s = String(value).trim();
  if (!s) return null;

  // Try native parse first
  const native = new Date(s);
  if (!Number.isNaN(native.getTime())) return native;

  // DD/MM/YYYY or DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) {
    let [, d, mo, y] = m;
    let year = parseInt(y, 10);
    if (year < 100) year += 2000;
    // Heuristic: if first part > 12 it must be the day (DD/MM), else assume DD/MM too (common in India CRMs)
    const day = parseInt(d, 10);
    const month = parseInt(mo, 10);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseBool(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  const s = String(value).trim().toLowerCase();
  return ["yes", "y", "true", "1", "done", "completed", "visited"].includes(s);
}

// ---------------------------------------------------------------------------
// Domain normalization: map free-text values to canonical buckets.
// ---------------------------------------------------------------------------

/** Map a raw lead stage string to a canonical stage. */
export function normalizeStage(raw: string | undefined): string {
  const s = (raw ?? "").toLowerCase().trim();
  if (!s) return "New";
  if (/(site\s*visit|visited|sitevisit)/.test(s)) return "Site Visit";
  if (/(won|closed\s*won|booked|booking|converted|deal)/.test(s)) return "Won";
  if (/(lost|closed\s*lost|dead|junk|invalid|not\s*interested)/.test(s)) return "Lost";
  if (/(warm|hot|interested|qualified|follow)/.test(s)) {
    return /hot/.test(s) ? "Warm" : "Warm";
  }
  if (/(cold|cool)/.test(s)) return "Cold";
  if (/(new|fresh|open|lead)/.test(s)) return "New";
  return "Other";
}

/** Map a raw task status to a canonical status. */
export function normalizeTaskStatus(
  raw: string | undefined,
  dueDate: Date | null
): string {
  const s = (raw ?? "").toLowerCase().trim();
  if (/(complete|done|closed|finished)/.test(s)) return "Completed";
  if (/(overdue|expired|late)/.test(s)) return "Overdue";
  if (/(pending|open|in\s*progress|todo|new|scheduled)/.test(s)) {
    // Auto-flag as overdue if past its due date and not completed.
    if (dueDate && dueDate.getTime() < Date.now()) return "Overdue";
    return "Pending";
  }
  if (!s) {
    if (dueDate && dueDate.getTime() < Date.now()) return "Overdue";
    return "Pending";
  }
  return "Other";
}

// ---------------------------------------------------------------------------
// Public types for parsed rows.
// ---------------------------------------------------------------------------

export interface ParsedOpportunity {
  externalId?: string;
  name?: string;
  project?: string;
  source?: string;
  stage: string;
  assignedTo?: string;
  status?: string;
  value: number | null;
  siteVisit: boolean;
  createdDate: Date | null;
}

export interface ParsedTask {
  externalId?: string;
  title?: string;
  project?: string;
  assignedTo?: string;
  status: string;
  dueDate: Date | null;
  createdDate: Date | null;
}

// ---------------------------------------------------------------------------
// Parsers.
// ---------------------------------------------------------------------------

/** Parse the Opportunities CSV buffer into cleaned rows. */
export function parseOpportunitiesCsv(text: string): ParsedOpportunity[] {
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });

  const rows = (result.data || []).filter(
    (r) => r && Object.values(r).some((v) => String(v ?? "").trim() !== "")
  );

  return rows.map((row) => {
    const nr = normalizeRow(row);
    const stageRaw = pick(row, nr, [
      "stage",
      "lead stage",
      "leadstage",
      "status",
      "lead status",
      "opportunity stage",
      "pipeline stage",
    ]);
    const siteVisitRaw = pick(row, nr, [
      "site visit",
      "sitevisit",
      "visit",
      "site visit done",
    ]);
    const stage = normalizeStage(stageRaw);
    return {
      externalId: pick(row, nr, ["id", "opportunity id", "lead id", "opp id", "ref"]),
      name: pick(row, nr, ["name", "lead name", "customer", "customer name", "contact", "client"]),
      project: pick(row, nr, ["project", "project name", "property", "campaign"]),
      source: pick(row, nr, ["source", "lead source", "channel", "medium"]),
      stage,
      assignedTo: pick(row, nr, [
        "assigned to",
        "assignedto",
        "assigned staff",
        "staff",
        "owner",
        "agent",
        "sales rep",
        "salesperson",
        "executive",
      ]),
      status: stageRaw,
      value: parseNumber(pick(row, nr, ["value", "deal value", "amount", "budget", "revenue"])),
      siteVisit: stage === "Site Visit" || parseBool(siteVisitRaw),
      createdDate: parseDate(
        pick(row, nr, ["created", "created date", "createdon", "date", "lead date", "created at", "enquiry date"])
      ),
    };
  });
}

/** Parse the Tasks XLSX buffer into cleaned rows. */
export function parseTasksXlsx(buffer: ArrayBuffer | Buffer): ParsedTask[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: true,
  });

  return rows
    .filter((r) => r && Object.values(r).some((v) => String(v ?? "").trim() !== ""))
    .map((row) => {
      const nr = normalizeRow(row);
      const dueDate = parseDate(
        pick(row, nr, ["due date", "duedate", "due", "deadline", "target date", "follow up date", "followup date"])
      );
      const statusRaw = pick(row, nr, ["status", "task status", "state", "progress"]);
      return {
        externalId: pick(row, nr, ["id", "task id", "taskid", "ref"]),
        title: pick(row, nr, ["title", "task", "task name", "subject", "description", "activity"]),
        project: pick(row, nr, ["project", "project name", "property"]),
        assignedTo: pick(row, nr, [
          "assigned to",
          "assignedto",
          "assigned staff",
          "staff",
          "owner",
          "agent",
          "executive",
          "user",
        ]),
        status: normalizeTaskStatus(statusRaw, dueDate),
        dueDate,
        createdDate: parseDate(
          pick(row, nr, ["created", "created date", "createdon", "date", "created at", "start date"])
        ),
      };
    });
}
