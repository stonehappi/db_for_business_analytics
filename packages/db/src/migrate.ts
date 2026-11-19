import { appPool } from './client';

export async function runMigrations() {
  const client = await appPool.connect();
  try {
    console.log('[MIGRATION] Starting schema migration on app_db...');

    await client.query('BEGIN;');

    // Acquire transaction-level advisory lock to prevent concurrent migrations during multi-replica starts
    await client.query('SELECT pg_advisory_xact_lock(982347102);');

    // Enable extensions
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // Create ENUM types if not exist
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          CREATE TYPE user_role AS ENUM ('teacher', 'ta', 'student');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cohort_status') THEN
          CREATE TYPE cohort_status AS ENUM ('upcoming', 'active', 'completed', 'archived');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_type') THEN
          CREATE TYPE assignment_type AS ENUM (
            'erd_conceptual',
            'ddl_schema',
            'seed_transformation',
            'analytics_query',
            'python_analytics',
            'python_modeling',
            'hybrid_sql_python',
            'midterm_exam',
            'capstone_project',
            'final_exam'
          );
        ELSE
          ALTER TYPE assignment_type ADD VALUE IF NOT EXISTS 'python_analytics';
          ALTER TYPE assignment_type ADD VALUE IF NOT EXISTS 'python_modeling';
          ALTER TYPE assignment_type ADD VALUE IF NOT EXISTS 'hybrid_sql_python';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
          CREATE TYPE submission_status AS ENUM (
            'draft',
            'submitted',
            'syntax_error',
            'verified_pass',
            'verified_fail',
            'graded'
          );
        END IF;
      END $$;
    `);

    // 1. Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id_code VARCHAR(50) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        full_name VARCHAR(255) NOT NULL,
        role user_role NOT NULL DEFAULT 'student',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_student_code ON users(student_id_code);
    `);

    // 2. Master Courses table (Teacher has many Master Courses)
    await client.query(`
      CREATE TABLE IF NOT EXISTS master_courses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_master_courses_teacher ON master_courses(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_master_courses_code ON master_courses(code);
    `);

    // 3. Cohorts / Classes table (Each Course has many Classes each Semester / Term)
    await client.query(`
      CREATE TABLE IF NOT EXISTS cohorts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id UUID REFERENCES master_courses(id) ON DELETE CASCADE,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        term VARCHAR(50) NOT NULL,
        status cohort_status NOT NULL DEFAULT 'active',
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES master_courses(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_cohorts_course ON cohorts(course_id);
      CREATE INDEX IF NOT EXISTS idx_cohorts_teacher ON cohorts(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_cohorts_code ON cohorts(code);
    `);

    // Cohort enrollments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cohort_enrollments (
        cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        final_weighted_score NUMERIC(5, 2),
        final_letter_grade VARCHAR(5),
        PRIMARY KEY (cohort_id, student_id)
      );
      CREATE INDEX IF NOT EXISTS idx_enrollments_student ON cohort_enrollments(student_id);
    `);

    // 4. Master Modules (Belongs to a specific Master Course)
    await client.query(`
      CREATE TABLE IF NOT EXISTS master_modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id UUID REFERENCES master_courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        week_number INT NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE master_modules ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES master_courses(id) ON DELETE CASCADE;
      ALTER TABLE master_modules ADD COLUMN IF NOT EXISTS lecture_slides_html TEXT;
      ALTER TABLE master_modules ADD COLUMN IF NOT EXISTS quiz_data JSONB DEFAULT '[]'::JSONB;
      CREATE INDEX IF NOT EXISTS idx_master_modules_course ON master_modules(course_id);
      CREATE INDEX IF NOT EXISTS idx_master_modules_sort ON master_modules(sort_order);
    `);

    // Quiz Submissions Table (Records student quiz results per module)
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        module_id UUID NOT NULL REFERENCES master_modules(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
        score NUMERIC(5, 2) NOT NULL,
        max_score NUMERIC(5, 2) NOT NULL,
        answers JSONB NOT NULL DEFAULT '[]'::JSONB,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(module_id, student_id)
      );
      CREATE INDEX IF NOT EXISTS idx_quiz_submissions_module ON quiz_submissions(module_id);
      CREATE INDEX IF NOT EXISTS idx_quiz_submissions_student ON quiz_submissions(student_id);
    `);

    // Master Assignments
    await client.query(`
      CREATE TABLE IF NOT EXISTS master_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        module_id UUID NOT NULL REFERENCES master_modules(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        type assignment_type NOT NULL,
        language VARCHAR(20) NOT NULL DEFAULT 'sql',
        business_case_markdown TEXT NOT NULL,
        starter_sql TEXT,
        solution_sql TEXT,
        verification_sql TEXT,
        starter_python TEXT,
        solution_python TEXT,
        verification_python TEXT,
        dataset_config JSONB DEFAULT '{}'::JSONB,
        max_score NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
        weight_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
        rubric_criteria JSONB NOT NULL DEFAULT '[]'::JSONB,
        sort_order INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE master_assignments ADD COLUMN IF NOT EXISTS language VARCHAR(20) NOT NULL DEFAULT 'sql';
      ALTER TABLE master_assignments ADD COLUMN IF NOT EXISTS starter_python TEXT;
      ALTER TABLE master_assignments ADD COLUMN IF NOT EXISTS solution_python TEXT;
      ALTER TABLE master_assignments ADD COLUMN IF NOT EXISTS verification_python TEXT;
      ALTER TABLE master_assignments ADD COLUMN IF NOT EXISTS dataset_config JSONB DEFAULT '{}'::JSONB;
      ALTER TABLE master_assignments ALTER COLUMN verification_sql DROP NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_master_assignments_module ON master_assignments(module_id);
      CREATE INDEX IF NOT EXISTS idx_master_assignments_language ON master_assignments(language);
    `);

    // 4. Cohort Assignments
    await client.query(`
      CREATE TABLE IF NOT EXISTS cohort_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
        master_assignment_id UUID NOT NULL REFERENCES master_assignments(id) ON DELETE CASCADE,
        weight_override NUMERIC(5, 2),
        is_published BOOLEAN NOT NULL DEFAULT FALSE,
        available_from TIMESTAMPTZ,
        due_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (cohort_id, master_assignment_id)
      );
      CREATE INDEX IF NOT EXISTS idx_cohort_assignments_cohort ON cohort_assignments(cohort_id);
    `);

    // Submissions
    await client.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cohort_assignment_id UUID NOT NULL REFERENCES cohort_assignments(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        version INT NOT NULL DEFAULT 1,
        submitted_sql TEXT,
        submitted_python TEXT,
        erd_diagram_json JSONB,
        execution_status submission_status NOT NULL DEFAULT 'draft',
        execution_output JSONB,
        execution_artifacts JSONB DEFAULT '{}'::JSONB,
        verification_score NUMERIC(5, 2),
        final_score NUMERIC(5, 2),
        teacher_feedback TEXT,
        graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        graded_at TIMESTAMPTZ,
        UNIQUE (cohort_assignment_id, student_id, version)
      );
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submitted_python TEXT;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS execution_artifacts JSONB DEFAULT '{}'::JSONB;
      ALTER TABLE submissions ALTER COLUMN submitted_sql DROP NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_submissions_assignment_student ON submissions(cohort_assignment_id, student_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(execution_status);
    `);

    // 5. Gradebook Export Logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS gradebook_export_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
        exported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        export_format VARCHAR(10) NOT NULL CHECK (export_format IN ('csv', 'xlsx', 'json')),
        student_count INT NOT NULL,
        exported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // SQL View: vw_cohort_final_gradebook
    await client.query(`DROP VIEW IF EXISTS vw_cohort_final_gradebook CASCADE;`);
    await client.query(`
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
              c.course_id,
              mc.code AS course_code,
              mc.title AS course_title,
              c.code AS cohort_code,
              c.name AS cohort_name,
              c.term,
              u.id AS student_uuid,
              u.student_id_code,
              u.full_name AS student_name,
              u.email AS student_email,
              ma.id AS master_assignment_id,
              ca.id AS cohort_assignment_id,
              ma.title AS assignment_title,
              ma.slug AS assignment_slug,
              ma.type AS assignment_type,
              ma.max_score,
              COALESCE(ca.weight_override, ma.weight_percentage) AS weight_pct,
              COALESCE(ls.effective_score, 0.00) AS raw_score,
              ROUND(
                  (COALESCE(ls.effective_score, 0.00) / NULLIF(ma.max_score, 0)) * COALESCE(ca.weight_override, ma.weight_percentage),
                  2
              ) AS weighted_points,
              ls.execution_status,
              ls.submitted_at,
              ls.graded_at
          FROM cohort_enrollments ce
          JOIN cohorts c ON ce.cohort_id = c.id
          LEFT JOIN master_courses mc ON c.course_id = mc.id
          JOIN users u ON ce.student_id = u.id
          JOIN cohort_assignments ca ON ca.cohort_id = c.id AND ca.is_published = TRUE
          JOIN master_assignments ma ON ca.master_assignment_id = ma.id
          LEFT JOIN latest_submissions ls
              ON ls.cohort_assignment_id = ca.id AND ls.student_id = u.id
      )
      SELECT
          cohort_id,
          course_id,
          course_code,
          course_title,
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
                  'cohort_assignment_id', cohort_assignment_id,
                  'title', assignment_title,
                  'raw_score', raw_score,
                  'max_score', max_score,
                  'weight_pct', weight_pct,
                  'weighted_points', weighted_points,
                  'execution_status', execution_status,
                  'submitted_at', submitted_at,
                  'graded_at', graded_at
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
          cohort_id, course_id, course_code, course_title, cohort_code, cohort_name, term,
          student_uuid, student_id_code, student_name, student_email;
    `);

    await client.query('COMMIT;');
    console.log('[MIGRATION] Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK;');
    console.error('[MIGRATION] Error running migration:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
