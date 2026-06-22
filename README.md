# CRM Performance Dashboard

A full-stack daily CRM reporting dashboard built entirely on **Next.js** (App
Router) — no separate backend. Upload an **Opportunities CSV** and a **Tasks
Excel** file each day; the app cleans, validates, stores, and turns them into an
executive-ready performance dashboard with filters, charts, and PDF/Excel export.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **API Routes** for upload, dashboard data, and export (Next.js backend only)
- **Tailwind CSS** + **shadcn-style UI** components (Radix primitives)
- **Recharts** for charts
- **PapaParse** (CSV) + **SheetJS / XLSX** (Excel) for parsing
- **Prisma** + **SQLite** (swap to PostgreSQL by editing `prisma/schema.prisma`)
- **jsPDF** (PDF export) + **XLSX** (Excel export)

## Features

1. **Upload page** — drag & drop Opportunities `.csv` and Tasks `.xlsx`, pick a report date.
2. **Auto parsing & validation** — fuzzy header detection, date/number cleaning, value normalization.
3. **Daily snapshots** — each upload is stored as a dated `Upload` with its rows.
4. **Filters** — date range, project, assigned staff, source, lead stage, task status.
5. **Executive overview cards** — total / new / warm / cold leads, site visits, completed / pending / overdue tasks.
6. **Project-wise report**
7. **Staff-wise performance report**
8. **Source-wise lead quality report** (weighted quality score)
9. **Daily follow-up report** (pending + overdue tasks, soonest due first)
10. **Charts** — lead-stage pie, source bar, staff performance, task-status donut, daily trend line.
11. **Export** — PDF (client, jsPDF) and Excel (server, multi-sheet workbook), both filter-aware.
12. **Clean, responsive admin UI** for desktop and mobile.

## Getting started

```bash
npm install            # install dependencies (also runs prisma generate)
npm run db:push        # create the SQLite schema (dev.db)
npm run db:seed        # OPTIONAL: load 7 days of sample data
npm run dev            # http://localhost:3000
```

Production:

```bash
npm run build
npm run start
```

## Project structure

```
prisma/
  schema.prisma            # Upload / Opportunity / Task models
  seed.ts                  # sample data generator
src/
  app/
    layout.tsx             # app shell + nav
    page.tsx               # landing / stats
    upload/page.tsx        # file upload UI
    dashboard/page.tsx     # dashboard route
    api/
      upload/route.ts      # POST: parse + store daily files
      dashboard/route.ts   # GET:  filtered dashboard data
      export/route.ts      # GET:  Excel workbook export
  components/
    ui/                    # shadcn-style primitives (button, card, select, ...)
    dashboard/
      dashboard-client.tsx # orchestrates filters, charts, tables, export
      kpi-cards.tsx        # executive overview cards
      filter-bar.tsx       # filter controls
      charts.tsx           # Recharts components
      report-tables.tsx    # project / staff / source / follow-up tables
  lib/
    prisma.ts              # Prisma client singleton
    parse.ts               # CSV/XLSX parsing + normalization
    dashboard.ts           # aggregation / report builder
    pdf.ts                 # client-side PDF export
    types.ts               # shared data contracts
    utils.ts               # formatting helpers
```

## Expected columns (auto-detected)

Headers are matched fuzzily, so common variants work.

**Opportunities CSV:** Name/Customer, Project, Source/Lead Source, Lead
Stage/Status (New, Warm, Cold, Site Visit, Won, Lost), Assigned To/Staff,
Created Date, Deal Value.

**Tasks XLSX:** Task/Title, Project, Assigned To/Staff, Status (Completed,
Pending, Overdue), Due Date. Pending tasks past their due date are
auto-flagged as overdue.

## Switching to PostgreSQL

1. In `prisma/schema.prisma` set `provider = "postgresql"`.
2. Set `DATABASE_URL` in `.env` to your Postgres connection string.
3. Run `npm run db:push`.
