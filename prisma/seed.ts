/**
 * Seed the database with a few days of realistic sample CRM data so the
 * dashboard is demonstrable without a real upload.
 *
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { normalizeStage, normalizeTaskStatus } from "../src/lib/parse";

const prisma = new PrismaClient();

const PROJECTS = ["Skyline Towers", "Green Valley", "Lake View", "Metro Heights"];
const SOURCES = ["Facebook", "Google Ads", "Walk-in", "Referral", "Website", "99acres"];
const STAFF = ["Aarav Sharma", "Priya Patel", "Rohan Mehta", "Sneha Iyer", "Vikram Rao"];
const STAGES = ["New", "Warm", "Cold", "Site Visit", "Won", "Lost"];
const TASK_TITLES = [
  "Call back lead",
  "Send brochure",
  "Schedule site visit",
  "Follow up on quotation",
  "Confirm booking",
  "Share floor plan",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  // Clear existing data for a clean seed.
  await prisma.opportunity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.upload.deleteMany();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const reportDate = new Date(today);
    reportDate.setDate(today.getDate() - dayOffset);

    const oppCount = 20 + Math.floor(Math.random() * 20);
    const taskCount = 15 + Math.floor(Math.random() * 15);

    const opportunities = Array.from({ length: oppCount }, () => {
      const stageRaw = pick(STAGES);
      const stage = normalizeStage(stageRaw);
      return {
        name: `Lead ${Math.floor(Math.random() * 9000) + 1000}`,
        project: pick(PROJECTS),
        source: pick(SOURCES),
        stage,
        assignedTo: pick(STAFF),
        status: stageRaw,
        value: Math.floor(Math.random() * 50) * 100000,
        siteVisit: stage === "Site Visit" || Math.random() > 0.7,
        createdDate: reportDate,
        reportDate,
      };
    });

    const tasks = Array.from({ length: taskCount }, () => {
      const dueDate = new Date(reportDate);
      dueDate.setDate(reportDate.getDate() + Math.floor(Math.random() * 7) - 3);
      const statusRaw = pick(["Completed", "Pending", "Open", "Overdue"]);
      return {
        title: pick(TASK_TITLES),
        project: pick(PROJECTS),
        assignedTo: pick(STAFF),
        status: normalizeTaskStatus(statusRaw, dueDate),
        dueDate,
        createdDate: reportDate,
        reportDate,
      };
    });

    await prisma.upload.create({
      data: {
        reportDate,
        oppFileName: `opportunities-${reportDate.toISOString().slice(0, 10)}.csv`,
        taskFileName: `tasks-${reportDate.toISOString().slice(0, 10)}.xlsx`,
        oppCount,
        taskCount,
        opportunities: { create: opportunities },
        tasks: { create: tasks },
      },
    });

    console.log(`Seeded ${reportDate.toISOString().slice(0, 10)}: ${oppCount} opps, ${taskCount} tasks`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
