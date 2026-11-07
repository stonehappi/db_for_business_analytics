# Architecture & API Specification

## 1. Technical Stack Overview

* **Runtime & Framework**: Next.js (App Router, Node.js 20+, TypeScript) or FastAPI (Python 3.11). *Recommended: Next.js + TypeScript for unified type safety across front-end and backend routes.*
* **ORM & Database Client**: Drizzle ORM or Prisma connecting to PostgreSQL via pooled connections (`pg` or `@neondatabase/serverless` / Supabase / standard Postgres pool).
* **Execution Runner**: Node.js worker pool using `pg.Client` to execute isolated queries against the `sandbox_db`.
* **Export & Spreadsheet Engine**: `csv-stringify` (or native RFC 4180 CSV serializer) for `.csv` exports and `exceljs` for multi-sheet `.xlsx` gradebook workbooks.
* **State & Authentication**: Session-based auth or JWT with secure HTTP-only cookies.
* **Code Editor**: Monaco Editor (`@monaco-editor/react`) configured for PostgreSQL syntax highlighting and auto-completion.

---

## 2. SQL Sandbox Execution Architecture

```
[Student Workspace UI]
       │
       ▼ (POST /api/sandbox/execute)
[API Server: Sandbox Runner Service]
       │
       ├─► 1. Pre-Execution Sanitizer (Blocks blacklisted commands: COPY, ALTER SYSTEM, etc.)
       ├─► 2. Acquire sandbox worker client from pool
       ├─► 3. Initialize ephemeral session (SET LOCAL statement_timeout = '3000ms')
       ├─► 4. Run student SQL inside isolated transaction
       ├─► 5. Capture execution stats: execution_time_ms, row_count, column_types
       ├─► 6. Run verification_sql test assertions (diff check or assertion queries)
       │
       ▼ (Returns Result Object)
[Student Workspace: Output Grid & Test Report]
```

---

## 3. Core API Endpoints

### 3.1 Master Curriculum Management (Teacher Role)

#### `GET /api/master/modules`
Returns all master modules and nested assignments.
* **Auth**: Teacher, TA
* **Response `200 OK`**:
```json
[
  {
    "id": "e4b2d180-87ef-4b47-8178-028f8f01b1e0",
    "title": "Module 1: Relational Foundations & Normalization",
    "slug": "m1-relational-foundations",
    "weekNumber": 1,
    "sortOrder": 1,
    "assignments": [
      {
        "id": "c1f2e3d4-1111-4444-8888-000000000001",
        "title": "Project 1: Multi-Vendor Marketplace Relational Model",
        "type": "erd_conceptual",
        "maxScore": 100,
        "weightPercentage": 15.0
      }
    ]
  }
]
```

#### `POST /api/master/assignments`
Creates a new assignment or lab in the master repository.
* **Auth**: Teacher
* **Body**:
```json
{
  "moduleId": "e4b2d180-87ef-4b47-8178-028f8f01b1e0",
  "title": "SaaS Churn Analysis & Window Metrics",
  "slug": "saas-churn-window-metrics",
  "type": "analytics_query",
  "businessCaseMarkdown": "# SaaS Subscription Churn Analysis\n\n...",
  "starterSql": "-- Write your analytical query here\nSELECT ...",
  "solutionSql": "SELECT subscription_id, ...",
  "verificationSql": "SELECT count(*) FROM (...) student_q EXCEPT SELECT count(*) FROM (...) solution_q;",
  "maxScore": 100,
  "weightPercentage": 15.0,
  "rubricCriteria": [
    { "criterion": "Correct partitioning by customer", "points": 30 },
    { "criterion": "Calculation of active MRR", "points": 40 },
    { "criterion": "Churn rate calculation", "points": 30 }
  ]
}
```

---

### 3.2 Cohort Management & Assignment Publishing

#### `GET /api/cohorts`
List cohorts assigned to the authenticated teacher, or the active cohort for an enrolled student.

#### `POST /api/cohorts/:cohortId/publish`
Publishes master assignments to a specific cohort with deadlines.
* **Auth**: Teacher
* **Body**:
```json
{
  "masterAssignmentId": "c1f2e3d4-1111-4444-8888-000000000001",
  "dueAt": "2026-11-20T23:59:59Z",
  "weightOverride": 15.0,
  "isPublished": true
}
```

---

### 3.3 Sandbox Execution & Student Submissions

#### `POST /api/sandbox/execute`
Executes SQL in the sandbox environment without submitting for a final grade.
* **Auth**: Student, Teacher, TA
* **Body**:
```json
{
  "cohortAssignmentId": "3b7f6e12-2222-4444-9999-000000000002",
  "sqlCode": "SELECT customer_id, SUM(order_total) AS ltv FROM orders GROUP BY customer_id ORDER BY ltv DESC LIMIT 5;"
}
```
* **Response `200 OK` (Execution Success)**:
```json
{
  "status": "success",
  "executionTimeMs": 42.8,
  "rowCount": 5,
  "columns": [
    { "name": "customer_id", "type": "int4" },
    { "name": "ltv", "type": "numeric" }
  ],
  "rows": [
    { "customer_id": 1042, "ltv": "4280.50" },
    { "customer_id": 1018, "ltv": "3910.00" }
  ],
  "testResults": {
    "passed": true,
    "scoreEstimate": 100,
    "details": "All row counts and analytical column assertions passed."
  }
}
```
* **Response `200 OK` (Syntax Error / Assertion Fail)**:
```json
{
  "status": "syntax_error",
  "error": "syntax error at or near \"GROP\"",
  "position": 58,
  "executionTimeMs": 3.2
}
```

#### `POST /api/submissions`
Formally submits the final solution for grading.
* **Auth**: Student
* **Body**:
```json
{
  "cohortAssignmentId": "3b7f6e12-2222-4444-9999-000000000002",
  "submittedSql": "SELECT ...",
  "erdDiagramJson": {
    "nodes": [],
    "edges": []
  }
}
```

---

### 3.4 Teacher Grading, Class Completion & Score Export

#### `GET /api/cohorts/:cohortId/grading-queue`
Returns all submissions requiring review, filterable by assignment and status.

#### `PATCH /api/submissions/:submissionId/grade`
Updates the score and manual feedback.
* **Auth**: Teacher, TA
* **Body**:
```json
{
  "finalScore": 95.0,
  "teacherFeedback": "Excellent normalization and index choice on order_date. Watch out for NULL handling in the discount column.",
  "status": "graded"
}
```

#### `POST /api/cohorts/:cohortId/finalize`
Marks the cohort as completed (`status = 'completed'`), locks further student submissions, snapshots each student's `final_weighted_score` and `final_letter_grade` in `cohort_enrollments`, and prepares the final gradebook.
* **Auth**: Teacher
* **Response `200 OK`**:
```json
{
  "cohortId": "a1b2c3d4-0000-1111-2222-333333333333",
  "status": "completed",
  "completedAt": "2026-12-18T17:00:00Z",
  "studentsFinalized": 38,
  "cohortAverage": 84.6
}
```

#### `GET /api/cohorts/:cohortId/scores/export?format=csv|xlsx|json`
Exports the complete cohort gradebook with individual project/exam scores, weighted totals, and final letter grades. Logs the export event in `gradebook_export_logs`.
* **Auth**: Teacher
* **Query Parameters**:
  * `format`: `'csv'` (default), `'xlsx'`, or `'json'`.
* **Response Headers (`format=csv`)**:
  * `Content-Type: text/csv; charset=utf-8`
  * `Content-Disposition: attachment; filename="Gradebook_BA-2026-FALL-A_2026-12-18.csv"`
* **CSV Output Structure**:
```csv
Student_ID,Full_Name,Email,Cohort_Code,Project_1_ERD (15%),Project_2_3NF (15%),Midterm_Exam (20%),Project_3_StarSchema (15%),Capstone_DW (20%),Final_Exam (15%),Weighted_Total (100%),Letter_Grade
STU-2026-001,Sokha Chan,sokha.c@uni.edu,BA-2026-FALL-A,92.00,88.50,85.00,94.00,91.00,89.00,89.63,B+
STU-2026-002,Dara Vong,dara.v@uni.edu,BA-2026-FALL-A,96.00,94.00,91.00,95.00,93.50,92.00,93.45,A
```
* **Excel (`.xlsx`) Output Structure**:
  * **Tab 1 (`Final Summary`)**: Clean tabular report with frozen header row, student ID, name, email, individual weighted contributions, total percentage, and final letter grade.
  * **Tab 2 (`Raw Scores & Timestamps`)**: Unweighted scores (out of 100), submission timestamps, version numbers, and grader feedback per assignment.
  * **Tab 3 (`Cohort Analytics`)**: Summary statistics (Cohort Mean, Median, Min, Max, Standard Deviation, and Grade Distribution count for `A`, `B+`, `B`, `C+`, `C`, `D`, `F`).
