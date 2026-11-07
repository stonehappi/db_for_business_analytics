import { appPool, sandboxAdminPool } from './client';

export async function runSeed() {
  console.log('[SEED] Starting seed script...');
  const client = await appPool.connect();
  const sandboxClient = await sandboxAdminPool.connect();

  try {
    await client.query('BEGIN;');

    // 1. Seed Users
    console.log('[SEED] Seeding users...');
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
        INSERT INTO users (id, student_id_code, email, full_name, role)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          student_id_code = EXCLUDED.student_id_code,
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role;
      `, [u.id, u.studentIdCode, u.email, u.fullName, u.role]);
    }

    // 2. Seed Cohort
    console.log('[SEED] Seeding cohort...');
    const cohortId = 'a1b2c3d4-0000-1111-2222-333333333333';
    await client.query(`
      INSERT INTO cohorts (id, code, name, teacher_id, term, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        teacher_id = EXCLUDED.teacher_id,
        term = EXCLUDED.term;
    `, [cohortId, 'BA-2026-FALL-A', 'Business Analytics Fall 2026 - Section A', '00000000-0000-0000-0000-000000000001', 'Fall 2026']);

    // Cohort Enrollments
    for (const u of users.filter(usr => usr.role === 'student')) {
      await client.query(`
        INSERT INTO cohort_enrollments (cohort_id, student_id)
        VALUES ($1, $2)
        ON CONFLICT (cohort_id, student_id) DO NOTHING;
      `, [cohortId, u.id]);
    }

    // 3. Seed 16-Week Master Modules
    console.log('[SEED] Seeding 16-week master modules...');
    const modules = [
      { num: 1, title: 'Week 1: Business Reality to Relational Abstraction', slug: 'w1-business-reality-relational-abstraction', desc: 'Entities vs attributes, candidate keys, surrogate vs natural keys' },
      { num: 2, title: 'Week 2: Relational Cardinality & One-to-Many Relationships', slug: 'w2-cardinality-one-to-many', desc: 'Parent-child hierarchies, 1:M relationships, Crow\'s Foot notation' },
      { num: 3, title: 'Week 3: Advanced ER-Diagramming & Business Rules', slug: 'w3-advanced-er-diagramming', desc: 'Crow\'s Foot standards, recursive relationships, cascade constraints' },
      { num: 4, title: 'Week 4: Functional Dependencies & First Normal Form (1NF)', slug: 'w4-functional-dependencies-1nf', desc: 'Anomalies, functional dependencies, atomic attributes' },
      { num: 5, title: 'Week 5: Second (2NF) and Third Normal Form (3NF)', slug: 'w5-2nf-3nf-decomposition', desc: 'Full vs partial dependency, transitive dependency, eliminating redundancy' },
      { num: 6, title: 'Week 6: Boyce-Codd Normal Form (BCNF) & Practical Denormalization', slug: 'w6-bcnf-practical-denormalization', desc: 'BCNF edge cases, intentional denormalization in analytics' },
      { num: 7, title: 'Week 7: Physical Schema Implementation in PostgreSQL', slug: 'w7-physical-schema-postgresql', desc: 'PostgreSQL DDL, constraints, data types, indexes' },
      { num: 8, title: 'Week 8: Midterm Examination & Practical Schema Defense', slug: 'w8-midterm-assessment', desc: 'Midterm Theory & Hands-on Modeling Challenge' },
      { num: 9, title: 'Week 9: OLTP vs. OLAP Paradigms', slug: 'w9-oltp-vs-olap', desc: 'Transactional write throughput vs analytical scan performance' },
      { num: 10, title: 'Week 10: Dimensional Modeling Fundamentals (Facts & Dimensions)', slug: 'w10-facts-and-dimensions', desc: 'Fact table grain, additive and semi-additive metrics' },
      { num: 11, title: 'Week 11: Star Schema & Snowflake Schema Architecture', slug: 'w11-star-and-snowflake-schemas', desc: 'Star Schema design, dimensional 1:M relationships, date dimensions' },
      { num: 12, title: 'Week 12: Advanced Dimensional Modeling & Slowly Changing Dimensions (SCD)', slug: 'w12-slowly-changing-dimensions', desc: 'SCD Type 1, Type 2, and Type 3 temporal tracking' },
      { num: 13, title: 'Week 13: PostgreSQL for Analytics: Materialized Views & Indexing', slug: 'w13-materialized-views-indexing', desc: 'Materialized aggregates, BRIN indexes, window functions' },
      { num: 14, title: 'Week 14: Capstone Phase 1: Physical Warehouse Implementation', slug: 'w14-capstone-phase-1', desc: 'Full DDL deployment and initial data warehouse seeding' },
      { num: 15, title: 'Week 15: Capstone Phase 2: Business Intelligence Validation', slug: 'w15-capstone-phase-2', desc: 'Advanced analytical reporting, YoY growth, cohort retention queries' },
      { num: 16, title: 'Week 16: Final Examination & Capstone Defense', slug: 'w16-final-assessment', desc: 'Comprehensive final exam and live schema defense' },
    ];

    const moduleMap: Record<number, string> = {};

    for (const m of modules) {
      const res = await client.query(`
        INSERT INTO master_modules (title, slug, description, week_number, sort_order)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          week_number = EXCLUDED.week_number,
          sort_order = EXCLUDED.sort_order
        RETURNING id;
      `, [m.title, m.slug, m.desc, m.num, m.num]);
      moduleMap[m.num] = res.rows[0].id;
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

    const assignmentIdMap: Record<string, string> = {};

    for (const a of assignments) {
      const moduleId = moduleMap[a.weekNum];
      await client.query(`
        INSERT INTO master_assignments (
          id, module_id, title, slug, type, business_case_markdown, starter_sql, solution_sql, verification_sql, max_score, weight_percentage, rubric_criteria, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          slug = EXCLUDED.slug,
          type = EXCLUDED.type,
          business_case_markdown = EXCLUDED.business_case_markdown,
          starter_sql = EXCLUDED.starter_sql,
          solution_sql = EXCLUDED.solution_sql,
          verification_sql = EXCLUDED.verification_sql,
          max_score = EXCLUDED.max_score,
          weight_percentage = EXCLUDED.weight_percentage,
          rubric_criteria = EXCLUDED.rubric_criteria;
      `, [
        a.id, moduleId, a.title, a.slug, a.type, a.businessCase, a.starterSql, a.solutionSql, a.verificationSql, a.maxScore, a.weightPercentage, JSON.stringify(a.rubric), a.weekNum
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

        const assignObj = assignments.find(a => a.slug === slug);
        const submittedSql = assignObj ? assignObj.solutionSql : 'SELECT 1;';

        await client.query(`
          INSERT INTO submissions (
            cohort_assignment_id, student_id, version, submitted_sql, execution_status,
            execution_output, verification_score, final_score, teacher_feedback, graded_by, submitted_at, graded_at
          ) VALUES ($1, $2, 1, $3, 'graded', $4, $5, $6, $7, $8, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day')
          ON CONFLICT (cohort_assignment_id, student_id, version) DO UPDATE SET
            submitted_sql = EXCLUDED.submitted_sql,
            execution_status = 'graded',
            verification_score = EXCLUDED.verification_score,
            final_score = EXCLUDED.final_score,
            teacher_feedback = EXCLUDED.teacher_feedback,
            graded_at = EXCLUDED.graded_at;
        `, [
          cohortAssignId,
          sg.studentId,
          submittedSql,
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
