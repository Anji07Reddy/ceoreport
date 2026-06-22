import Papa from "papaparse";
import * as XLSX from "xlsx";

// ===========================================================================
// ANUHAR HOMES — data ingestion & normalization engine
//
// Mirrors the logic of the "Engine" sheet in the original workbook: it takes
// the two raw CRM exports (CRM Daily Leads + Followup) and normalizes the
// messy free-text values into canonical Staff / Source / Project / Stage so
// every downstream report is consistent.
// ===========================================================================

// --- Canonical vocabularies (from the "Setup" sheet) -----------------------

export const STAFF = ["Nikhita", "Anusha", "Jyothi", "Nalini"] as const;
export const PROJECTS = ["Anuhar Towers", "RR Towers", "Gauthami Heights", "Pocharam"] as const;
export const SOURCES = ["Google", "Meta", "Organic", "99 Acres", "Housing", "Hoarding", "CP", "Other"] as const;

/** Funnel stages in order. New is the top of funnel. */
export const FUNNEL_STAGES = [
  "New",
  "Interested",
  "SV Scheduled",
  "SV Done",
  "Closure",
  "Lost",
] as const;
export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export type Temperature = "Hot" | "Warm" | "Cold" | "Lost";

// --- Low-level helpers ------------------------------------------------------

function normKey(s: string): string {
  return String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) out[normKey(k)] = v;
  return out;
}

function pick(nr: Record<string, unknown>, candidates: string[]): string | undefined {
  for (const cand of candidates) {
    const key = normKey(cand);
    if (key in nr) {
      const v = nr[key];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
    }
  }
  const keys = Object.keys(nr);
  for (const cand of candidates) {
    const key = normKey(cand);
    const hit = keys.find((k) => k && (k.includes(key) || key.includes(k)));
    if (hit) {
      const v = nr[hit];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
    }
  }
  return undefined;
}

/** Parse the many date formats found in the exports into a Date (or null). */
export function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  // Excel serial date number (e.g. 46174)
  if (typeof value === "number" && value > 0 && value < 100000) {
    const p = XLSX.SSF.parse_date_code(value);
    if (p) return new Date(Date.UTC(p.y, p.m - 1, p.d, p.H || 0, p.M || 0, p.S || 0));
  }

  let s = String(value).trim();
  if (!s) return null;
  // "06/02/2026 at 10:28 AM" -> strip the " at "
  s = s.replace(/\s+at\s+/i, " ");

  // DD/MM/YYYY [time] — the CRM exports are day-first.
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) {
    let [, d, mo, y] = m;
    let year = parseInt(y, 10);
    if (year < 100) year += 2000;
    const day = parseInt(d, 10);
    const month = parseInt(mo, 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(Date.UTC(year, month - 1, day));
      if (!Number.isNaN(date.getTime())) return date;
    }
  }

  const native = new Date(s);
  if (!Number.isNaN(native.getTime())) return native;
  return null;
}

function digits(s: string | undefined): string {
  return (s ?? "").replace(/\D/g, "").replace(/^0+/, "").slice(-10);
}

// --- Domain normalizers (the "Engine" rules) --------------------------------

export function normalizeStaff(raw: string | undefined): string {
  const s = (raw ?? "").toLowerCase();
  if (/nik|vihaan/.test(s)) return "Nikhita";
  if (/anusha/.test(s)) return "Anusha";
  if (/jyothi|jyoti/.test(s)) return "Jyothi";
  if (/nalini|kilari/.test(s)) return "Nalini";
  return "Unassigned";
}

/**
 * Source from the combined Pipeline + Source + Tags text.
 * Google = Google Ads + Chatbot (Kenyt). Meta = Facebook + Instagram.
 * Organic = SEO + Website + Whatsapp.
 */
export function normalizeSource(...parts: (string | undefined)[]): string {
  const s = parts.filter(Boolean).join(" ").toLowerCase();
  if (/99\s*acres/.test(s)) return "99 Acres";
  if (/housing/.test(s)) return "Housing";
  if (/hoarding/.test(s)) return "Hoarding";
  if (/\bcp\b|channel\s*partner|cp leads/.test(s)) return "CP";
  if (/meta|facebook|instagram|\bfb\b|\big\b/.test(s)) return "Meta";
  if (/google|chatbot|kenyt|adwords|ppc/.test(s)) return "Google";
  if (/organic|seo|website|web\b|whatsapp|whats app/.test(s)) return "Organic";
  if (/linkedin/.test(s)) return "Other";
  return "Other";
}

/** Project from Project Name + Pipeline + Tags text. */
export function normalizeProject(...parts: (string | undefined)[]): string {
  const s = parts.filter(Boolean).join(" ").toLowerCase();
  if (/gau?tami|gauthami/.test(s)) return "Gauthami Heights";
  // "Rami Reddy" / "RR" map to RR Towers (checked before the generic Anuhar Towers).
  if (/rami\s*reddy|ramireddy|\brr\b|rr tower|rr-|rr_/.test(s)) return "RR Towers";
  if (/pocharam/.test(s)) return "Pocharam";
  if (/anuhar tower|anuhar tw|\bsun tower/.test(s)) return "Anuhar Towers";
  return "Other";
}

/** Map a raw lead Stage to a canonical funnel stage. */
export function normalizeFunnelStage(stageRaw: string | undefined, temperature?: Temperature): FunnelStage {
  const s = (stageRaw ?? "").toLowerCase().trim();
  if (/sale\s*done|closed\s*won|booked|booking|closure|closed/.test(s)) return "Closure";
  if (/sv\s*done|site\s*visite?\s*done|site\s*visit\s*done|visit\s*done/.test(s)) return "SV Done";
  if (/sv\s*scheduled|site\s*visit\s*scheduled|follow.?up\s*for\s*sv|sv\s*fixed/.test(s)) return "SV Scheduled";
  if (/not\s*interest|invalid|out\s*of\s*budget|location\s*mismatch|junk|dead|rejecting/.test(s)) return "Lost";
  if (/interest|details\s*sh|sv\s*interest|cp\b|channel\s*partner/.test(s)) return "Interested";
  if (temperature === "Lost") return "Lost";
  return "New";
}

export function normalizeTemperature(statusRaw: string | undefined): Temperature {
  const s = (statusRaw ?? "").toLowerCase().trim();
  if (/hot/.test(s)) return "Hot";
  if (/warm/.test(s)) return "Warm";
  if (/lost|dead|invalid/.test(s)) return "Lost";
  return "Cold";
}

/** Normalize a followup task status. Past-due & not-complete => Overdue. */
export function normalizeTaskStatus(raw: string | undefined, dueDate: Date | null): string {
  const s = (raw ?? "").toLowerCase().trim();
  if (/complete|done|closed|finished/.test(s)) return "Completed";
  if (/overdue|expired|late/.test(s)) return "Overdue";
  if (dueDate && dueDate.getTime() < Date.now()) return "Overdue";
  return "Pending";
}

// --- Parsed row shapes ------------------------------------------------------

export interface ParsedLead {
  externalId?: string;
  contact?: string;
  phone?: string;
  email?: string;
  pipeline?: string;
  rawStage?: string;
  rawSource?: string;
  rawProject?: string;
  staff: string;
  source: string;
  project: string;
  stage: FunnelStage;
  temperature: Temperature;
  isFirst: boolean;
  createdDate: Date | null;
}

export interface ParsedTask {
  externalId?: string;
  title?: string;
  description?: string;
  contact?: string;
  phone?: string;
  staff: string;
  status: string;
  createdDate: Date | null;
  dueDate: Date | null;
}

// --- Sheet/file readers -----------------------------------------------------

type Row = Record<string, unknown>;

function sniff(headers: string[]): "leads" | "tasks" | "unknown" {
  const h = headers.map(normKey);
  const has = (...names: string[]) => names.some((n) => h.includes(normKey(n)) || h.some((x) => x.includes(normKey(n))));
  // Tasks/Followup signature
  if (has("due date") && (has("title") || has("assigned to") || has("staff"))) return "tasks";
  // Leads signature
  if (has("stage") && (has("assigned staff") || has("project name") || has("pipeline") || has("contact phone"))) {
    return "leads";
  }
  if (has("stage")) return "leads";
  if (has("due date")) return "tasks";
  return "unknown";
}

/** Read every sheet of an xlsx (or a single csv) into { name, rows[] } blocks. */
function readBlocks(name: string, buffer: ArrayBuffer | Buffer): { sheet: string; rows: Row[] }[] {
  const lower = name.toLowerCase();
  if (lower.endsWith(".csv")) {
    const text = Buffer.isBuffer(buffer) ? buffer.toString("utf8") : new TextDecoder().decode(buffer);
    const res = Papa.parse<Row>(text, { header: true, skipEmptyLines: "greedy", transformHeader: (x) => x.trim() });
    return [{ sheet: "csv", rows: res.data || [] }];
  }
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  return wb.SheetNames.map((sheet) => ({
    sheet,
    rows: XLSX.utils.sheet_to_json<Row>(wb.Sheets[sheet], { defval: "", raw: true }),
  }));
}

function nonEmpty(rows: Row[]): Row[] {
  return rows.filter((r) => r && Object.values(r).some((v) => String(v ?? "").trim() !== ""));
}

function leadFromRow(row: Row): ParsedLead {
  const nr = normalizeRow(row);
  const rawStage = pick(nr, ["stage", "lead stage", "opportunity stage"]);
  const rawStatus = pick(nr, ["status", "lead status", "temperature"]);
  const pipeline = pick(nr, ["pipeline", "pipeline name"]);
  const tags = pick(nr, ["tags", "tag"]);
  const rawSource = pick(nr, ["source", "lead source", "channel"]);
  const rawProject = pick(nr, ["project name", "project", "property"]);
  const message = pick(nr, ["your message", "message", "notes"]);
  const temperature = normalizeTemperature(rawStatus);
  return {
    externalId: pick(nr, ["opportunity id", "lead id", "id", "opportunity"]),
    contact: pick(nr, ["contact name", "name", "contact", "customer"]),
    phone: pick(nr, ["contact phone", "phone", "mobile"]),
    email: pick(nr, ["contact email", "email"]),
    pipeline,
    rawStage,
    rawSource,
    rawProject,
    staff: normalizeStaff(pick(nr, ["assigned staff", "assigned to", "staff", "owner", "agent"])),
    source: normalizeSource(rawSource, pipeline, tags, rawProject, message),
    project: normalizeProject(rawProject, pipeline, tags),
    stage: normalizeFunnelStage(rawStage, temperature),
    temperature,
    isFirst: true, // set later in markFirstContacts
    createdDate: parseDate(pick(nr, ["created", "created on", "created date", "date", "created at"])),
  };
}

function taskFromRow(row: Row): ParsedTask {
  const nr = normalizeRow(row);
  const dueDate = parseDate(pick(nr, ["due date", "due", "deadline", "target date", "follow up date"]));
  return {
    externalId: pick(nr, ["task id", "id"]),
    title: pick(nr, ["title", "task", "subject", "activity"]),
    description: pick(nr, ["description", "notes", "remark"]),
    contact: pick(nr, ["contact", "contact name", "name"]),
    phone: pick(nr, ["phone", "mobile", "contact phone"]),
    staff: normalizeStaff(pick(nr, ["staff", "assigned to", "assigned staff", "owner", "user"])),
    status: normalizeTaskStatus(pick(nr, ["status", "task status", "state"]), dueDate),
    createdDate: parseDate(pick(nr, ["created on", "created", "created date", "date"])),
    dueDate,
  };
}

/**
 * Ingest one uploaded file. Picks the right sheet(s) automatically:
 * an xlsx may contain a "CRM Daily Leads"/"Followup" sheet, or just raw rows.
 * Honors the caller's intent ("leads" | "tasks") when a file is ambiguous.
 */
export function ingestFile(
  name: string,
  buffer: ArrayBuffer | Buffer,
  intent: "leads" | "tasks"
): { leads: ParsedLead[]; tasks: ParsedTask[] } {
  const blocks = readBlocks(name, buffer);
  const leads: ParsedLead[] = [];
  const tasks: ParsedTask[] = [];

  // Prefer a sheet whose name clearly matches the intent.
  const prefer = blocks.filter((b) => {
    const sn = normKey(b.sheet);
    if (intent === "leads") return sn.includes("crmdailyleads") || sn.includes("leads") || sn.includes("opportun");
    return sn.includes("followup") || sn.includes("task");
  });
  const candidates = prefer.length ? prefer : blocks;

  for (const block of candidates) {
    const rows = nonEmpty(block.rows);
    if (!rows.length) continue;
    const headers = Object.keys(block.rows[0] || {});
    let kind = sniff(headers);
    if (kind === "unknown") kind = intent; // fall back to the slot's intent
    if (kind === "leads") rows.forEach((r) => leads.push(leadFromRow(r)));
    else rows.forEach((r) => tasks.push(taskFromRow(r)));
  }

  return { leads, tasks };
}

const STAGE_RANK: Record<FunnelStage, number> = {
  Lost: 0,
  New: 1,
  Interested: 2,
  "SV Scheduled": 3,
  "SV Done": 4,
  Closure: 5,
};

/**
 * De-duplicate leads by phone (then email/name). For each unique contact, the
 * row representing their most-advanced funnel stage is flagged isFirst=true so
 * "New Leads" counts unique people and the funnel reflects how far each got.
 */
export function markFirstContacts(leads: ParsedLead[]): ParsedLead[] {
  const keyOf = (l: ParsedLead) =>
    digits(l.phone) || (l.email ?? "").toLowerCase() || `${l.contact ?? ""}|${l.createdDate?.getTime() ?? ""}`;

  const best = new Map<string, ParsedLead>();
  for (const lead of leads) {
    lead.isFirst = false;
    const key = keyOf(lead);
    if (!key) {
      lead.isFirst = true; // can't dedup -> treat as unique
      continue;
    }
    const current = best.get(key);
    if (!current || STAGE_RANK[lead.stage] > STAGE_RANK[current.stage]) {
      best.set(key, lead);
    }
  }
  for (const lead of best.values()) lead.isFirst = true;
  return leads;
}
