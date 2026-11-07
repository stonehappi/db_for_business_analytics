# Database Specification & PostgreSQL Architecture

## 1. Dual-Database Strategy

The system utilizes two distinct PostgreSQL databases or isolated container instances:

1. **Application Database (`app_db`)**: Stores platform metadata, user authentication, master course curriculum, cohort structures, student submissions, execution logs, teacher grades, and cohort gradebook export logs.
2. **Sandbox Database (`sandbox_db`)**: Dedicated, resource-constrained instance where student SQL queries and schema creation scripts are executed safely in temporary per-session schemas or rollback transactions.

---

## 2. Production Schema DDL (`app_db`)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. Identity & Access Management
-- ============================================================================
CREATE TYPE user_role AS ENUM ('teacher', 'ta', 'student');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id_code VARCHAR(50) UNIQUE,  -- University/Registrar ID (e.g. "STU-2026-0891") for score exports
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_student_code ON users(student_id_code);

-- ============================================================================
-- 2. Cohorts & Enrollments (Classes)
-- ============================================================================
CREATE TYPE cohort_status AS ENUM ('upcoming', 'active', 'completed', 'archived');

CREATE TABLE cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. "BA-2026-FALL-A"
    name VARCHAR(255) NOT NULL,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    term VARCHAR(50) NOT NULL,        -- e.g. "Fall 2026"
    status cohort_status NOT NULL DEFAULT 'active',
    completed_at TIMESTAMPTZ,         -- Timestamp when instructor finalizes the class
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cohorts_teacher ON cohorts(teacher_id);
CREATE INDEX idx_cohorts_code ON cohorts(code);

CREATE TABLE cohort_enrollments (
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    final_weighted_score NUMERIC(5, 2), -- Cached final course percentage upon class completion
    final_letter_grade VARCHAR(5),      -- e.g. "A", "B+", "B", "C+", "C", "D", "F"
    PRIMARY KEY (cohort_id, student_id)
);

CREATE INDEX idx_enrollments_student ON cohort_enrollments(student_id);

-- ============================================================================
-- 3. Master Course Content (Single Source of Truth)
-- ============================================================================
CREATE TABLE master_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    week_number INT NOT NULL DEFAULT 1, -- 1 to 16
    sort_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_master_modules_sort ON master_modules(sort_order);

CREATE TYPE assignment_type AS ENUM (
    'erd_conceptual',     -- Data modeling & dictionary specification
    'ddl_schema',         -- Table creation, FKs, constraints, normal forms
    'seed_transformation',-- Data population & cleaning scripts
    'analytics_query',    -- Window functions, aggregations, reporting queries
    'midterm_exam',       -- Week 8 Midterm Exam
    'capstone_project',   -- Week 15 End-to-end Data Warehouse project
    'final_exam'          -- Week 16 Final Exam
);

CREATE TABLE master_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES master_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    type assignment_type NOT NULL,
    business_case_markdown TEXT NOT NULL,  -- Detailed scenario, business rules, ERD requirements
    starter_sql TEXT,                      -- Starter template provided to student
    solution_sql TEXT,                     -- Teacher's canonical solution
    verification_sql TEXT NOT NULL,        -- Automated SQL test queries / assertions
    max_score NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    weight_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00, -- Contribution to final course grade (sums to 100.00)
    rubric_criteria JSONB NOT NULL DEFAULT '[]'::JSONB, -- Array of { "criterion": string, "points": number }
    sort_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_master_assignments_module ON master_assignments(module_id);

-- ============================================================================
-- 4. Cohort Deployments & Student Submissions
-- ============================================================================
CREATE TABLE cohort_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    master_assignment_id UUID NOT NULL REFERENCES master_assignments(id) ON DELETE CASCADE,
    weight_override NUMERIC(5, 2),       -- Optional cohort-specific weight override
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    available_from TIMESTAMPTZ,
    due_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cohort_id, master_assignment_id)
);

CREATE INDEX idx_cohort_assignments_cohort ON cohort_assignments(cohort_id);

CREATE TYPE submission_status AS ENUM (
    'draft',
    'submitted',
    'syntax_error',
    'verified_pass',
    'verified_fail',
    'graded'
);

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_assignment_id UUID NOT NULL REFERENCES cohort_assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    submitted_sql TEXT NOT NULL,
    erd_diagram_json JSONB,              -- Optional diagram layout nodes and edges
    execution_status submission_status NOT NULL DEFAULT 'draft',
    execution_output JSONB,              -- Query results, execution timing, error messages
    verification_score NUMERIC(5, 2),    -- Automated test score
    final_score NUMERIC(5, 2),           -- Instructor adjusted grade
    teacher_feedback TEXT,
    graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    UNIQUE (cohort_assignment_id, student_id, version)
);

CREATE INDEX idx_submissions_assignment_student ON submissions(cohort_assignment_id, student_id);
CREATE INDEX idx_submissions_status ON submissions(execution_status);

-- ============================================================================
-- 5. Gradebook Aggregation View & Export Audit Log
-- ============================================================================
CREATE TABLE gradebook_export_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    exported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    export_format VARCHAR(10) NOT NULL CHECK (export_format IN ('csv', 'xlsx', 'json')),
    student_count INT NOT NULL,
    exported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SQL View calculating latest score per assignment and weighted final score per student
CREATE OR REPLACE VIEW vw_cohort_final_gradebook AS
WITH latest_submissions AS (
    SELECT DISTINCT ON (cohort_assignment_id, student_id)
        cohort_assignment_id,
        student_id,
        COALESCE(final_score, verification_score, 0.00) AS effective_score,
        execution_status,
        submitted_at,
        graded_at
    FROM submissions
    ORDER BY cohort_assignment_id, student_id, version DESC
),
student_assignment_scores AS (
    SELECT
        ce.cohort_id,
        c.code AS cohort_code,
        c.name AS cohort_name,
        c.term,
        u.id AS student_uuid,
        u.student_id_code,
        u.full_name AS student_name,
        u.email AS student_email,
        ma.id AS master_assignment_id,
        ma.title AS assignment_title,
        ma.slug AS assignment_slug,
        ma.type AS assignment_type,
        ma.max_score,
        COALESCE(ca.weight_override, ma.weight_percentage) AS weight_pct,
        COALESCE(ls.effective_score, 0.00) AS raw_score,
        ROUND(
            (COALESCE(ls.effective_score, 0.00) / NULLIF(ma.max_score, 0)) * COALESCE(ca.weight_override, ma.weight_percentage),
            2
        ) AS weighted_points
    FROM cohort_enrollments ce
    JOIN cohorts c ON ce.cohort_id = c.id
    JOIN users u ON ce.student_id = u.id
    JOIN cohort_assignments ca ON ca.cohort_id = c.id AND ca.is_published = TRUE
    JOIN master_assignments ma ON ca.master_assignment_id = ma.id
    LEFT JOIN latest_submissions ls
        ON ls.cohort_assignment_id = ca.id AND ls.student_id = u.id
)
SELECT
    cohort_id,
    cohort_code,
    cohort_name,
    term,
    student_uuid,
    student_id_code,
    student_name,
    student_email,
    JSONB_OBJECT_AGG(
        assignment_slug,
        JSONB_BUILD_OBJECT(
            'title', assignment_title,
            'raw_score', raw_score,
            'max_score', max_score,
            'weight_pct', weight_pct,
            'weighted_points', weighted_points
        )
    ) AS assignment_breakdown,
    ROUND(SUM(weighted_points), 2) AS total_weighted_score,
    CASE
        WHEN SUM(weighted_points) >= 90.00 THEN 'A'
        WHEN SUM(weighted_points) >= 85.00 THEN 'B+'
        WHEN SUM(weighted_points) >= 80.00 THEN 'B'
        WHEN SUM(weighted_points) >= 75.00 THEN 'C+'
        WHEN SUM(weighted_points) >= 70.00 THEN 'C'
        WHEN SUM(weighted_points) >= 60.00 THEN 'D'
        ELSE 'F'
    END AS letter_grade
FROM student_assignment_scores
GROUP BY
    cohort_id, cohort_code, cohort_name, term,
    student_uuid, student_id_code, student_name, student_email;
```

---

## 3. Sandbox Database Security & Isolation

To safely execute arbitrary student SQL queries without security risks:

1. **Unprivileged Role**:
```sql
CREATE ROLE student_sandbox_user WITH LOGIN PASSWORD 'sandbox_safe_pw' NOSUPERUSER NOCREATEDB NOCREATEROLE;
```

2. **Per-Execution Isolation Mechanism**:
Every query executed via the sandbox runner runs inside a transaction block with strict resource parameters:
```sql
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '3000ms';
SET LOCAL work_mem = '16MB';
SET LOCAL search_path = public;

-- Student query is executed here
SELECT ...

ROLLBACK; -- Always roll back to guarantee clean state
```

3. **DDL Schema Verification Sessions**:
When an assignment requires creating tables (`CREATE TABLE`, `ALTER TABLE`):
* The engine creates a temporary schema: `CREATE SCHEMA temp_session_<session_id>;`
* The student's DDL runs inside that schema.
* The test verification queries inspect `information_schema.tables`, `information_schema.columns`, and foreign key constraints.
* The session schema is dropped immediately upon completion: `DROP SCHEMA temp_session_<session_id> CASCADE;`.

---

## 4. Row-Level Security (RLS) Policies

```sql
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gradebook_export_logs ENABLE ROW LEVEL SECURITY;

-- Cohort visibility
CREATE POLICY cohort_teacher_access ON cohorts
    FOR ALL USING (teacher_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY cohort_student_access ON cohorts
    FOR SELECT USING (
        id IN (SELECT cohort_id FROM cohort_enrollments WHERE student_id = current_setting('app.current_user_id')::UUID)
    );

-- Submissions access
CREATE POLICY student_own_submissions ON submissions
    FOR ALL USING (student_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY teacher_cohort_submissions ON submissions
    FOR ALL USING (
        cohort_assignment_id IN (
            SELECT ca.id FROM cohort_assignments ca
            JOIN cohorts c ON ca.cohort_id = c.id
            WHERE c.teacher_id = current_setting('app.current_user_id')::UUID
        )
    );

-- Gradebook export audit log access
CREATE POLICY teacher_export_logs_access ON gradebook_export_logs
    FOR ALL USING (
        cohort_id IN (
            SELECT id FROM cohorts WHERE teacher_id = current_setting('app.current_user_id')::UUID
        )
    );
```
