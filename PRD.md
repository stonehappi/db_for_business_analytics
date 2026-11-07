# Product Requirements Document (PRD)
## Business Analytics Database Learning & Project Management System

### 1. Overview & Vision
This platform is a specialized teaching and learning management system tailored for **Database Design in Business Analytics**. Unlike generic learning management systems, this platform merges relational database schema design, data modeling (ERD/DDL), and analytical SQL querying into a unified, project-based environment.

A single instructor maintains a single **Master Course Repository** containing all core curriculum, exercises, labs, and capstone projects. The instructor can instantiate and manage multiple class cohorts simultaneously. Each cohort inherits the master content, while student submissions, deadlines, progress tracking, grading, and end-of-term score exports remain strictly cohort-isolated.

---

### 2. Core User Personas
* **Lead Teacher / Instructor**: Authors and updates master course modules, exercises, datasets, and rubric criteria; publishes assignments to active cohorts with custom deadlines; reviews and grades student submissions; finalizes cohorts and exports final gradebooks (CSV/Excel).
* **Teaching Assistant (TA)**: Reviews student submissions, provides line-item feedback on SQL/DDL scripts, and assists in cohort grading.
* **Business Analytics Student**: Enrolled in a specific cohort; learns database concepts through real-world business scenarios; designs schemas, writes migrations, executes queries in an integrated sandbox, and submits project milestones.

---

### 3. Key Architectural Pillars

#### 3.1 Single Master Class with Multi-Cohort Deployment
* The instructor creates and edits master modules, exercises, labs, assignments, and sample solutions in one central repository.
* When launching a new semester or section, the instructor creates a Cohort (e.g., `BA-Fall-2026-A`) and publishes selected master assignments to it with cohort-specific due dates.
* Updates made to master content propagate cleanly to cohort assignments unless a cohort-specific lock is applied.

#### 3.2 Project-Based Learning (PBL) Workflow
* Rather than isolated one-liner syntax questions, assignments are structured as business case studies (e.g., "Designing an E-Commerce Analytics Warehouse", "Modeling SaaS Subscription Churn", "Supply Chain Multi-Warehouse Tracking").
* Each project consists of sequential milestones:
  1. **Milestone 1 - Conceptual & Logical Modeling**: Entity-Relationship specifications and entity dictionaries.
  2. **Milestone 2 - DDL Schema Definition**: Normalized (3NF) relational tables, primary/foreign key constraints, and indexes in PostgreSQL.
  3. **Milestone 3 - Synthetic Data Seeding & ETL**: Inserting representative business records.
  4. **Milestone 4 - Business Analytics Reporting**: Advanced analytical SQL queries (window functions, aggregations, cohort analysis, recursive CTEs).

#### 3.3 Safe In-Browser SQL Execution & Auto-Verification
* Students write and execute PostgreSQL queries directly in an integrated web workspace.
* Queries run against an isolated sandbox database in read-only transactions with strict execution timeouts (3000ms max) and memory ceilings.
* Automated verification tests compare student query results or schema states against the teacher's reference assertions.

#### 3.4 End-of-Cohort Score Calculation & Gradebook Export
* When a class finishes (Week 16), the instructor can lock the cohort (`status = 'completed'`) and review the full cohort gradebook matrix.
* The system automatically calculates weighted totals based on the syllabus weights (Project 1: 15%, Project 2: 15%, Midterm: 20%, Project 3: 15%, Capstone: 20%, Final Exam: 15%) and assigns letter grades (`A`, `B+`, `B`, `C+`, `C`, `D`, `F`).
* Instructors can export the final cohort scores in one click as:
  * **Standard CSV (`.csv`)**: Compatible with university registrar portals, Canvas, Moodle, and Blackboard.
  * **Formatted Excel Workbook (`.xlsx`)**: Contains a summary gradebook sheet, individual assignment breakdowns, and cohort summary statistics (mean, median, standard deviation).

---

### 4. Non-Functional & Design Requirements

#### 4.1 Strict Minimalist Light-Theme UI
* **Color Palette**: Off-white and clean zinc/slate neutral backgrounds (`#FAFAFA`, `#FFFFFF`), subtle 1px border dividers (`#E4E4E7`), high-contrast dark text (`#18181B`).
* **Anti-AI Design Directive**: Avoid generic AI-generated aesthetics: no purple or neon gradients, no glowing borders, no floating abstract blobs, no oversized rounded cards, and no intrusive AI chatbot popups.
* **Information Density**: Clean, dense, utilitarian design inspired by modern developer tooling (Linear, Vercel, Stripe Dashboard). Monospace typography for all code, schema definitions, and tabular data.

#### 4.2 Security & Isolation
* Student queries run under an unprivileged PostgreSQL role (`student_sandbox_user`) with restricted schema creation privileges.
* Prohibited statements (e.g., `DROP DATABASE`, `ALTER SYSTEM`, `COPY FROM PROGRAM`, recursive infinite loops) are blocked and terminated by statement timeouts.
* Application database tables enforce PostgreSQL Row-Level Security (RLS) to guarantee complete data separation between cohorts and students.
