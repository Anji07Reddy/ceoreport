/**
 * Seed realistic Anuhar Homes sample data so the dashboard is demonstrable
 * without a real upload.   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import {
  PROJECTS,
  SOURCES,
  STAFF,
  markFirstContacts,
  normalizeFunnelStage,
  normalizeTaskStatus,
  normalizeTemperature,
  type ParsedLead,
} from "../src/lib/parse";

const prisma = new PrismaClient();

const RAW_STAGES = ["New Lead", "Not interested", "Interested", "Details Shared", "SV Scheduled", "SV Done", "Sale Done", "Not Answered"];
const RAW_STATUS = ["Cold", "Warm", "Hot", "Lost"];

const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
const rand = (n: number) => Math.floor(Math.random() * n);

async function main() {
  await prisma.lead.deleteMany();
  await prisma.task.deleteMany();
  await prisma.upload.deleteMany();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Stable phone pool so de-dup actually merges some repeat contacts.
  const phones = Array.from({ length: 600 }, (_, i) => `+9190000${String(10000 + i)}`);

  for (let dayOffset = 27; dayOffset >= 0; dayOffset--) {
    const reportDate = new Date(today);
    reportDate.setDate(today.getDate() - dayOffset);

    const leadCount = 30 + rand(25);
    const taskCount = 40 + rand(40);

    const parsedLeads: ParsedLead[] = Array.from({ length: leadCount }, () => {
      const rawStage = pick(RAW_STAGES);
      const rawStatus = pick(RAW_STATUS);
      const temperature = normalizeTemperature(rawStatus);
      return {
        contact: `Lead ${1000 + rand(9000)}`,
        phone: pick(phones),
        email: "",
        staff: pick(STAFF),
        source: pick(SOURCES.filter((s) => s !== "Other")),
        project: pick(PROJECTS),
        stage: normalizeFunnelStage(rawStage, temperature),
        rawStage,
        temperature,
        isFirst: true,
        createdDate: reportDate,
      };
    });
    markFirstContacts(parsedLeads);

    const tasks = Array.from({ length: taskCount }, () => {
      const dueDate = new Date(reportDate);
      dueDate.setDate(reportDate.getDate() + rand(7) - 3);
      const statusRaw = pick(["Completed", "Pending", "Completed", "Open"]);
      return {
        title: pick(["Call back lead", "Send brochure", "Schedule site visit", "Follow up", "Confirm booking"]),
        staff: pick(STAFF),
        status: normalizeTaskStatus(statusRaw, dueDate),
        createdDate: reportDate,
        dueDate,
        reportDate,
      };
    });

    await prisma.upload.create({
      data: {
        reportDate,
        leadFileName: `crm-leads-${reportDate.toISOString().slice(0, 10)}.csv`,
        taskFileName: `followup-${reportDate.toISOString().slice(0, 10)}.xlsx`,
        leadCount,
        taskCount,
        leads: {
          create: parsedLeads.map((l) => ({
            contact: l.contact ?? null,
            phone: l.phone ?? null,
            staff: l.staff,
            source: l.source,
            project: l.project,
            stage: l.stage,
            temperature: l.temperature,
            rawStage: l.rawStage ?? null,
            isFirst: l.isFirst,
            createdDate: l.createdDate,
            reportDate,
          })),
        },
        tasks: { create: tasks },
      },
    });
  }
  const uniqueLeads = await prisma.lead.count({ where: { isFirst: true } });
  console.log(`Seeded 28 days. Unique new leads: ${uniqueLeads}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
