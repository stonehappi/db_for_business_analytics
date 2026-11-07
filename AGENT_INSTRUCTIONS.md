# Antigravity AI Agent Implementation Instructions & Playbook

This document serves as the master checklist and execution order for autonomous AI agents implementing the Database Design & Learning System in Antigravity.

---

## 1. Execution Sequence & Dependencies

Execute the following phases in strict sequential order. Do not advance to subsequent phases until verification criteria pass.

```
Phase 1: Environment & PostgreSQL Infrastructure
   │
   ▼
Phase 2: Database Migrations, Gradebook View, RLS & 16-Week Seed Data
   │
   ▼
Phase 3: Sandbox Query Execution Engine, Gradebook & Export APIs
   │
   ▼
Phase 4: Minimalist Light-Theme Web UI, Monaco Editor & Score Export Matrix
   │
   ▼
Phase 5: Automated Verification & E2E Testing
```

---

## 2. Phase-by-Phase Task Breakdown

### Phase 1: Environment & Container Setup
- [ ] Initialize repository structure (`/apps/web`, `/packages/db`, `/packages/sandbox`).
- [ ] Create `docker-compose.yml` with two PostgreSQL services:
  - `postgres-app`: Port 5432, database `app_db`.
  - `postgres-sandbox`: Port 5433, database `sandbox_db`, memory limit 512MB, CPU quota 0.5.
- [ ] Configure environment variables in `.env.example` and `.env.local`.
- [ ] **Verification**: Run `docker compose up -d` and verify both PostgreSQL instances accept connections using `pg_isready`.

### Phase 2: Schema Migrations, Gradebook View & RLS Policies
- [ ] Set up ORM (Drizzle ORM or Prisma) targeting `postgres-app`.
- [ ] Apply the relational schema defined in `DATABASE.md`:
  - `users`, `cohorts`, `cohort_enrollments`.
  - `master_modules`, `master_assignments` (with `weight_percentage`).
  - `cohort_assignments`, `submissions`, `gradebook_export_logs`.
- [ ] Create the `vw_cohort_final_gradebook` SQL view calculating weighted totals and letter grades (`A`, `B+`, `B`, `C+`, `C`, `D`, `F`).
- [ ] Apply PostgreSQL Row-Level Security (RLS) policies as specified.
- [ ] Run seed script inserting the 16-week syllabus (`MASTER_CURRICULUM_16_WEEKS.md`) and the 3 business analytics cases (`CURRICULUM_CASES.md`).
- [ ] **Verification**: Query `master_assignments` and `vw_cohort_final_gradebook` to verify seed data and weighted calculations work accurately.

### Phase 3: Sandbox Engine, Grading & Score Export APIs
- [ ] Implement `packages/sandbox/runner.ts`:
  - Enforce `statement_timeout = '3000ms'`.
  - Enforce `SET TRANSACTION READ ONLY`.
  - Block prohibited commands (`DROP`, `ALTER SYSTEM`, `COPY`, `pg_terminate_backend`).
  - Implement query result parser returning columns, types, rows, and execution time in milliseconds.
- [ ] Implement REST/tRPC API endpoints per `ARCHITECTURE_AND_API.md`:
  - `GET /api/master/modules` & `POST /api/master/assignments`.
  - `GET /api/cohorts` & `POST /api/cohorts/:cohortId/publish`.
  - `POST /api/sandbox/execute`.
  - `POST /api/submissions`.
  - `PATCH /api/submissions/:submissionId/grade`.
  - `POST /api/cohorts/:cohortId/finalize` (locks cohort at end of Week 16 and snapshots final grades).
  - `GET /api/cohorts/:cohortId/scores/export?format=csv|xlsx|json` (generates CSV and 3-tab Excel gradebook workbooks and logs export to `gradebook_export_logs`).
- [ ] **Verification**: Test `/api/cohorts/:cohortId/scores/export?format=csv` and verify valid CSV output with weighted project/exam columns and final letter grades.

### Phase 4: Minimalist Light-Theme Frontend
- [ ] Install Tailwind CSS and configure the color tokens from `FRONTEND_GUIDELINES.md` (neutral zinc `#FAFAFA`, dark text `#18181B`, border `#E4E4E7`).
- [ ] Ensure strict adherence to Anti-AI design rules: no purple gradients, no glowing buttons, no rounded-3xl cards.
- [ ] Implement views:
  1. **Teacher Master Dashboard**:
     - Master Curriculum management (16-week modules & assignment CRUD with grade weights).
     - Cohort publishing modal (select target cohorts and set due dates).
  2. **Student 3-Panel Project Workspace**:
     - Left Panel: Business case narrative, data dictionary, rubric.
     - Top-Right: Monaco SQL editor with auto-complete and keyboard shortcuts (`Cmd+Enter`).
     - Bottom-Right: Query result data grid and automated assertion results.
  3. **Teacher Cohort Gradebook Matrix & Export Toolbar**:
     - Spreadsheet-style gradebook matrix (`tabular-nums`) showing each student's project and exam scores, weighted total, and letter grade.
     - Side-by-side SQL diff and grading drawer.
     - **"Complete Class & Lock Grades"** button and **"Export Final Scores (.CSV / .XLSX)"** dropdown button.
- [ ] **Verification**: Verify responsive rendering in desktop viewports (1440px and 1920px) with 0 layout overflow.

### Phase 5: End-to-End Validation & Final Acceptance
- [ ] Run end-to-end user journey:
  1. Teacher creates/reviews master assignment and publishes it to cohort `BA-2026-FALL-A`.
  2. Student logs in, opens the 3-panel workspace, writes SQL, runs sandbox verification, and submits.
  3. Teacher grades submissions in the grading queue.
  4. Teacher clicks "Complete Class & Lock Grades", then exports the final cohort scores as both `.csv` and `.xlsx`.
- [ ] Verify security guardrails:
  - Injection attempts return clean error messages.
  - Infinite CTE recursion triggers statement timeout without crashing the server.
- [ ] Commit all code with clean, conventional commit messages.
