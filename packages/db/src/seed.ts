import { appPool, sandboxAdminPool } from './client';
import bcrypt from 'bcryptjs';
import { weeklyCurriculum } from './curriculumContent';

export async function runSeed() {
  console.log('[SEED] Starting seed script...');
  const client = await appPool.connect();
  const sandboxClient = await sandboxAdminPool.connect();

  try {
    await client.query('BEGIN;');

    // 1. Seed Users
    console.log('[SEED] Seeding users with hashed passwords...');
    const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);
    const users = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        studentIdCode: null,
        email: 'prof.smith@uni.edu',
        fullName: 'Professor Alan Smith',
        role: 'teacher'
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        studentIdCode: null,
        email: 'ta.sarah@uni.edu',
        fullName: 'Sarah Jenkins (TA)',
        role: 'ta'
      },
      {
        id: '00000000-0000-0000-0000-000000000011',
        studentIdCode: 'STU-2026-001',
        email: 'sokha.c@uni.edu',
        fullName: 'Sokha Chan',
        role: 'student'
      },
      {
        id: '00000000-0000-0000-0000-000000000012',
        studentIdCode: 'STU-2026-002',
        email: 'dara.v@uni.edu',
        fullName: 'Dara Vong',
        role: 'student'
      },
      {
        id: '00000000-0000-0000-0000-000000000013',
        studentIdCode: 'STU-2026-003',
        email: 'maria.g@uni.edu',
        fullName: 'Maria Garcia',
        role: 'student'
      },
      {
        id: '00000000-0000-0000-0000-000000000014',
        studentIdCode: 'STU-2026-004',
        email: 'liam.j@uni.edu',
        fullName: 'Liam Johnson',
        role: 'student'
      },
      {
        id: '00000000-0000-0000-0000-000000000015',
        studentIdCode: 'STU-2026-005',
        email: 'wei.z@uni.edu',
        fullName: 'Wei Zhang',
        role: 'student'
      }
    ];

    for (const u of users) {
      await client.query(`
        INSERT INTO users (id, student_id_code, email, password_hash, full_name, role)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          student_id_code = EXCLUDED.student_id_code,
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role;
      `, [u.id, u.studentIdCode, u.email, defaultPasswordHash, u.fullName, u.role]);
    }

    // 2. Seed Master Courses (Teacher has many Master Courses)
    console.log('[SEED] Seeding master courses...');
    const teacherId = '00000000-0000-0000-0000-000000000001';
    const courses = [
      {
        id: '11111111-0000-0000-0000-000000000001',
        code: 'BA-101',
        title: 'Relational Database Design & SQL for Business Analytics',
        description: 'Comprehensive 16-week foundational curriculum covering conceptual ERDs, 3NF normalization, and analytical SQL reporting.',
        teacherId: teacherId,
      },
      {
        id: '11111111-0000-0000-0000-000000000002',
        code: 'BA-201',
        title: 'Data Warehousing & Dimensional BI Modeling',
        description: 'Dimensional modeling, star and snowflake schemas, slowly changing dimensions (SCD Type 2), and reporting marts.',
        teacherId: teacherId,
      },
      {
        id: '11111111-0000-0000-0000-000000000003',
        code: 'BA-301',
        title: 'Advanced Analytical SQL & Real-Time Performance',
        description: 'Analytical window functions, cohort retention waterfalls, recursive CTEs, and PostgreSQL performance tuning.',
        teacherId: teacherId,
      },
    ];

    for (const c of courses) {
      await client.query(`
        INSERT INTO master_courses (id, code, title, description, teacher_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          code = EXCLUDED.code,
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          teacher_id = EXCLUDED.teacher_id;
      `, [c.id, c.code, c.title, c.description, c.teacherId]);
    }

    // 3. Seed Cohorts / Classes (Each Course has many Classes each Semester / Term)
    console.log('[SEED] Seeding classes across semesters...');
    const defaultCohortId = 'a1b2c3d4-0000-1111-2222-333333333333';
    const cohortId = defaultCohortId;
    const cohorts = [
      {
        id: defaultCohortId,
        courseId: '11111111-0000-0000-0000-000000000001', // BA-101
        code: 'BA-2026-FALL-A',
        name: 'BA-101 Section A (Morning)',
        term: 'Fall 2026',
        status: 'active',
      },
      {
        id: 'a1b2c3d4-0000-1111-2222-444444444444',
        courseId: '11111111-0000-0000-0000-000000000001', // BA-101
        code: 'BA-2026-FALL-B',
        name: 'BA-101 Section B (Evening)',
        term: 'Fall 2026',
        status: 'active',
      },
      {
        id: 'a1b2c3d4-0000-1111-2222-555555555555',
        courseId: '11111111-0000-0000-0000-000000000001', // BA-101
        code: 'BA-2027-SPRING-A',
        name: 'BA-101 Section A (Spring)',
        term: 'Spring 2027',
        status: 'upcoming',
      },
      {
        id: 'a1b2c3d4-0000-1111-2222-666666666666',
        courseId: '11111111-0000-0000-0000-000000000002', // BA-201
        code: 'DW-2026-FALL-A',
        name: 'BA-201 Data Warehouse Section',
        term: 'Fall 2026',
        status: 'active',
      },
      {
        id: 'a1b2c3d4-0000-1111-2222-777777777777',
        courseId: '11111111-0000-0000-0000-000000000003', // BA-301
        code: 'SQL-2026-FALL-A',
        name: 'BA-301 Advanced Analytics Lab',
        term: 'Fall 2026',
        status: 'active',
      },
    ];

    for (const ch of cohorts) {
      await client.query(`
        INSERT INTO cohorts (id, course_id, code, name, teacher_id, term, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          course_id = EXCLUDED.course_id,
          code = EXCLUDED.code,
          name = EXCLUDED.name,
          teacher_id = EXCLUDED.teacher_id,
          term = EXCLUDED.term,
          status = EXCLUDED.status;
      `, [ch.id, ch.courseId, ch.code, ch.name, teacherId, ch.term, ch.status]);
    }

    // Cohort Enrollments
    for (const u of users.filter(usr => usr.role === 'student')) {
      await client.query(`
        INSERT INTO cohort_enrollments (cohort_id, student_id)
        VALUES ($1, $2)
        ON CONFLICT (cohort_id, student_id) DO NOTHING;
      `, [defaultCohortId, u.id]);

      // Enroll some students into Section B and DW course as well
      await client.query(`
        INSERT INTO cohort_enrollments (cohort_id, student_id)
        VALUES ($1, $2)
        ON CONFLICT (cohort_id, student_id) DO NOTHING;
      `, ['a1b2c3d4-0000-1111-2222-666666666666', u.id]);
    }

    // 4. Seed 16-Week Master Modules
    console.log('[SEED] Seeding 16-week master modules for BA-101 with lecture slides & quiz data...');
    const ba101CourseId = '11111111-0000-0000-0000-000000000001';
    const moduleMap: Record<number, string> = {};

    for (const m of weeklyCurriculum) {
      const res = await client.query(`
        INSERT INTO master_modules (
          course_id, title, slug, description, week_number, sort_order, lecture_slides_html, quiz_data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (slug) DO UPDATE SET
          course_id = EXCLUDED.course_id,
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          week_number = EXCLUDED.week_number,
          sort_order = EXCLUDED.sort_order,
          lecture_slides_html = EXCLUDED.lecture_slides_html,
          quiz_data = EXCLUDED.quiz_data
        RETURNING id;
      `, [ba101CourseId, m.title, m.slug, m.desc, m.num, m.num, m.lectureSlidesHtml, JSON.stringify(m.quizData)]);
      moduleMap[m.num] = res.rows[0].id;
    }

    // Seed modules for BA-201 (Data Warehousing)
    const dwModules = [
      { num: 1, title: 'Module 1: Dimensional Modeling & Fact Table Grain', slug: 'dw-m1-dimensional-modeling', desc: 'Kimball dimensional lifecycle, fact tables vs dimension tables' },
      { num: 2, title: 'Module 2: Slowly Changing Dimensions & Star Schemas', slug: 'dw-m2-scd-star-schemas', desc: 'Type 1, Type 2, Type 3 SCDs and Kimball conformities' },
    ];
    for (const dm of dwModules) {
      await client.query(`
        INSERT INTO master_modules (course_id, title, slug, description, week_number, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (slug) DO UPDATE SET
          course_id = EXCLUDED.course_id,
          title = EXCLUDED.title,
          description = EXCLUDED.description;
      `, ['11111111-0000-0000-0000-000000000002', dm.title, dm.slug, dm.desc, dm.num, dm.num]);
    }

    // 4. Seed Master Assignments
    console.log('[SEED] Seeding master assignments...');
    const assignments = [
      {
        id: 'c1f2e3d4-1111-4444-8888-000000000001',
        weekNum: 3,
        title: 'Project 1: Multi-Vendor Marketplace Relational Model',
        slug: 'project-1-marketplace-model',
        type: 'erd_conceptual',
        maxScore: 100,
        weightPercentage: 15.0,
        businessCase: `# Project 1: E-Commerce Customer Analytics & Retention Engine

### Business Context
"OmniRetail" operates a multi-category online store. The marketing team requires an overhaul of their database to stop transaction anomalies, prevent redundant customer records, and calculate Customer Lifetime Value (CLV) and Monthly Active Buyers.

### Milestones & Tasks
1. **Schema Normalization (3NF)**:
   - Identify candidate keys and eliminate partial/transitive dependencies.
   - Design normalized tables: \`customers\`, \`products\`, \`orders\`, and \`order_items\`.
2. **Analytical SQL Querying**:
   - Write an analytical query calculating total revenue per customer, order count, and RFM quintile ranking using \`NTILE(5)\`.
`,
        starterSql: `-- Project 1: OmniRetail Customer RFM & Lifetime Value Query
-- Calculate: customer_id, total_spend, order_count, rfm_score
SELECT
    c.id AS customer_id,
    COALESCE(SUM(oi.quantity * (oi.unit_price - oi.discount)), 0) AS total_spend,
    COUNT(DISTINCT o.id) AS order_count,
    NTILE(5) OVER (ORDER BY COALESCE(SUM(oi.quantity * (oi.unit_price - oi.discount)), 0) DESC) AS rfm_score
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY c.id
ORDER BY total_spend DESC;
`,
        solutionSql: `SELECT
    c.id AS customer_id,
    COALESCE(SUM(oi.quantity * (oi.unit_price - oi.discount)), 0) AS total_spend,
    COUNT(DISTINCT o.id) AS order_count,
    NTILE(5) OVER (ORDER BY COALESCE(SUM(oi.quantity * (oi.unit_price - oi.discount)), 0) DESC) AS rfm_score
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY c.id
ORDER BY total_spend DESC;`,
        verificationSql: `SELECT COUNT(*) AS mismatch_count FROM (
  SELECT customer_id, total_spend, order_count, rfm_score FROM (
    {{STUDENT_SQL}}
  ) s
  EXCEPT
  SELECT customer_id, total_spend, order_count, rfm_score FROM (
    SELECT
        c.id AS customer_id,
        COALESCE(SUM(oi.quantity * (oi.unit_price - oi.discount)), 0) AS total_spend,
        COUNT(DISTINCT o.id) AS order_count,
        NTILE(5) OVER (ORDER BY COALESCE(SUM(oi.quantity * (oi.unit_price - oi.discount)), 0) DESC) AS rfm_score
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    GROUP BY c.id
  ) ref
) diff;`,
        rubric: [
          { criterion: 'Relational 3NF Schema & Foreign Key Constraints', points: 40 },
          { criterion: 'Customer Lifetime Value (total_spend) & Order Counts', points: 30 },
          { criterion: 'RFM Quintile Ranking with NTILE(5)', points: 30 }
        ]
      },
      {
        id: 'c1f2e3d4-2222-4444-8888-000000000002',
        weekNum: 6,
        title: 'Project 2: Legacy ERP Normalization to 3NF & PostgreSQL DDL',
        slug: 'project-2-legacy-erp-3nf',
        type: 'ddl_schema',
        maxScore: 100,
        weightPercentage: 15.0,
        businessCase: `# Project 2: B2B SaaS Recurring Revenue & Churn Intelligence

### Business Context
"CloudMetrics Inc." provides an enterprise analytics subscription. Leadership needs an accurate recurring revenue database to track Monthly Recurring Revenue (MRR), plan upgrades, downgrades, and subscriber churn.

### Tasks
- Model temporal subscription states across \`accounts\`, \`plans\`, \`subscriptions\`, and \`subscription_events\`.
- Write an event-sourced SQL query calculating Net Revenue Retention and active subscription counts.
`,
        starterSql: `-- Project 2: SaaS MRR and Active Subscription Analysis
SELECT
    p.plan_name,
    COUNT(s.id) AS active_subs,
    SUM(p.monthly_price) AS total_mrr
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
GROUP BY p.plan_name
ORDER BY total_mrr DESC;
`,
        solutionSql: `SELECT
    p.plan_name,
    COUNT(s.id) AS active_subs,
    SUM(p.monthly_price) AS total_mrr
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
GROUP BY p.plan_name
ORDER BY total_mrr DESC;`,
        verificationSql: `SELECT COUNT(*) AS mismatch_count FROM (
  SELECT plan_name, active_subs, total_mrr FROM (
    {{STUDENT_SQL}}
  ) s
  EXCEPT
  SELECT plan_name, active_subs, total_mrr FROM (
    SELECT
        p.plan_name,
        COUNT(s.id) AS active_subs,
        SUM(p.monthly_price) AS total_mrr
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.status = 'active'
    GROUP BY p.plan_name
  ) ref
) diff;`,
        rubric: [
          { criterion: 'Decomposition of Functional Dependencies to 3NF', points: 35 },
          { criterion: 'Event-Sourced Subscription Temporal Schema', points: 35 },
          { criterion: 'Accurate MRR Calculation per Subscription Plan', points: 30 }
        ]
      },
      {
        id: 'c1f2e3d4-3333-4444-8888-000000000003',
        weekNum: 8,
        title: 'Midterm Exam: Practical Schema Modeling & Analytical SQL Defense',
        slug: 'midterm-exam-modeling-defense',
        type: 'midterm_exam',
        maxScore: 100,
        weightPercentage: 20.0,
        businessCase: `# Midterm Exam: Comprehensive Schema Modeling & Analytics

### Part 1: Theory & Cardinality
Identify functional dependency violations and decompose into Boyce-Codd Normal Form.

### Part 2: Practical Analytical Query
Write a high-performance query evaluating multi-table aggregations, NULL-safe joins, and window ranks.
`,
        starterSql: `-- Midterm Exam: Top Performing Customers
SELECT
    c.full_name,
    COUNT(o.id) AS total_orders,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS gross_spend
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY c.id, c.full_name
HAVING COUNT(o.id) > 0
ORDER BY gross_spend DESC
LIMIT 5;
`,
        solutionSql: `SELECT
    c.full_name,
    COUNT(o.id) AS total_orders,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS gross_spend
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY c.id, c.full_name
HAVING COUNT(o.id) > 0
ORDER BY gross_spend DESC
LIMIT 5;`,
        verificationSql: `SELECT COUNT(*) AS mismatch_count FROM (
  SELECT full_name, total_orders, gross_spend FROM (
    {{STUDENT_SQL}}
  ) s
  EXCEPT
  SELECT full_name, total_orders, gross_spend FROM (
    SELECT
        c.full_name,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS gross_spend
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    GROUP BY c.id, c.full_name
    HAVING COUNT(o.id) > 0
    ORDER BY gross_spend DESC
    LIMIT 5
  ) ref
) diff;`,
        rubric: [
          { criterion: 'BCNF Functional Dependency Proofs', points: 40 },
          { criterion: '1:M Foreign Key Constraints & Data Integrity', points: 30 },
          { criterion: 'Practical SQL Aggregations & Window Functions', points: 30 }
        ]
      },
      {
        id: 'c1f2e3d4-4444-4444-8888-000000000004',
        weekNum: 11,
        title: 'Project 3: Dimensional Modeling & Star Schema Architecture',
        slug: 'project-3-star-schema',
        type: 'analytics_query',
        maxScore: 100,
        weightPercentage: 15.0,
        businessCase: `# Project 3: Supply Chain & Multi-Warehouse Fulfillment Network

### Business Context
"GlobalFreight" distributes industrial supplies across 5 regional warehouses. The operations team needs a relational database to track stock levels, transfer legs, and fulfillment latencies.

### Tasks
- Model warehouse nodes and double-entry stock transfer ledgers.
- Compute average fulfillment latency and warehouse rank using \`DENSE_RANK() OVER (ORDER BY avg_latency ASC)\`.
`,
        starterSql: `-- Project 3: Warehouse Fulfillment Latency & Ranking
SELECT
    w.name AS warehouse_name,
    COUNT(st.id) AS transfer_count,
    ROUND(AVG(EXTRACT(EPOCH FROM (st.arrived_at - st.shipped_at))/3600)::numeric, 2) AS avg_latency_hours,
    DENSE_RANK() OVER (ORDER BY AVG(EXTRACT(EPOCH FROM (st.arrived_at - st.shipped_at))) ASC) AS performance_rank
FROM warehouses w
JOIN stock_transfers st ON w.id = st.origin_warehouse_id
WHERE st.status = 'completed'
GROUP BY w.id, w.name
ORDER BY performance_rank;
`,
        solutionSql: `SELECT
    w.name AS warehouse_name,
    COUNT(st.id) AS transfer_count,
    ROUND(AVG(EXTRACT(EPOCH FROM (st.arrived_at - st.shipped_at))/3600)::numeric, 2) AS avg_latency_hours,
    DENSE_RANK() OVER (ORDER BY AVG(EXTRACT(EPOCH FROM (st.arrived_at - st.shipped_at))) ASC) AS performance_rank
FROM warehouses w
JOIN stock_transfers st ON w.id = st.origin_warehouse_id
WHERE st.status = 'completed'
GROUP BY w.id, w.name
ORDER BY performance_rank;`,
        verificationSql: `SELECT COUNT(*) AS mismatch_count FROM (
  SELECT warehouse_name, transfer_count, performance_rank FROM (
    {{STUDENT_SQL}}
  ) s
  EXCEPT
  SELECT warehouse_name, transfer_count, performance_rank FROM (
    SELECT
        w.name AS warehouse_name,
        COUNT(st.id) AS transfer_count,
        DENSE_RANK() OVER (ORDER BY AVG(EXTRACT(EPOCH FROM (st.arrived_at - st.shipped_at))) ASC) AS performance_rank
    FROM warehouses w
    JOIN stock_transfers st ON w.id = st.origin_warehouse_id
    WHERE st.status = 'completed'
    GROUP BY w.id, w.name
  ) ref
) diff;`,
        rubric: [
          { criterion: 'Fact Table Grain & Dimension Relationships', points: 35 },
          { criterion: 'Surrogate Keys & Double-Entry Ledger Constraints', points: 35 },
          { criterion: 'Fulfillment Latency DENSE_RANK() Window Query', points: 30 }
        ]
      },
      {
        id: 'c1f2e3d4-5555-4444-8888-000000000005',
        weekNum: 15,
        title: 'Capstone Project: End-to-End Enterprise Data Warehouse',
        slug: 'capstone-enterprise-data-warehouse',
        type: 'capstone_project',
        maxScore: 100,
        weightPercentage: 20.0,
        businessCase: `# Capstone Project: Enterprise Business Analytics Data Warehouse

### Business Context
Design and deploy a unified dimensional data warehouse consolidating retail transactions, subscription recurring revenue, and multi-location fulfillment into a coherent analytical platform.

### Deliverables
1. Star Schema DDL with Date Dimension and Conformed Dimensions.
2. Slowly Changing Dimension (SCD Type 2) tracking plan changes.
3. Executive KPI Dashboard queries.
`,
        starterSql: `-- Capstone Project: Executive Analytics Summary
SELECT
    'E-Commerce' AS business_unit,
    COUNT(DISTINCT o.id) AS total_events,
    COALESCE(SUM(oi.quantity * (oi.unit_price - oi.discount)), 0) AS total_revenue
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
UNION ALL
SELECT
    'SaaS Subscriptions' AS business_unit,
    COUNT(DISTINCT s.id) AS total_events,
    COALESCE(SUM(p.monthly_price * 12), 0) AS total_revenue
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id;
`,
        solutionSql: `SELECT
    'E-Commerce' AS business_unit,
    COUNT(DISTINCT o.id) AS total_events,
    COALESCE(SUM(oi.quantity * (oi.unit_price - oi.discount)), 0) AS total_revenue
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
UNION ALL
SELECT
    'SaaS Subscriptions' AS business_unit,
    COUNT(DISTINCT s.id) AS total_events,
    COALESCE(SUM(p.monthly_price * 12), 0) AS total_revenue
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id;`,
        verificationSql: `SELECT COUNT(*) AS mismatch_count FROM (
  SELECT business_unit, total_events FROM (
    {{STUDENT_SQL}}
  ) s
  EXCEPT
  SELECT business_unit, total_events FROM (
    SELECT 'E-Commerce' AS business_unit, COUNT(DISTINCT o.id) AS total_events FROM orders o
    UNION ALL
    SELECT 'SaaS Subscriptions' AS business_unit, COUNT(DISTINCT s.id) AS total_events FROM subscriptions s
  ) ref
) diff;`,
        rubric: [
          { criterion: 'Physical Warehouse Architecture & Fact Grain', points: 35 },
          { criterion: 'SCD Type 2 Implementation & History Preservation', points: 35 },
          { criterion: 'Cross-Domain Business Intelligence SQL Queries', points: 30 }
        ]
      },
      {
        id: 'c1f2e3d4-6666-4444-8888-000000000006',
        weekNum: 16,
        title: 'Final Exam: Comprehensive Theory & Capstone Defense',
        slug: 'final-exam-capstone-defense',
        type: 'final_exam',
        maxScore: 100,
        weightPercentage: 15.0,
        businessCase: `# Final Examination & Capstone Defense

### Final Assessment
Comprehensive evaluation covering:
1. Normalization from 1NF to 3NF/BCNF.
2. 1:M parent-child relationship modeling in Crow's Foot ERDs.
3. Dimensional Modeling, Star/Snowflake Schemas, and SCD Type 2.
4. Defense of Capstone schema decisions before faculty.
`,
        starterSql: `-- Final Exam Query: Year-over-Year Revenue & Customer Growth
SELECT
    EXTRACT(YEAR FROM o.order_date) AS order_year,
    COUNT(DISTINCT o.customer_id) AS active_customers,
    ROUND(SUM(oi.quantity * (oi.unit_price - oi.discount))::numeric, 2) AS annual_revenue
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
GROUP BY EXTRACT(YEAR FROM o.order_date)
ORDER BY order_year DESC;
`,
        solutionSql: `SELECT
    EXTRACT(YEAR FROM o.order_date) AS order_year,
    COUNT(DISTINCT o.customer_id) AS active_customers,
    ROUND(SUM(oi.quantity * (oi.unit_price - oi.discount))::numeric, 2) AS annual_revenue
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
GROUP BY EXTRACT(YEAR FROM o.order_date)
ORDER BY order_year DESC;`,
        verificationSql: `SELECT COUNT(*) AS mismatch_count FROM (
  SELECT order_year, active_customers FROM (
    {{STUDENT_SQL}}
  ) s
  EXCEPT
  SELECT order_year, active_customers FROM (
    SELECT
        EXTRACT(YEAR FROM o.order_date) AS order_year,
        COUNT(DISTINCT o.customer_id) AS active_customers
    FROM orders o
    GROUP BY EXTRACT(YEAR FROM o.order_date)
  ) ref
) diff;`,
        rubric: [
          { criterion: 'Comprehensive Relational & Dimensional Architecture', points: 40 },
          { criterion: 'Advanced PostgreSQL Window Functions & Views', points: 30 },
          { criterion: 'Live Capstone Defense & Technical Justification', points: 30 }
        ]
      }
    ];

    const assignmentsWithOrder = assignments.map((a, idx) => ({
      ...a,
      language: 'sql',
      starterPython: null,
      solutionPython: null,
      verificationPython: null,
      sortOrder: idx + 1,
    }));

    const miniAssignments = weeklyCurriculum
      .filter((w) => w.project)
      .map((w) => ({
        id: w.project!.id,
        weekNum: w.num,
        title: w.project!.title,
        slug: w.project!.slug,
        type: w.project!.type,
        language: w.project!.language || 'sql',
        maxScore: w.project!.maxScore,
        weightPercentage: w.project!.weightPercentage,
        businessCase: w.project!.businessCase,
        starterSql: w.project!.starterSql || null,
        solutionSql: w.project!.solutionSql || null,
        verificationSql: w.project!.verificationSql || null,
        starterPython: w.project!.starterPython || null,
        solutionPython: w.project!.solutionPython || null,
        verificationPython: w.project!.verificationPython || null,
        rubric: w.project!.rubric,
        sortOrder: 100 + w.num,
      }));

    const allAssignments = [...assignmentsWithOrder, ...miniAssignments];

    const assignmentIdMap: Record<string, string> = {};

    for (const a of allAssignments) {
      const moduleId = moduleMap[a.weekNum];
      await client.query(`
        INSERT INTO master_assignments (
          id, module_id, title, slug, type, language, business_case_markdown,
          starter_sql, solution_sql, verification_sql,
          starter_python, solution_python, verification_python,
          max_score, weight_percentage, rubric_criteria, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          slug = EXCLUDED.slug,
          type = EXCLUDED.type,
          language = EXCLUDED.language,
          business_case_markdown = EXCLUDED.business_case_markdown,
          starter_sql = EXCLUDED.starter_sql,
          solution_sql = EXCLUDED.solution_sql,
          verification_sql = EXCLUDED.verification_sql,
          starter_python = EXCLUDED.starter_python,
          solution_python = EXCLUDED.solution_python,
          verification_python = EXCLUDED.verification_python,
          max_score = EXCLUDED.max_score,
          weight_percentage = EXCLUDED.weight_percentage,
          rubric_criteria = EXCLUDED.rubric_criteria,
          sort_order = EXCLUDED.sort_order;
      `, [
        a.id, moduleId, a.title, a.slug, a.type, a.language, a.businessCase,
        a.starterSql, a.solutionSql, a.verificationSql,
        a.starterPython, a.solutionPython, a.verificationPython,
        a.maxScore, a.weightPercentage, JSON.stringify(a.rubric), a.sortOrder
      ]);

      // Publish to Cohort
      const cohortAssignmentRes = await client.query(`
        INSERT INTO cohort_assignments (
          cohort_id, master_assignment_id, weight_override, is_published, due_at
        ) VALUES ($1, $2, $3, TRUE, NOW() + INTERVAL '14 days')
        ON CONFLICT (cohort_id, master_assignment_id) DO UPDATE SET
          is_published = TRUE
        RETURNING id;
      `, [cohortId, a.id, a.weightPercentage]);

      assignmentIdMap[a.slug] = cohortAssignmentRes.rows[0].id;
    }

    // 5. Seed Realistic Student Submissions
    console.log('[SEED] Seeding student submissions...');
    const studentGrades = [
      {
        studentId: '00000000-0000-0000-0000-000000000011', // Sokha Chan (Total target ~89.63 -> B+)
        scores: {
          'project-1-marketplace-model': { ver: 92, final: 92, feedback: 'Great 3NF decomposition, minor index naming convention improvement.' },
          'project-2-legacy-erp-3nf': { ver: 88.5, final: 88.5, feedback: 'Solid event logging structure.' },
          'midterm-exam-modeling-defense': { ver: 85, final: 85, feedback: 'Good understanding of BCNF edge cases.' },
          'project-3-star-schema': { ver: 94, final: 94, feedback: 'Clean fact table grain definition.' },
          'capstone-enterprise-data-warehouse': { ver: 91, final: 91, feedback: 'Strong SCD Type 2 implementation.' },
          'final-exam-capstone-defense': { ver: 89, final: 89, feedback: 'Well defended architectural choices.' }
        }
      },
      {
        studentId: '00000000-0000-0000-0000-000000000012', // Dara Vong (Total target ~93.45 -> A)
        scores: {
          'project-1-marketplace-model': { ver: 96, final: 96, feedback: 'Exceptional schema design and RFM quintile query.' },
          'project-2-legacy-erp-3nf': { ver: 94, final: 94, feedback: 'Exemplary normalization with clean FK integrity.' },
          'midterm-exam-modeling-defense': { ver: 91, final: 91, feedback: 'Highest score in practical query optimization.' },
          'project-3-star-schema': { ver: 95, final: 95, feedback: 'Flawless star schema with conformed date dimension.' },
          'capstone-enterprise-data-warehouse': { ver: 93.5, final: 93.5, feedback: 'Comprehensive pipeline and business metrics.' },
          'final-exam-capstone-defense': { ver: 92, final: 92, feedback: 'Outstanding oral defense.' }
        }
      },
      {
        studentId: '00000000-0000-0000-0000-000000000013', // Maria Garcia (~82.5 -> B)
        scores: {
          'project-1-marketplace-model': { ver: 85, final: 84, feedback: 'Good normalization, check order_items compound key.' },
          'project-2-legacy-erp-3nf': { ver: 80, final: 80, feedback: 'Watch out for NULL handling in discount.' },
          'midterm-exam-modeling-defense': { ver: 82, final: 82, feedback: 'Solid grasp of 2NF and 3NF.' },
          'project-3-star-schema': { ver: 84, final: 85, feedback: 'Well structured fact table.' },
          'capstone-enterprise-data-warehouse': { ver: 80, final: 81, feedback: 'Completed core warehouse tables.' },
          'final-exam-capstone-defense': { ver: 83, final: 83, feedback: 'Clear presentation.' }
        }
      },
      {
        studentId: '00000000-0000-0000-0000-000000000014', // Liam Johnson (~76.0 -> C+)
        scores: {
          'project-1-marketplace-model': { ver: 78, final: 78, feedback: 'Partial dependency remained in customer address.' },
          'project-2-legacy-erp-3nf': { ver: 75, final: 75, feedback: 'Missing foreign key index.' },
          'midterm-exam-modeling-defense': { ver: 76, final: 76, feedback: 'Average performance on query optimization.' },
          'project-3-star-schema': { ver: 78, final: 78, feedback: 'Grain statement could be more specific.' },
          'capstone-enterprise-data-warehouse': { ver: 74, final: 74, feedback: 'Functional warehouse with basic reporting.' },
          'final-exam-capstone-defense': { ver: 75, final: 75, feedback: 'Satisfactory defense.' }
        }
      },
      {
        studentId: '00000000-0000-0000-0000-000000000015', // Wei Zhang (~88.0 -> B+)
        scores: {
          'project-1-marketplace-model': { ver: 90, final: 90, feedback: 'Very clean Crow\'s foot diagram translation.' },
          'project-2-legacy-erp-3nf': { ver: 86, final: 86, feedback: 'Good data integrity rules.' },
          'midterm-exam-modeling-defense': { ver: 89, final: 89, feedback: 'Strong performance across both sections.' },
          'project-3-star-schema': { ver: 87, final: 87, feedback: 'Accurate fulfillment ranking.' },
          'capstone-enterprise-data-warehouse': { ver: 88, final: 88, feedback: 'Impressive BI validation queries.' },
          'final-exam-capstone-defense': { ver: 88, final: 88, feedback: 'Solid defense.' }
        }
      }
    ];

    for (const sg of studentGrades) {
      for (const [slug, grade] of Object.entries(sg.scores)) {
        const cohortAssignId = assignmentIdMap[slug];
        if (!cohortAssignId) continue;

        const assignObj = allAssignments.find(a => a.slug === slug);
        const isPythonAssign = assignObj?.language === 'python';
        const submittedSql = isPythonAssign ? null : (assignObj ? assignObj.solutionSql || 'SELECT 1;' : 'SELECT 1;');
        const submittedPython = isPythonAssign ? (assignObj ? assignObj.solutionPython || '# Python solution' : '# Python') : null;

        await client.query(`
          INSERT INTO submissions (
            cohort_assignment_id, student_id, version, submitted_sql, submitted_python, execution_status,
            execution_output, verification_score, final_score, teacher_feedback, graded_by, submitted_at, graded_at
          ) VALUES ($1, $2, 1, $3, $4, 'graded', $5, $6, $7, $8, $9, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day')
          ON CONFLICT (cohort_assignment_id, student_id, version) DO UPDATE SET
            submitted_sql = EXCLUDED.submitted_sql,
            submitted_python = EXCLUDED.submitted_python,
            execution_status = 'graded',
            verification_score = EXCLUDED.verification_score,
            final_score = EXCLUDED.final_score,
            teacher_feedback = EXCLUDED.teacher_feedback,
            graded_at = EXCLUDED.graded_at;
        `, [
          cohortAssignId,
          sg.studentId,
          submittedSql,
          submittedPython,
          JSON.stringify({ passed: true, executionTimeMs: 18.5, rowCount: 5 }),
          grade.ver,
          grade.final,
          grade.feedback,
          '00000000-0000-0000-0000-000000000001'
        ]);
      }
    }

    await client.query('COMMIT;');
    console.log('[SEED] App database seeding completed successfully!');

    // 6. Seed Sandbox Database with Real Curriculum Datasets
    console.log('[SEED] Seeding sandbox_db with curriculum tables...');
    await sandboxClient.query('BEGIN;');

    // Project 1: E-Commerce Tables
    await sandboxClient.query(`
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS customers CASCADE;

      CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        channel VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        retail_price NUMERIC(10, 2) NOT NULL,
        cost_price NUMERIC(10, 2) NOT NULL
      );

      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        customer_id INT REFERENCES customers(id),
        order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        status VARCHAR(30) NOT NULL DEFAULT 'completed'
      );

      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id),
        product_id INT REFERENCES products(id),
        quantity INT NOT NULL CHECK (quantity > 0),
        unit_price NUMERIC(10, 2) NOT NULL,
        discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00
      );

      -- Insert sample e-commerce data
      INSERT INTO customers (id, full_name, email, channel) VALUES
      (1, 'Alice Walker', 'alice@retail.org', 'organic_search'),
      (2, 'Bob Bennett', 'bob@retail.org', 'paid_ads'),
      (3, 'Carla Gomez', 'carla@retail.org', 'referral'),
      (4, 'David Kim', 'david@retail.org', 'direct'),
      (5, 'Elena Rossi', 'elena@retail.org', 'email_campaign');

      INSERT INTO products (id, sku, name, category, retail_price, cost_price) VALUES
      (1, 'SKU-001', 'Wireless Noise Canceling Headphones', 'Electronics', 199.99, 95.00),
      (2, 'SKU-002', 'Mechanical RGB Keyboard', 'Electronics', 129.50, 60.00),
      (3, 'SKU-003', 'Ergonomic Desk Chair', 'Furniture', 349.00, 180.00),
      (4, 'SKU-004', 'Stainless Water Flask 1L', 'Accessories', 29.99, 8.50),
      (5, 'SKU-005', 'USB-C Dual 4K Docking Station', 'Electronics', 159.00, 75.00);

      INSERT INTO orders (id, customer_id, order_date, status) VALUES
      (101, 1, '2026-08-10 14:30:00Z', 'completed'),
      (102, 1, '2026-09-15 11:20:00Z', 'completed'),
      (103, 2, '2026-09-20 18:45:00Z', 'completed'),
      (104, 3, '2026-10-02 09:15:00Z', 'completed'),
      (105, 4, '2026-10-18 16:00:00Z', 'completed'),
      (106, 5, '2026-11-01 12:30:00Z', 'completed');

      INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount) VALUES
      (101, 1, 1, 199.99, 10.00),
      (101, 4, 2, 29.99, 0.00),
      (102, 3, 1, 349.00, 25.00),
      (103, 2, 1, 129.50, 0.00),
      (103, 5, 1, 159.00, 15.00),
      (104, 5, 2, 159.00, 20.00),
      (105, 1, 2, 199.99, 0.00),
      (106, 3, 2, 349.00, 50.00);
    `);

    // Project 2: SaaS Subscription Tables
    await sandboxClient.query(`
      DROP TABLE IF EXISTS subscription_events CASCADE;
      DROP TABLE IF EXISTS subscriptions CASCADE;
      DROP TABLE IF EXISTS plans CASCADE;
      DROP TABLE IF EXISTS accounts CASCADE;

      CREATE TABLE accounts (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(100) NOT NULL,
        domain VARCHAR(100) UNIQUE NOT NULL,
        tier VARCHAR(30) NOT NULL DEFAULT 'standard'
      );

      CREATE TABLE plans (
        id SERIAL PRIMARY KEY,
        plan_name VARCHAR(50) NOT NULL,
        monthly_price NUMERIC(10, 2) NOT NULL,
        seat_limit INT NOT NULL
      );

      CREATE TABLE subscriptions (
        id SERIAL PRIMARY KEY,
        account_id INT REFERENCES accounts(id),
        plan_id INT REFERENCES plans(id),
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        started_at TIMESTAMPTZ NOT NULL,
        renewed_at TIMESTAMPTZ
      );

      CREATE TABLE subscription_events (
        id SERIAL PRIMARY KEY,
        subscription_id INT REFERENCES subscriptions(id),
        event_type VARCHAR(50) NOT NULL,
        event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        mrr_delta NUMERIC(10, 2) NOT NULL
      );

      INSERT INTO accounts (id, company_name, domain, tier) VALUES
      (1, 'Acme Analytics', 'acme.io', 'enterprise'),
      (2, 'Beta Logistics', 'betalog.com', 'growth'),
      (3, 'Crestview Health', 'crestview.org', 'starter'),
      (4, 'Delta FinTech', 'deltafin.co', 'enterprise');

      INSERT INTO plans (id, plan_name, monthly_price, seat_limit) VALUES
      (1, 'Starter', 49.00, 5),
      (2, 'Growth', 199.00, 25),
      (3, 'Enterprise', 799.00, 100);

      INSERT INTO subscriptions (id, account_id, plan_id, status, started_at, renewed_at) VALUES
      (1, 1, 3, 'active', '2026-01-15 00:00:00Z', '2026-11-15 00:00:00Z'),
      (2, 2, 2, 'active', '2026-03-01 00:00:00Z', '2026-11-01 00:00:00Z'),
      (3, 3, 1, 'active', '2026-06-10 00:00:00Z', '2026-11-10 00:00:00Z'),
      (4, 4, 3, 'active', '2026-07-20 00:00:00Z', '2026-11-20 00:00:00Z');

      INSERT INTO subscription_events (subscription_id, event_type, event_date, mrr_delta) VALUES
      (1, 'new_signup', '2026-01-15 00:00:00Z', 799.00),
      (2, 'new_signup', '2026-03-01 00:00:00Z', 199.00),
      (3, 'new_signup', '2026-06-10 00:00:00Z', 49.00),
      (4, 'new_signup', '2026-07-20 00:00:00Z', 799.00);
    `);

    // Project 3: Supply Chain Warehouses & Stock Transfers
    await sandboxClient.query(`
      DROP TABLE IF EXISTS stock_transfers CASCADE;
      DROP TABLE IF EXISTS inventory CASCADE;
      DROP TABLE IF EXISTS warehouses CASCADE;

      CREATE TABLE warehouses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        region VARCHAR(50) NOT NULL,
        capacity_sqft INT NOT NULL
      );

      CREATE TABLE inventory (
        id SERIAL PRIMARY KEY,
        warehouse_id INT REFERENCES warehouses(id),
        product_sku VARCHAR(50) NOT NULL,
        quantity_on_hand INT NOT NULL CHECK (quantity_on_hand >= 0),
        last_counted_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE stock_transfers (
        id SERIAL PRIMARY KEY,
        origin_warehouse_id INT REFERENCES warehouses(id),
        destination_warehouse_id INT REFERENCES warehouses(id),
        product_sku VARCHAR(50) NOT NULL,
        quantity INT NOT NULL CHECK (quantity > 0),
        shipped_at TIMESTAMPTZ NOT NULL,
        arrived_at TIMESTAMPTZ,
        status VARCHAR(30) NOT NULL DEFAULT 'completed'
      );

      INSERT INTO warehouses (id, name, region, capacity_sqft) VALUES
      (1, 'Chicago Central Distribution', 'Midwest', 150000),
      (2, 'Dallas Logistics Hub', 'South', 120000),
      (3, 'Newark Port Depot', 'East', 90000),
      (4, 'Seattle Gateway Hub', 'West', 110000);

      INSERT INTO inventory (warehouse_id, product_sku, quantity_on_hand) VALUES
      (1, 'SKU-001', 450),
      (1, 'SKU-002', 280),
      (2, 'SKU-001', 310),
      (3, 'SKU-003', 150),
      (4, 'SKU-005', 220);

      INSERT INTO stock_transfers (origin_warehouse_id, destination_warehouse_id, product_sku, quantity, shipped_at, arrived_at, status) VALUES
      (1, 2, 'SKU-001', 50, '2026-11-01 08:00:00Z', '2026-11-01 18:30:00Z', 'completed'),
      (1, 3, 'SKU-002', 30, '2026-11-02 09:00:00Z', '2026-11-03 04:00:00Z', 'completed'),
      (2, 4, 'SKU-001', 40, '2026-11-03 07:00:00Z', '2026-11-04 15:00:00Z', 'completed'),
      (3, 1, 'SKU-003', 20, '2026-11-04 10:00:00Z', '2026-11-04 22:30:00Z', 'completed');
    `);

    // Grant permissions to student_sandbox_user
    await sandboxClient.query(`
      GRANT USAGE ON SCHEMA public TO student_sandbox_user;
      GRANT SELECT ON ALL TABLES IN SCHEMA public TO student_sandbox_user;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO student_sandbox_user;
    `);

    await sandboxClient.query('COMMIT;');
    console.log('[SEED] Sandbox database seeded successfully!');
    console.log('[SEED] All seeds applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK;');
    await sandboxClient.query('ROLLBACK;');
    console.error('[SEED] Seed failed:', err);
    throw err;
  } finally {
    client.release();
    sandboxClient.release();
  }
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
