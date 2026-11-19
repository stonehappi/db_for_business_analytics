export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface WeeklyCurriculumItem {
  num: number;
  title: string;
  slug: string;
  desc: string;
  lectureSlidesHtml: string;
  quizData: QuizQuestion[];
  project?: {
    id: string;
    title: string;
    slug: string;
    type: string;
    language?: string;
    maxScore: number;
    weightPercentage: number;
    businessCase: string;
    starterSql?: string;
    solutionSql?: string;
    verificationSql?: string;
    starterPython?: string;
    solutionPython?: string;
    verificationPython?: string;
    rubric: { criterion: string; points: number }[];
  };
}

export const weeklyCurriculum: WeeklyCurriculumItem[] = [
  // WEEK 1
  {
    num: 1,
    title: 'Week 1: Business Reality to Relational Abstraction',
    slug: 'w1-business-reality-relational-abstraction',
    desc: 'Entities vs attributes, candidate keys, surrogate vs natural keys',
    lectureSlidesHtml: `
<section class="slide" data-slide-title="Introduction: Data in Business Analytics">
  <div class="slide-badge">Week 1 • Slide 1 of 6</div>
  <h2 class="slide-title">From Business Reality to Relational Abstraction</h2>
  <div class="slide-body">
    <p class="slide-lead">Modern enterprise analytics depends entirely on the fidelity of the underlying relational model.</p>
    <div class="grid grid-cols-2 gap-4 my-4">
      <div class="p-4 bg-white border border-zinc-200 rounded">
        <h4 class="font-semibold text-zinc-900 mb-1">Physical Business World</h4>
        <p class="text-xs text-zinc-600">Physical receipts, invoices, barcode scans, customer interactions, warehouse shipments, and bank transfers.</p>
      </div>
      <div class="p-4 bg-white border border-zinc-200 rounded">
        <h4 class="font-semibold text-zinc-900 mb-1">Relational Abstraction</h4>
        <p class="text-xs text-zinc-600">Mathematical relations (tables), tuples (rows), attributes (columns), and integrity constraints in PostgreSQL.</p>
      </div>
    </div>
    <div class="callout-box bg-zinc-50 border-l-4 border-zinc-900 p-3 mt-4 text-xs text-zinc-700">
      <strong>Core Insight:</strong> Before writing any analytical SQL, the business analyst must first isolate the <em>grain</em> and fundamental business entities.
    </div>
  </div>
</section>

<section class="slide" data-slide-title="Entities vs Attributes">
  <div class="slide-badge">Week 1 • Slide 2 of 6</div>
  <h2 class="slide-title">Entities vs Attributes</h2>
  <div class="slide-body">
    <p class="slide-lead">Distinguishing between what exists independently versus what describes an entity.</p>
    <ul class="slide-list space-y-3 my-4">
      <li><strong>Entity (Noun):</strong> A distinct person, place, item, or transaction event that exists independently in business reality (e.g., <code>Customer</code>, <code>Order</code>, <code>Store</code>).</li>
      <li><strong>Attribute (Descriptor):</strong> A characteristic, measurement, or state describing an entity (e.g., <code>customer_email</code>, <code>unit_price</code>, <code>shipped_at</code>).</li>
      <li><strong>Grain of an Entity:</strong> What does a single row represent? E.g., "One customer account", "One line item scanned at cash register".</li>
    </ul>
    <div class="p-3 bg-zinc-100 rounded font-mono text-xs text-zinc-800">
      Invoice Receipt ➔ Entities: [Customer, Order, Product, Warehouse]<br/>
      Attributes of Order: [order_date, payment_method, tax_amount]
    </div>
  </div>
</section>

<section class="slide" data-slide-title="Understanding Keys in Relational Modeling">
  <div class="slide-badge">Week 1 • Slide 3 of 6</div>
  <h2 class="slide-title">Understanding Relational Keys</h2>
  <div class="slide-body">
    <div class="space-y-3">
      <div class="border border-zinc-200 p-3 rounded">
        <h4 class="font-semibold text-zinc-900">1. Superkey</h4>
        <p class="text-xs text-zinc-600">Any set of columns that uniquely identifies a row in a relation.</p>
      </div>
      <div class="border border-zinc-200 p-3 rounded">
        <h4 class="font-semibold text-zinc-900">2. Candidate Key</h4>
        <p class="text-xs text-zinc-600">A <strong>minimal superkey</strong>—no extraneous columns can be discarded while preserving uniqueness.</p>
      </div>
      <div class="border border-zinc-200 p-3 rounded">
        <h4 class="font-semibold text-zinc-900">3. Primary Key (PK)</h4>
        <p class="text-xs text-zinc-600">The specific candidate key selected by the database designer to enforce entity identity across foreign relationships.</p>
      </div>
    </div>
  </div>
</section>

<section class="slide" data-slide-title="Surrogate vs Natural Identifiers">
  <div class="slide-badge">Week 1 • Slide 4 of 6</div>
  <h2 class="slide-title">Natural Keys vs Surrogate Keys</h2>
  <div class="slide-body">
    <div class="grid grid-cols-2 gap-4">
      <div class="p-3 border border-zinc-200 rounded">
        <h4 class="font-semibold text-zinc-900 text-sm">Natural Keys</h4>
        <p class="text-xs text-zinc-600 mt-1">Identifiers that exist inherently in the business domain (e.g., Social Security Number, National Tax ID, Vehicle VIN, ISBN).</p>
        <span class="inline-block mt-2 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">Risk: Business rules change, leading to expensive cascading updates.</span>
      </div>
      <div class="p-3 border border-zinc-200 rounded">
        <h4 class="font-semibold text-zinc-900 text-sm">Surrogate Keys</h4>
        <p class="text-xs text-zinc-600 mt-1">System-generated synthetic identifiers with zero intrinsic business meaning (e.g., <code>UUID v4</code>, <code>BIGSERIAL</code>).</p>
        <span class="inline-block mt-2 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">Best Practice: Completely decouples identity from business logic modifications.</span>
      </div>
    </div>
  </div>
</section>

<section class="slide" data-slide-title="PostgreSQL Table Definition Implementation">
  <div class="slide-badge">Week 1 • Slide 5 of 6</div>
  <h2 class="slide-title">Physical PostgreSQL Syntax</h2>
  <div class="slide-body">
    <pre class="bg-zinc-900 text-zinc-100 p-3 rounded text-xs font-mono overflow-x-auto">
-- Implementation of clean surrogate keys & natural candidate uniqueness
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Surrogate Key
    tax_identifier VARCHAR(30) UNIQUE NOT NULL,    -- Natural Candidate Key
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);</pre>
    <p class="text-xs text-zinc-600 mt-3">Notice: Surrogate primary key <code>id</code> guarantees immutable foreign key references, while natural candidate keys (<code>tax_identifier</code>, <code>email</code>) are guarded with <code>UNIQUE</code> constraints.</p>
  </div>
</section>

<section class="slide" data-slide-title="Week 1 Summary & Next Steps">
  <div class="slide-badge">Week 1 • Slide 6 of 6</div>
  <h2 class="slide-title">Week 1 Key Takeaways</h2>
  <div class="slide-body">
    <ul class="slide-list space-y-2 text-xs text-zinc-700">
      <li>✔ Business reality must be parsed into distinct, atomic Entities and Attributes.</li>
      <li>✔ The grain statement dictates the level of detail represented by a single tuple.</li>
      <li>✔ Candidate keys are minimal superkeys; choose surrogate keys (UUID) for stable relational pointers.</li>
      <li>✔ Proceed to the <strong>Week 1 Interactive Quiz</strong> to test your understanding before starting the weekly project.</li>
    </ul>
  </div>
</section>
`,
    quizData: [
      {
        id: 'w1-q1',
        question: 'Which of the following best defines a Candidate Key in relational database modeling?',
        options: [
          'Any column that has a B-tree index created on it',
          'A minimal superkey capable of uniquely identifying every tuple with no redundant attributes',
          'A foreign key pointing back to an external parent table',
          'An auto-incrementing integer assigned by PostgreSQL sequence'
        ],
        correctIndex: 1,
        explanation: 'A candidate key is a minimal superkey—a set of attributes that uniquely identifies a row where removing any attribute would destroy the uniqueness property.'
      },
      {
        id: 'w1-q2',
        question: 'Why do database architects generally prefer surrogate keys (e.g. UUID) over natural keys (e.g. Phone Number or Tax ID)?',
        options: [
          'Surrogate keys take up less storage on disk than any numeric integer',
          'Natural keys may change over time due to corporate or legal policies, breaking foreign key relationships',
          'PostgreSQL prohibits the use of natural keys as primary keys',
          'Surrogate keys eliminate the need for foreign key constraints'
        ],
        correctIndex: 1,
        explanation: 'Natural keys can and do change (e.g., customer changes email, government alters tax ID formats). Surrogate keys are immutable and protect all foreign key lineages from cascading breakage.'
      },
      {
        id: 'w1-q3',
        question: 'When analyzing a retail sales receipt, what constitutes the "grain" of the sales order line items table?',
        options: [
          'One row per retail store branch location',
          'One row per customer who ever entered the store',
          'One row per distinct product SKU purchased within a specific customer order',
          'One row per day of the financial calendar year'
        ],
        correctIndex: 2,
        explanation: 'The grain defines exactly what a single record in a table represents. For order line items, the grain is one individual product line item inside an order transaction.'
      }
    ],
    project: {
      id: 'c1f2e3d4-1111-4444-8888-000000000101',
      title: 'Week 1 Mini-Project: Business Entity Extraction & Key Modeling',
      slug: 'w1-project-entity-modeling',
      type: 'erd_conceptual',
      maxScore: 100,
      weightPercentage: 0.0,
      businessCase: `# Week 1 Mini-Project: Retail Coffee Franchise Entity Modeling

### Business Context
"Artisan Brew Co." operates 12 retail coffee shops across the city. Each day, cashiers print thousands of paper receipts containing customer names, loyalty member numbers, drink types, custom syrups, store IDs, and timestamps. Management currently stores everything in flat CSV files, causing frequent duplicate customer records and lost drink modification details.

### Requirements
1. Extract the core business entities from the retail transaction.
2. Formulate the grain statement for each entity table.
3. Write an analytical query verifying customer record distinctness and count of orders.
`,
      starterSql: `-- Week 1: Verify Customer Record Integrity & Order Distribution
SELECT
    c.id AS customer_id,
    c.full_name,
    COUNT(o.id) AS total_orders
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.full_name
ORDER BY total_orders DESC;`,
      solutionSql: `SELECT
    c.id AS customer_id,
    c.full_name,
    COUNT(o.id) AS total_orders
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.full_name
ORDER BY total_orders DESC;`,
      verificationSql: `SELECT COUNT(*) AS mismatch_count FROM (
  SELECT customer_id, full_name, total_orders FROM (
    {{STUDENT_SQL}}
  ) s
  EXCEPT
  SELECT customer_id, full_name, total_orders FROM (
    SELECT
        c.id AS customer_id,
        c.full_name,
        COUNT(o.id) AS total_orders
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    GROUP BY c.id, c.full_name
  ) ref
) diff;`,
      rubric: [
        { criterion: 'Correct identification of customer entity surrogate key', points: 40 },
        { criterion: 'Safe grouping and aggregation of orders per customer', points: 30 },
        { criterion: 'Zero duplicate rows produced in output dataset', points: 30 }
      ]
    }
  },

  // WEEK 2
  {
    num: 2,
    title: 'Week 2: Relational Cardinality & One-to-Many Relationships',
    slug: 'w2-cardinality-one-to-many',
    desc: 'Parent-child hierarchies, 1:M relationships, Crow\'s Foot notation',
    lectureSlidesHtml: `
<section class="slide" data-slide-title="The Heart of Relational Modeling">
  <div class="slide-badge">Week 2 • Slide 1 of 6</div>
  <h2 class="slide-title">Relational Cardinality & One-to-Many (1:M)</h2>
  <div class="slide-body">
    <p class="slide-lead">The One-to-Many (1:M) relationship is the foundational building block of 95% of business database design.</p>
    <div class="p-4 bg-zinc-50 border border-zinc-200 rounded my-4 text-xs font-mono text-zinc-800">
      Parent Table [1] ───────────────< [M] Child Table<br/>
      Department (PK: dept_id)        Employees (FK: dept_id)
    </div>
    <p class="text-xs text-zinc-600">The primary key of the Parent table is placed inside the Child table as a <strong>Foreign Key</strong>.</p>
  </div>
</section>

<section class="slide" data-slide-title="Cardinality and Modality">
  <div class="slide-badge">Week 2 • Slide 2 of 6</div>
  <h2 class="slide-title">Cardinality & Modality Definitions</h2>
  <div class="slide-body">
    <ul class="slide-list space-y-3 text-xs text-zinc-700">
      <li><strong>Maximum Cardinality:</strong> The maximum number of child instances that can associate with one parent (e.g., One or Many).</li>
      <li><strong>Minimum Modality (Participation):</strong> Is the relationship mandatory or optional?
        <ul class="pl-4 mt-1 space-y-1">
          <li><em>Mandatory (1):</em> An Order Item <strong>must</strong> belong to an existing Order.</li>
          <li><em>Optional (0):</em> A Customer may exist with <strong>zero</strong> historical orders (e.g., new sign-up).</li>
        </ul>
      </li>
    </ul>
  </div>
</section>

<section class="slide" data-slide-title="Crow's Foot Notation Reference">
  <div class="slide-badge">Week 2 • Slide 3 of 6</div>
  <h2 class="slide-title">Crow's Foot Notation Symbols</h2>
  <div class="slide-body">
    <div class="grid grid-cols-2 gap-3 my-3">
      <div class="p-3 border border-zinc-200 rounded bg-white">
        <span class="font-mono text-xs font-bold block">──┼──┼──</span>
        <span class="text-xs text-zinc-800 font-medium">Exactly One (1 and only 1)</span>
        <p class="text-[11px] text-zinc-500 mt-1">Mandatory parent link.</p>
      </div>
      <div class="p-3 border border-zinc-200 rounded bg-white">
        <span class="font-mono text-xs font-bold block">──○──┼──</span>
        <span class="text-xs text-zinc-800 font-medium">Zero or One (0 or 1)</span>
        <p class="text-[11px] text-zinc-500 mt-1">Optional single relationship.</p>
      </div>
      <div class="p-3 border border-zinc-200 rounded bg-white">
        <span class="font-mono text-xs font-bold block">──┼──<</span>
        <span class="text-xs text-zinc-800 font-medium">One or Many (1 to M)</span>
        <p class="text-[11px] text-zinc-500 mt-1">Mandatory child collection.</p>
      </div>
      <div class="p-3 border border-zinc-200 rounded bg-white">
        <span class="font-mono text-xs font-bold block">──○──<</span>
        <span class="text-xs text-zinc-800 font-medium">Zero or Many (0 to M)</span>
        <p class="text-[11px] text-zinc-500 mt-1">Optional child collection.</p>
      </div>
    </div>
  </div>
</section>

<section class="slide" data-slide-title="Resolving Many-to-Many Relationships">
  <div class="slide-badge">Week 2 • Slide 4 of 6</div>
  <h2 class="slide-title">Resolving M:N with Junction Tables</h2>
  <div class="slide-body">
    <p class="slide-lead">Relational engines cannot implement direct M:N links without violating atomic 1NF.</p>
    <div class="p-3 bg-zinc-900 text-zinc-100 rounded text-xs font-mono my-3">
      Students >──────< Classes  (M:N Relationship)
      Decomposed into:
      Students ───< Enrollments (Junction) >─── Classes
    </div>
    <p class="text-xs text-zinc-600">The junction entity converts one complex M:N relationship into two clean 1:M relationships containing composite or surrogate keys.</p>
  </div>
</section>

<section class="slide" data-slide-title="PostgreSQL Foreign Key DDL">
  <div class="slide-badge">Week 2 • Slide 5 of 6</div>
  <h2 class="slide-title">Implementing Foreign Keys in PostgreSQL</h2>
  <div class="slide-body">
    <pre class="bg-zinc-900 text-zinc-100 p-3 rounded text-xs font-mono overflow-x-auto">
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crucial: Always index foreign key columns for fast join scans!
CREATE INDEX idx_orders_customer_id ON orders(customer_id);</pre>
  </div>
</section>

<section class="slide" data-slide-title="Week 2 Summary">
  <div class="slide-badge">Week 2 • Slide 6 of 6</div>
  <h2 class="slide-title">Week 2 Summary</h2>
  <div class="slide-body">
    <ul class="slide-list space-y-2 text-xs text-zinc-700">
      <li>✔ Foreign keys live on the Child (Many) side of a 1:M relationship.</li>
      <li>✔ Modality specifies whether zero instances are permitted (optional vs mandatory).</li>
      <li>✔ Many-to-Many relationships must always be resolved via an associative junction table.</li>
      <li>✔ Foreign key indexes are mandatory for analytical JOIN performance.</li>
    </ul>
  </div>
</section>
`,
    quizData: [
      {
        id: 'w2-q1',
        question: 'In a One-to-Many (1:M) relationship between Department (Parent) and Employee (Child), where does the Foreign Key reside?',
        options: [
          'Inside the Department table pointing to all employees in an array',
          'Inside the Employee table referencing the Department primary key',
          'In a separate third configuration file outside PostgreSQL',
          'Inside the database catalog sys_tables table only'
        ],
        correctIndex: 1,
        explanation: 'In relational design, the Child (Many) table holds the Foreign Key attribute referencing the primary key of the Parent (One) table.'
      },
      {
        id: 'w2-q2',
        question: 'How must a Many-to-Many (M:N) relationship between "Products" and "Orders" be resolved in a relational schema?',
        options: [
          'By storing a comma-separated list of product IDs inside a text column in orders',
          'By duplicating the entire orders table for each product sold',
          'By introducing an associative junction entity (e.g., order_items) with two 1:M relationships',
          'By forcing every customer to purchase only one product per order'
        ],
        correctIndex: 2,
        explanation: 'Relational databases resolve M:N relationships by creating an associative table (junction table) with two One-to-Many links.'
      },
      {
        id: 'w2-q3',
        question: 'Why should a database engineer always create an index on Foreign Key columns in PostgreSQL?',
        options: [
          'PostgreSQL refuses to execute foreign key checks without an index',
          'To prevent Sequential Scans during JOIN operations and avoid table locks during DELETE/UPDATE of parent rows',
          'Indexes on foreign keys automatically encrypt customer data',
          'It enforces Third Normal Form automatically'
        ],
        correctIndex: 1,
        explanation: 'While PostgreSQL automatically creates unique indexes for Primary Keys, it does NOT automatically index Foreign Keys. Without an FK index, parent table deletes/updates trigger expensive sequential table scans.'
      }
    ],
    project: {
      id: 'c1f2e3d4-1111-4444-8888-000000000102',
      title: 'Week 2 Mini-Project: One-to-Many Relational Cardinality & Foreign Key Schema',
      slug: 'w2-project-cardinality',
      type: 'erd_conceptual',
      maxScore: 100,
      weightPercentage: 0.0,
      businessCase: `# Week 2 Mini-Project: Multi-Store Inventory & Supplier Lineage

### Business Scenario
"GlobalDistribute Corp." manages logistics across 5 regional warehouses and 40 product categories. They need a verified schema query proving that every inventory line item correctly resolves to its parent warehouse and parent supplier.

### Deliverables
Write an analytical verification query reporting warehouse name, total distinct SKUs stored, and total on-hand inventory quantity.
`,
      starterSql: `-- Week 2: Warehouse Inventory Aggregation
SELECT
    w.name AS warehouse_name,
    COUNT(DISTINCT p.id) AS sku_count,
    COALESCE(SUM(oi.quantity), 0) AS total_inventory_units
FROM products p
CROSS JOIN (SELECT 'Main Distribution Hub' AS name) w
LEFT JOIN order_items oi ON oi.product_id = p.id
GROUP BY w.name;`,
      solutionSql: `SELECT
    w.name AS warehouse_name,
    COUNT(DISTINCT p.id) AS sku_count,
    COALESCE(SUM(oi.quantity), 0) AS total_inventory_units
FROM products p
CROSS JOIN (SELECT 'Main Distribution Hub' AS name) w
LEFT JOIN order_items oi ON oi.product_id = p.id
GROUP BY w.name;`,
      verificationSql: `SELECT COUNT(*) AS mismatch_count FROM (
  SELECT warehouse_name, sku_count, total_inventory_units FROM (
    {{STUDENT_SQL}}
  ) s
  EXCEPT
  SELECT warehouse_name, sku_count, total_inventory_units FROM (
    SELECT
        w.name AS warehouse_name,
        COUNT(DISTINCT p.id) AS sku_count,
        COALESCE(SUM(oi.quantity), 0) AS total_inventory_units
    FROM products p
    CROSS JOIN (SELECT 'Main Distribution Hub' AS name) w
    LEFT JOIN order_items oi ON oi.product_id = p.id
    GROUP BY w.name
  ) ref
) diff;`,
      rubric: [
        { criterion: 'Accurate parent-to-child join relationship resolution', points: 40 },
        { criterion: 'Handling null quantities with COALESCE', points: 30 },
        { criterion: 'Precise COUNT DISTINCT aggregation on SKUs', points: 30 }
      ]
    }
  },

  // WEEK 3: Project 1 (Marketplace)
  {
    num: 3,
    title: 'Week 3: Advanced ER-Diagramming & Business Rules',
    slug: 'w3-advanced-er-diagramming',
    desc: 'Crow\'s Foot standards, recursive relationships, cascade constraints',
    lectureSlidesHtml: `
<section class="slide" data-slide-title="Advanced Relational Modeling">
  <div class="slide-badge">Week 3 • Slide 1 of 6</div>
  <h2 class="slide-title">Advanced ER-Diagramming & Business Constraints</h2>
  <div class="slide-body">
    <p class="slide-lead">Translating ambiguous client business policy statements into strict, deterministic database constraints.</p>
    <div class="p-4 bg-zinc-50 border border-zinc-200 rounded my-3 text-xs text-zinc-700">
      Business Policy: "If a vendor account is deleted, their catalog listings must be frozen or archived, but historic customer invoices must never be deleted."
    </div>
  </div>
</section>

<section class="slide" data-slide-title="Referential Integrity Actions">
  <div class="slide-badge">Week 3 • Slide 2 of 6</div>
  <h2 class="slide-title">PostgreSQL Referential Actions</h2>
  <div class="slide-body">
    <div class="space-y-2 text-xs">
      <div class="p-2 border border-zinc-200 rounded">
        <strong>ON DELETE RESTRICT / NO ACTION (Default):</strong> Blocks the delete of the parent row if child rows exist. Safest for financial transactions.
      </div>
      <div class="p-2 border border-zinc-200 rounded">
        <strong>ON DELETE CASCADE:</strong> Deleting parent row automatically purges all child records. Suitable for ephemeral session tokens or cache tables.
      </div>
      <div class="p-2 border border-zinc-200 rounded">
        <strong>ON DELETE SET NULL:</strong> Foreign key in child is nullified. Suitable when ownership of a task transfers back to unassigned.
      </div>
    </div>
  </div>
</section>

<section class="slide" data-slide-title="Recursive and Self-Referencing Relationships">
  <div class="slide-badge">Week 3 • Slide 3 of 6</div>
  <h2 class="slide-title">Recursive Hierarchies</h2>
  <div class="slide-body">
    <p class="slide-lead">Modeling organizational trees, category taxonomies, and bill-of-materials.</p>
    <pre class="bg-zinc-900 text-zinc-100 p-3 rounded text-xs font-mono my-2 overflow-x-auto">
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    manager_id UUID REFERENCES employees(id) ON DELETE SET NULL
);</pre>
    <p class="text-xs text-zinc-600">The <code>manager_id</code> column points directly back to another record within the exact same relation.</p>
  </div>
</section>

<section class="slide" data-slide-title="Data Dictionaries & Domain Rules">
  <div class="slide-badge">Week 3 • Slide 4 of 6</div>
  <h2 class="slide-title">The Entity Data Dictionary</h2>
  <div class="slide-body">
    <p class="slide-lead">A professional data dictionary bridges the gap between software engineers, database admins, and business analysts.</p>
    <div class="overflow-x-auto my-2">
      <table class="w-full text-[11px] border text-left">
        <tr class="bg-zinc-100"><th class="p-1.5 border">Column</th><th class="p-1.5 border">Type</th><th class="p-1.5 border">Nullable</th><th class="p-1.5 border">Description</th></tr>
        <tr><td class="p-1.5 border font-mono">id</td><td class="p-1.5 border font-mono">UUID</td><td class="p-1.5 border">NO</td><td class="p-1.5 border">Surrogate primary identifier</td></tr>
        <tr><td class="p-1.5 border font-mono">status</td><td class="p-1.5 border font-mono">VARCHAR(20)</td><td class="p-1.5 border">NO</td><td class="p-1.5 border">Enum: active, pending, suspended</td></tr>
      </table>
    </div>
  </div>
</section>

<section class="slide" data-slide-title="Capstone Project 1 Introduction">
  <div class="slide-badge">Week 3 • Slide 5 of 6</div>
  <h2 class="slide-title">Project 1: Multi-Vendor Marketplace</h2>
  <div class="slide-body">
    <p class="slide-lead">You will design the relational schema and analytical RFM queries for OmniRetail marketplace.</p>
    <ul class="slide-list space-y-2 text-xs text-zinc-700 my-3">
      <li>✔ Model vendors, products, buyers, orders, line items, and reviews.</li>
      <li>✔ Implement strict referential actions protecting historic transaction lineage.</li>
      <li>✔ Write RFM Customer Lifetime Value queries utilizing PostgreSQL window functions.</li>
    </ul>
  </div>
</section>

<section class="slide" data-slide-title="Week 3 Checklist">
  <div class="slide-badge">Week 3 • Slide 6 of 6</div>
  <h2 class="slide-title">Week 3 Deliverables Checklist</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">Complete the Week 3 Quiz, then open the Project tab to execute and submit Project 1 in the interactive SQL workspace.</p>
  </div>
</section>
`,
    quizData: [
      {
        id: 'w3-q1',
        question: 'Which referential integrity action should be applied to an "orders.customer_id" foreign key to prevent accidental deletion of revenue audit logs?',
        options: [
          'ON DELETE CASCADE so all customer orders vanish immediately',
          'ON DELETE RESTRICT / NO ACTION so PostgreSQL blocks deleting a customer with historical orders',
          'ON DELETE SET NULL so the order loses its customer lineage',
          'DROP TABLE customers CASCADE'
        ],
        correctIndex: 1,
        explanation: 'ON DELETE RESTRICT or NO ACTION prevents a parent row from being deleted if dependent child transactions exist, preserving financial integrity.'
      },
      {
        id: 'w3-q2',
        question: 'In a recursive relationship where employees reference their managers, what constraint must the "manager_id" column have?',
        options: [
          'It must be NOT NULL to ensure the CEO reports to themselves',
          'It must be NULLABLE so that the top-level executive (CEO) can have a NULL manager pointer',
          'It must have a UNIQUE constraint preventing any manager from having two reports',
          'It cannot be a foreign key in PostgreSQL'
        ],
        correctIndex: 1,
        explanation: 'Top-level nodes in hierarchical trees (such as the CEO or root product category) have no superior, so manager_id must permit NULL values.'
      },
      {
        id: 'w3-q3',
        question: 'What is the primary role of a Data Dictionary in an analytics engineering team?',
        options: [
          'To replace SQL DDL scripts with text files',
          'To provide explicit documentation on column data types, business definitions, valid domains, and constraints',
          'To encrypt user passwords in the application layer',
          'To run scheduled ETL data warehouse pipelines'
        ],
        correctIndex: 1,
        explanation: 'A data dictionary serves as the single source of truth describing every entity, attribute grain, allowed value ranges, and relationship constraints.'
      }
    ],
    project: {
      id: 'c1f2e3d4-1111-4444-8888-000000000103',
      title: 'Week 3 Python Lab: Exploratory Data Analysis & Customer Spend in Pandas',
      slug: 'w3-project-python-eda',
      type: 'python_analytics',
      language: 'python',
      maxScore: 100,
      weightPercentage: 5,
      businessCase: `# Business Case: Retail Customer Transaction EDA & Spend Modeling

## Context
"OmniRetail" requires a Python business analytics script to inspect transaction hygiene, extract customer orders from PostgreSQL, merge line items, compute total customer revenue, and visualize customer spend distributions.

## Tasks:
1. Connect to PostgreSQL using the injected \`conn\` engine and extract tables:
   - \`customers\`
   - \`orders\`
   - \`order_items\`
2. Compute line net total: \`net_total = quantity * (unit_price - discount)\`.
3. Aggregate to create an \`order_summary\` DataFrame with columns:
   - \`order_id\`, \`customer_id\`, \`total_revenue\`
4. Create a Matplotlib bar chart showing total revenue per customer.`,
      starterPython: `# Week 3 Python Analytics Lab
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# 1. Query database tables via injected connection 'conn'
df_customers = pd.read_sql("SELECT * FROM customers", conn)
df_orders = pd.read_sql("SELECT * FROM orders", conn)
df_items = pd.read_sql("SELECT * FROM order_items", conn)

# 2. Compute net line item revenue and aggregate per order into 'order_summary'
# Columns required in order_summary: 'order_id', 'customer_id', 'total_revenue'
df_items['net_total'] = df_items['quantity'] * (df_items['unit_price'] - df_items['discount'])
order_rev = df_items.groupby('order_id')['net_total'].sum().reset_index()
order_rev.rename(columns={'net_total': 'total_revenue'}, inplace=True)

order_summary = pd.merge(df_orders, order_rev, left_on='id', right_on='order_id')
order_summary = order_summary[['id', 'customer_id', 'total_revenue']].rename(columns={'id': 'order_id'})

# 3. Generate visualization of customer total spend
cust_spend = order_summary.groupby('customer_id')['total_revenue'].sum()

plt.figure(figsize=(6, 4))
cust_spend.plot(kind='bar', color='#18181B')
plt.title('Total Revenue by Customer')
plt.xlabel('Customer ID')
plt.ylabel('Revenue ($)')
plt.tight_layout()
`,
      solutionPython: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

df_customers = pd.read_sql("SELECT * FROM customers", conn)
df_orders = pd.read_sql("SELECT * FROM orders", conn)
df_items = pd.read_sql("SELECT * FROM order_items", conn)

df_items['net_total'] = df_items['quantity'] * (df_items['unit_price'] - df_items['discount'])
order_rev = df_items.groupby('order_id')['net_total'].sum().reset_index()
order_rev.rename(columns={'net_total': 'total_revenue'}, inplace=True)

order_summary = pd.merge(df_orders, order_rev, left_on='id', right_on='order_id')
order_summary = order_summary[['id', 'customer_id', 'total_revenue']].rename(columns={'id': 'order_id'})

cust_spend = order_summary.groupby('customer_id')['total_revenue'].sum()

plt.figure(figsize=(6, 4))
cust_spend.plot(kind='bar', color='#18181B')
plt.title('Total Revenue by Customer')
plt.xlabel('Customer ID')
plt.ylabel('Revenue ($)')
plt.tight_layout()
`,
      verificationPython: `assert 'order_summary' in locals(), "Expected DataFrame 'order_summary' to be created"
assert isinstance(order_summary, pd.DataFrame), "'order_summary' must be a pandas DataFrame"
for col in ['order_id', 'customer_id', 'total_revenue']:
    assert col in order_summary.columns, f"Missing required column '{col}' in order_summary"
assert len(order_summary) >= 6, f"Expected at least 6 orders in order_summary, found {len(order_summary)}"
assert order_summary['total_revenue'].sum() > 1000, "Calculated total revenue is too low"
`,
      rubric: [
        { criterion: 'Clean database extraction using pandas.read_sql', points: 30 },
        { criterion: 'Accurate net line-item calculation and aggregation', points: 40 },
        { criterion: 'Matplotlib chart figure generation', points: 30 }
      ]
    }
  },

  // WEEKS 4 TO 16 (We will populate similarly rich pedagogical slides & quizzes for all weeks)
  {
    num: 4,
    title: 'Week 4: Functional Dependencies & First Normal Form (1NF)',
    slug: 'w4-functional-dependencies-1nf',
    desc: 'Anomalies, functional dependencies, atomic attributes',
    lectureSlidesHtml: `
<section class="slide" data-slide-title="Relational Normalization Theory">
  <div class="slide-badge">Week 4 • Slide 1 of 5</div>
  <h2 class="slide-title">Functional Dependencies & 1NF</h2>
  <div class="slide-body">
    <p class="slide-lead">Unnormalized tables cause catastrophic data anomalies in operational and analytical workloads.</p>
    <div class="grid grid-cols-3 gap-3 my-4">
      <div class="p-3 bg-red-50 border border-red-200 rounded text-xs">
        <strong>Insertion Anomaly:</strong> Cannot record a supplier until they sell a product.
      </div>
      <div class="p-3 bg-red-50 border border-red-200 rounded text-xs">
        <strong>Update Anomaly:</strong> Changing an address requires updating 10,000 rows.
      </div>
      <div class="p-3 bg-red-50 border border-red-200 rounded text-xs">
        <strong>Deletion Anomaly:</strong> Deleting an order accidentally erases the customer profile.
      </div>
    </div>
  </div>
</section>

<section class="slide" data-slide-title="Defining Functional Dependency">
  <div class="slide-badge">Week 4 • Slide 2 of 5</div>
  <h2 class="slide-title">Functional Dependency: X ➔ Y</h2>
  <div class="slide-body">
    <p class="slide-lead">If two tuples agree on attribute X, they MUST agree on attribute Y.</p>
    <div class="p-3 bg-zinc-100 font-mono text-xs text-zinc-900 rounded my-3">
      customer_id ➔ { customer_name, customer_email, tax_code }<br/>
      Given customer_id = 'C-101', customer_name is uniquely determined.
    </div>
    <p class="text-xs text-zinc-600">The left side (X) is known as the <strong>Determinant</strong>.</p>
  </div>
</section>

<section class="slide" data-slide-title="Rules of First Normal Form (1NF)">
  <div class="slide-badge">Week 4 • Slide 3 of 5</div>
  <h2 class="slide-title">First Normal Form (1NF) Rules</h2>
  <div class="slide-body">
    <ul class="slide-list space-y-3 text-xs text-zinc-700">
      <li><strong>1. Atomicity of Values:</strong> Each cell must contain exactly one scalar value (no comma-separated strings like <code>"electronics, gadgets, sale"</code>, no nested JSON arrays).</li>
      <li><strong>2. No Repeating Column Groups:</strong> Eliminate anti-patterns like <code>phone_1, phone_2, phone_3</code> or <code>item_1, item_2, item_3</code>.</li>
      <li><strong>3. Explicit Primary Key:</strong> Every relation must have a defined unique primary identifier.</li>
    </ul>
  </div>
</section>

<section class="slide" data-slide-title="Deconstructing Multi-Valued Attributes">
  <div class="slide-badge">Week 4 • Slide 4 of 5</div>
  <h2 class="slide-title">Refactoring Spreadsheet Multi-Values</h2>
  <div class="slide-body">
    <div class="p-3 bg-zinc-900 text-zinc-100 font-mono text-xs rounded overflow-x-auto">
-- VIOLATION (Non-atomic comma separated list):
-- Order 101 | "Laptop, Mouse, Keyboard"

-- SOLUTION (1NF normalized rows):
-- Order 101 | Item 1 | "Laptop"
-- Order 101 | Item 2 | "Mouse"
-- Order 101 | Item 3 | "Keyboard"</div>
  </div>
</section>

<section class="slide" data-slide-title="Week 4 Summary">
  <div class="slide-badge">Week 4 • Slide 5 of 5</div>
  <h2 class="slide-title">Week 4 Summary</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">Achieving 1NF is the prerequisite for all relational operations. Once data is atomic and repeating groups are eliminated, we can proceed to evaluate partial and transitive dependencies.</p>
  </div>
</section>
`,
    quizData: [
      {
        id: 'w4-q1',
        question: 'Which table design violates First Normal Form (1NF)?',
        options: [
          'A table with a UUID surrogate primary key',
          'A table containing a column "phone_numbers" with comma-separated values "555-0101, 555-0102"',
          'A table with multiple foreign keys pointing to separate parent tables',
          'A table with a numeric currency column NUMERIC(10, 2)'
        ],
        correctIndex: 1,
        explanation: '1NF requires all attribute values to be atomic. Storing comma-separated strings in a single attribute violates 1NF.'
      },
      {
        id: 'w4-q2',
        question: 'In the notation X ➔ Y, what does X represent?',
        options: [
          'The dependent attribute',
          'The determinant',
          'The foreign key constraint',
          'The relational join operation'
        ],
        correctIndex: 1,
        explanation: 'In the functional dependency X -> Y, X is called the determinant because its value uniquely determines the value of Y.'
      },
      {
        id: 'w4-q3',
        question: 'What is an "Update Anomaly"?',
        options: [
          'A hardware disk failure during PostgreSQL server restart',
          'Inconsistent state caused by having to update redundant data across multiple rows when a single business fact changes',
          'A query timing out after 3000ms',
          'Attempting to insert a NULL into a primary key column'
        ],
        correctIndex: 1,
        explanation: 'An update anomaly occurs when data redundancy forces an application to update multiple records to change a single piece of info, risking inconsistent data if one update fails.'
      }
    ],
    project: {
      id: 'c1f2e3d4-1111-4444-8888-000000000104',
      title: 'Week 4 Mini-Project: 1NF Spreadsheet Deconstruction & Atomic Decomposition',
      slug: 'w4-project-1nf-decomposition',
      type: 'ddl_schema',
      maxScore: 100,
      weightPercentage: 0.0,
      businessCase: `# Week 4 Mini-Project: Spreadsheet Deconstruction

### Business Context
The marketing team maintained an Excel spreadsheet tracking event registrations with multi-valued columns. We must normalize this data into clean, atomic 1NF records and verify distinct customer registrations.

### Tasks
Write an analytical query producing distinct product categories and total sales revenue per category.
`,
      starterSql: `-- Week 4: 1NF Category Sales Aggregation
SELECT
    category,
    COUNT(id) AS total_products,
    COALESCE(SUM(price), 0) AS catalog_value
FROM products
GROUP BY category
ORDER BY catalog_value DESC;`,
      solutionSql: `SELECT
    category,
    COUNT(id) AS total_products,
    COALESCE(SUM(price), 0) AS catalog_value
FROM products
GROUP BY category
ORDER BY catalog_value DESC;`,
      verificationSql: `SELECT COUNT(*) AS mismatch_count FROM (
  SELECT category, total_products, catalog_value FROM (
    {{STUDENT_SQL}}
  ) s
  EXCEPT
  SELECT category, total_products, catalog_value FROM (
    SELECT
        category,
        COUNT(id) AS total_products,
        COALESCE(SUM(price), 0) AS catalog_value
    FROM products
    GROUP BY category
  ) ref
) diff;`,
      rubric: [
        { criterion: 'Atomic category grouping without data truncation', points: 40 },
        { criterion: 'Accurate catalog price sum calculation', points: 30 },
        { criterion: 'Clean descending sort order', points: 30 }
      ]
    }
  },

  // WEEK 5
  {
    num: 5,
    title: 'Week 5: Second (2NF) and Third Normal Form (3NF)',
    slug: 'w5-2nf-3nf-decomposition',
    desc: 'Full vs partial dependency, transitive dependency, eliminating redundancy',
    lectureSlidesHtml: `
<section class="slide" data-slide-title="Second Normal Form (2NF)">
  <div class="slide-badge">Week 5 • Slide 1 of 5</div>
  <h2 class="slide-title">Second Normal Form (2NF): Eliminating Partial Dependencies</h2>
  <div class="slide-body">
    <p class="slide-lead">2NF applies to relations with composite primary keys. Every non-key attribute must depend on the WHOLE primary key.</p>
    <div class="p-3 bg-red-50 border border-red-200 rounded text-xs my-3">
      <strong>Partial Dependency:</strong> PK is {order_id, product_id}.<br/>
      <code>product_name</code> depends solely on <code>product_id</code>, NOT on <code>order_id</code>!
    </div>
    <p class="text-xs text-zinc-600">Solution: Extract <code>products</code> into its own relation.</p>
  </div>
</section>

<section class="slide" data-slide-title="Third Normal Form (3NF)">
  <div class="slide-badge">Week 5 • Slide 2 of 5</div>
  <h2 class="slide-title">Third Normal Form (3NF): Eliminating Transitive Dependencies</h2>
  <div class="slide-body">
    <p class="slide-lead">"Every non-key attribute must depend on the key, the whole key, and nothing but the key."</p>
    <div class="p-3 bg-zinc-100 font-mono text-xs rounded my-3 text-zinc-800">
      order_id (PK) ➔ customer_id ➔ customer_zip_code ➔ city_name<br/>
      <code>city_name</code> depends transitively on <code>order_id</code> via customer attributes!
    </div>
    <p class="text-xs text-zinc-600">3NF requires removing non-key dependencies into separate reference tables.</p>
  </div>
</section>

<section class="slide" data-slide-title="Lossless Join Decomposition">
  <div class="slide-badge">Week 5 • Slide 3 of 5</div>
  <h2 class="slide-title">Lossless Join Property</h2>
  <div class="slide-body">
    <p class="slide-lead">Decomposition must never produce spurious tuples or destroy data lineage.</p>
    <p class="text-xs text-zinc-700">When decomposing relation R into R1 and R2, their natural join must reproduce exactly R with zero loss and zero phantom rows: <code>R1 ⨝ R2 = R</code>.</p>
  </div>
</section>

<section class="slide" data-slide-title="3NF in Practice">
  <div class="slide-badge">Week 5 • Slide 4 of 5</div>
  <h2 class="slide-title">3NF Enterprise Architecture</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-600 mb-2">Notice how our normalized schema cleanly separates entities:</p>
    <ul class="text-xs text-zinc-700 space-y-1 font-mono">
      <li>customers (id, email, full_name)</li>
      <li>products (id, sku, price, category)</li>
      <li>orders (id, customer_id, order_date)</li>
      <li>order_items (id, order_id, product_id, quantity, unit_price)</li>
    </ul>
  </div>
</section>

<section class="slide" data-slide-title="Week 5 Summary">
  <div class="slide-badge">Week 5 • Slide 5 of 5</div>
  <h2 class="slide-title">Week 5 Summary</h2>
  <div class="slide-body">
    <ul class="space-y-2 text-xs text-zinc-700">
      <li>✔ 2NF eliminates partial dependencies on composite keys.</li>
      <li>✔ 3NF eliminates transitive dependencies between non-key attributes.</li>
      <li>✔ All decomposition must satisfy the lossless join property.</li>
    </ul>
  </div>
</section>
`,
    quizData: [
      {
        id: 'w5-q1',
        question: 'Under what condition can a relation in 1NF violate Second Normal Form (2NF)?',
        options: [
          'Only when the primary key is a composite key consisting of two or more attributes',
          'Only when the table has foreign keys referencing PostgreSQL system tables',
          'Whenever the table contains more than 1,000 records',
          'When all candidate keys are single-column UUIDs'
        ],
        correctIndex: 0,
        explanation: 'If a table has a single-column primary key, partial dependencies are mathematically impossible, so it is automatically in 2NF if in 1NF.'
      },
      {
        id: 'w5-q2',
        question: 'Given relation Orders(order_id, customer_id, customer_city), why is this in violation of 3NF?',
        options: [
          'Because order_id is not indexed',
          'Because customer_city depends on customer_id, which is a non-key transitive dependency from order_id',
          'Because customer_city contains textual characters',
          'Because PostgreSQL requires city names to be stored as integers'
        ],
        correctIndex: 1,
        explanation: 'In 3NF, no non-key attribute can depend on another non-key attribute. customer_city transitively depends on order_id via customer_id.'
      },
      {
        id: 'w5-q3',
        question: 'What is guaranteed by a Lossless Join Decomposition?',
        options: [
          'The SQL query will execute in under 1 millisecond',
          'Re-joining the decomposed tables reproduces the original relation with neither lost data nor spurious phantom tuples',
          'Disk space usage is reduced by exactly 50%',
          'All foreign key constraints are dropped automatically'
        ],
        correctIndex: 1,
        explanation: 'Lossless join guarantees that performing a natural join on the decomposed tables produces exactly the original dataset with zero information loss or spurious records.'
      }
    ],
    project: {
      id: 'c1f2e3d4-1111-4444-8888-000000000105',
      title: 'Week 5 Mini-Project: 2NF & 3NF Normalization Decomposition',
      slug: 'w5-project-3nf-decomposition',
      type: 'ddl_schema',
      maxScore: 100,
      weightPercentage: 0.0,
      businessCase: `# Week 5 Mini-Project: 3NF Relational Deconstruction

### Business Context
Analyze the normalized order and line item schema to ensure zero transitive anomalies and compute the customer order volume breakdown.
`,
      starterSql: `-- Week 5: Customer Order Volume & Average Order Value
SELECT
    c.id AS customer_id,
    c.email,
    COUNT(DISTINCT o.id) AS orders_count,
    ROUND(AVG(oi.quantity * oi.unit_price), 2) AS avg_item_spend
FROM customers c
JOIN orders o ON c.id = o.customer_id
JOIN order_items oi ON o.id = oi.order_id
GROUP BY c.id, c.email
ORDER BY orders_count DESC;`,
      solutionSql: `SELECT
    c.id AS customer_id,
    c.email,
    COUNT(DISTINCT o.id) AS orders_count,
    ROUND(AVG(oi.quantity * oi.unit_price), 2) AS avg_item_spend
FROM customers c
JOIN orders o ON c.id = o.customer_id
JOIN order_items oi ON o.id = oi.order_id
GROUP BY c.id, c.email
ORDER BY orders_count DESC;`,
      verificationSql: `SELECT COUNT(*) AS mismatch_count FROM (
  SELECT customer_id, email, orders_count, avg_item_spend FROM (
    {{STUDENT_SQL}}
  ) s
  EXCEPT
  SELECT customer_id, email, orders_count, avg_item_spend FROM (
    SELECT
        c.id AS customer_id,
        c.email,
        COUNT(DISTINCT o.id) AS orders_count,
        ROUND(AVG(oi.quantity * oi.unit_price), 2) AS avg_item_spend
    FROM customers c
    JOIN orders o ON c.id = o.customer_id
    JOIN order_items oi ON o.id = oi.order_id
    GROUP BY c.id, c.email
  ) ref
) diff;`,
      rubric: [
        { criterion: 'Accurate multi-table join across normalized 3NF tables', points: 40 },
        { criterion: 'Safe average item spend calculation with rounding', points: 30 },
        { criterion: 'Clean grouping on customer grain', points: 30 }
      ]
    }
  },

  // WEEK 6: Project 2 (Legacy ERP) - Already has project in seed
  {
    num: 6,
    title: 'Week 6: Boyce-Codd Normal Form (BCNF) & Practical Denormalization',
    slug: 'w6-bcnf-practical-denormalization',
    desc: 'BCNF edge cases, intentional denormalization in analytics',
    lectureSlidesHtml: `
<section class="slide" data-slide-title="Boyce-Codd Normal Form (BCNF)">
  <div class="slide-badge">Week 6 • Slide 1 of 5</div>
  <h2 class="slide-title">Boyce-Codd Normal Form (BCNF)</h2>
  <div class="slide-body">
    <p class="slide-lead">BCNF is a stricter version of 3NF: For EVERY functional dependency X ➔ Y, X must be a superkey.</p>
    <div class="p-3 bg-zinc-100 rounded text-xs font-mono my-3">
      Classic Edge Case: Scheduling table (Student, Teacher, Subject)<br/>
      Where {Student, Teacher} ➔ Subject and Subject ➔ Teacher.<br/>
      In 3NF because Teacher is prime, but VIOLATES BCNF because Subject is not a superkey!
    </div>
  </div>
</section>

<section class="slide" data-slide-title="The Cost of Over-Normalization">
  <div class="slide-badge">Week 6 • Slide 2 of 5</div>
  <h2 class="slide-title">When Normalization Hurts Performance</h2>
  <div class="slide-body">
    <p class="slide-lead">3NF/BCNF minimizes write anomalies, but introduces heavy query latency for analytics.</p>
    <div class="grid grid-cols-2 gap-3 my-3">
      <div class="p-3 border border-zinc-200 rounded text-xs">
        <strong>OLTP Writes (3NF Champion):</strong> Fast INSERT, zero redundant updates, tight transaction boundaries.
      </div>
      <div class="p-3 border border-zinc-200 rounded text-xs">
        <strong>OLAP Analytics (Join Penalty):</strong> Answering one executive question requires joining 12 normalized tables.
      </div>
    </div>
  </div>
</section>

<section class="slide" data-slide-title="Strategic Denormalization">
  <div class="slide-badge">Week 6 • Slide 3 of 5</div>
  <h2 class="slide-title">Intentional Denormalization</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">Business analysts deliberately introduce controlled redundancy to avoid high join latency in reporting systems:</p>
    <ul class="text-xs text-zinc-600 space-y-1 my-2">
      <li>• Pre-aggregating totals (e.g., <code>orders.total_amount</code> cached directly on order header).</li>
      <li>• Embedding static dimension snapshots (e.g., customer address snapshot on shipping manifest).</li>
    </ul>
  </div>
</section>

<section class="slide" data-slide-title="Project 2 Introduction">
  <div class="slide-badge">Week 6 • Slide 4 of 5</div>
  <h2 class="slide-title">Project 2 Overview</h2>
  <div class="slide-body">
    <p class="slide-lead">Refactoring Legacy ERP Data into clean 3NF schemas and evaluating SaaS recurring revenue metrics.</p>
  </div>
</section>

<section class="slide" data-slide-title="Week 6 Summary">
  <div class="slide-badge">Week 6 • Slide 5 of 5</div>
  <h2 class="slide-title">Week 6 Summary</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">BCNF guarantees no redundancy from functional dependencies. Denormalization is applied deliberately for read performance.</p>
  </div>
</section>
`,
    quizData: [
      {
        id: 'w6-q1',
        question: 'What is the strict rule that distinguishes BCNF from standard Third Normal Form (3NF)?',
        options: [
          'In BCNF, every determinant X in a functional dependency X ➔ Y must be a Superkey',
          'In BCNF, tables cannot have foreign key relationships',
          'BCNF requires all column names to be written in uppercase',
          'BCNF applies only to non-relational document stores'
        ],
        correctIndex: 0,
        explanation: 'BCNF requires that for every functional dependency X -> Y, X must be a superkey. 3NF allows Y to be a prime attribute even if X is not a superkey.'
      },
      {
        id: 'w6-q2',
        question: 'What is the primary trade-off of intentional denormalization in database design?',
        options: [
          'Faster read query response times at the cost of potential data redundancy and more complex write updates',
          'Lower storage efficiency with zero change in query performance',
          'Eliminating the need for SQL SELECT statements',
          'Disabling PostgreSQL transaction logging'
        ],
        correctIndex: 0,
        explanation: 'Denormalization trades off write simplicity and storage redundancy to eliminate expensive multi-table joins on read-heavy analytics.'
      },
      {
        id: 'w6-q3',
        question: 'Why is snapshotting customer shipping addresses onto an order record considered good denormalization?',
        options: [
          'Because historical invoices must reflect the address at the moment of shipping, not where the customer moves years later',
          'Because PostgreSQL forbids joining customer addresses with orders',
          'To bypass data type constraints',
          'Because 3NF prohibits customer tables'
        ],
        correctIndex: 0,
        explanation: 'Capturing the shipping address snapshot preserves temporal audit reality. If the customer changes their profile address, historic orders must remain unaffected.'
      }
    ]
  },

  // WEEK 7
  {
    num: 7,
    title: 'Week 7: Physical Schema Implementation in PostgreSQL',
    slug: 'w7-physical-schema-postgresql',
    desc: 'PostgreSQL DDL, constraints, data types, indexes',
    lectureSlidesHtml: `
<section class="slide" data-slide-title="Physical Implementation">
  <div class="slide-badge">Week 7 • Slide 1 of 5</div>
  <h2 class="slide-title">PostgreSQL Physical Schema Implementation</h2>
  <div class="slide-body">
    <p class="slide-lead">Translating conceptual and logical designs into production PostgreSQL DDL scripts.</p>
    <div class="space-y-2 text-xs my-3">
      <div class="p-2 border rounded"><strong>Data Types:</strong> Choose <code>NUMERIC(12,2)</code> for currency—NEVER use <code>FLOAT</code> or <code>DOUBLE</code> for financial calculations due to binary rounding errors!</div>
      <div class="p-2 border rounded"><strong>Timestamps:</strong> Always use <code>TIMESTAMPTZ</code> to store UTC with timezone awareness.</div>
    </div>
  </div>
</section>

<section class="slide" data-slide-title="PostgreSQL Constraint Architecture">
  <div class="slide-badge">Week 7 • Slide 2 of 5</div>
  <h2 class="slide-title">PostgreSQL Constraints</h2>
  <div class="slide-body">
    <pre class="bg-zinc-900 text-zinc-100 p-3 rounded text-xs font-mono overflow-x-auto">
ALTER TABLE subscriptions
  ADD CONSTRAINT chk_price_positive CHECK (monthly_price >= 0),
  ADD CONSTRAINT chk_valid_status CHECK (status IN ('active', 'paused', 'canceled'));</pre>
    <p class="text-xs text-zinc-600 mt-2">Check constraints enforce business rules directly inside the database storage layer, independent of application code bugs.</p>
  </div>
</section>

<section class="slide" data-slide-title="Indexing Strategies for Analytics">
  <div class="slide-badge">Week 7 • Slide 3 of 5</div>
  <h2 class="slide-title">Indexing for Query Performance</h2>
  <div class="slide-body">
    <ul class="text-xs text-zinc-700 space-y-2">
      <li><strong>B-Tree (Default):</strong> Ideal for equality and range queries (<code>=</code>, <code><</code>, <code>BETWEEN</code>).</li>
      <li><strong>Composite Indexes:</strong> Order matters! Leading column must match query WHERE filter.</li>
      <li><strong>Partial Indexes:</strong> <code>CREATE INDEX idx_active_subs ON subscriptions(account_id) WHERE status = 'active';</code></li>
    </ul>
  </div>
</section>

<section class="slide" data-slide-title="DDL Migrations Best Practices">
  <div class="slide-badge">Week 7 • Slide 4 of 5</div>
  <h2 class="slide-title">Transactional DDL Migrations</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">PostgreSQL supports transactional DDL! Always wrap schema migrations in <code>BEGIN; ... COMMIT;</code> blocks so failures roll back cleanly without leaving partial tables.</p>
  </div>
</section>

<section class="slide" data-slide-title="Week 7 Summary">
  <div class="slide-badge">Week 7 • Slide 5 of 5</div>
  <h2 class="slide-title">Week 7 Summary</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">Physical design requires choosing exact types, enforcing domain constraints, indexing foreign keys, and preparing for next week's Midterm Assessment.</p>
  </div>
</section>
`,
    quizData: [
      {
        id: 'w7-q1',
        question: 'Why should monetary currency amounts NEVER be stored using FLOAT or REAL data types in PostgreSQL?',
        options: [
          'Because FLOAT cannot store negative numbers',
          'Because floating-point representation causes binary IEEE 754 precision errors (e.g. 0.1 + 0.2 = 0.30000000000000004)',
          'Because PostgreSQL prohibits indexing FLOAT columns',
          'Because FLOAT values are restricted to integers under 1,000'
        ],
        correctIndex: 1,
        explanation: 'Floating-point types use binary approximations that cause severe rounding errors in monetary sums. Always use exact precision NUMERIC(p, s) for money.'
      },
      {
        id: 'w7-q2',
        question: 'What is a PostgreSQL Partial Index?',
        options: [
          'An index created on only the first 5 characters of a string',
          'An index that indexes only a subset of rows satisfying a specific WHERE clause condition',
          'An index that only works on half of the CPU cores',
          'An index that drops automatically after 24 hours'
        ],
        correctIndex: 1,
        explanation: 'A partial index includes a WHERE clause (e.g., WHERE is_active = TRUE) so the index remains tiny, fast, and only covers relevant records.'
      },
      {
        id: 'w7-q3',
        question: 'What happens if a DDL statement fails inside a PostgreSQL transaction block (BEGIN ... COMMIT)?',
        options: [
          'The entire transaction is rolled back, leaving the database schema untouched',
          'The database server shuts down permanently',
          'The error is ignored and invalid tables are created anyway',
          'All existing database data is erased'
        ],
        correctIndex: 0,
        explanation: 'PostgreSQL provides transactional DDL. If any migration query fails, the ROLLBACK restores the database to its exact pre-migration state.'
      }
    ],
    project: {
      id: 'c1f2e3d4-1111-4444-8888-000000000107',
      title: 'Week 7 Mini-Project: PostgreSQL DDL Constraints & Index Creation',
      slug: 'w7-project-ddl-constraints',
      type: 'ddl_schema',
      maxScore: 100,
      weightPercentage: 0.0,
      businessCase: `# Week 7 Mini-Project: Physical DDL Implementation

### Business Context
Implement verified PostgreSQL DDL assertions ensuring active subscriptions have valid billing cycles and produce active account distribution metrics.
`,
      starterSql: `-- Week 7: Active Account Subscription Distribution
SELECT
    p.plan_name,
    COUNT(s.id) AS active_subscribers,
    SUM(p.monthly_price) AS monthly_revenue
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
GROUP BY p.plan_name
ORDER BY monthly_revenue DESC;`,
      solutionSql: `SELECT
    p.plan_name,
    COUNT(s.id) AS active_subscribers,
    SUM(p.monthly_price) AS monthly_revenue
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
GROUP BY p.plan_name
ORDER BY monthly_revenue DESC;`,
      verificationSql: `SELECT COUNT(*) AS mismatch_count FROM (
  SELECT plan_name, active_subscribers, monthly_revenue FROM (
    {{STUDENT_SQL}}
  ) s
  EXCEPT
  SELECT plan_name, active_subscribers, monthly_revenue FROM (
    SELECT
        p.plan_name,
        COUNT(s.id) AS active_subscribers,
        SUM(p.monthly_price) AS monthly_revenue
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.status = 'active'
    GROUP BY p.plan_name
  ) ref
) diff;`,
      rubric: [
        { criterion: 'Active status filter enforcement', points: 40 },
        { criterion: 'Total monthly revenue aggregation per plan', points: 30 },
        { criterion: 'Clean descending revenue order', points: 30 }
      ]
    }
  },

  // WEEK 8: Midterm Examination - Already has project in seed
  {
    num: 8,
    title: 'Week 8: Midterm Examination & Practical Schema Defense',
    slug: 'w8-midterm-assessment',
    desc: 'Midterm Theory & Hands-on Modeling Challenge',
    lectureSlidesHtml: `
<section class="slide" data-slide-title="Midterm Assessment Overview">
  <div class="slide-badge">Week 8 • Slide 1 of 4</div>
  <h2 class="slide-title">Midterm Examination & Schema Defense</h2>
  <div class="slide-body">
    <p class="slide-lead">Comprehensive evaluation of Phase 1 (Conceptual Modeling) and Phase 2 (Relational Normalization & Physical DDL).</p>
    <div class="grid grid-cols-2 gap-4 my-3">
      <div class="p-3 border rounded">
        <strong>Part 1: Theory (40%)</strong>
        <p class="text-xs text-zinc-600 mt-1">Normal form decomposition proofs, candidate keys, cardinality, and constraints.</p>
      </div>
      <div class="p-3 border rounded">
        <strong>Part 2: Practical Lab (60%)</strong>
        <p class="text-xs text-zinc-600 mt-1">Hands-on SQL schema query challenge evaluated in the live PostgreSQL sandbox.</p>
      </div>
    </div>
  </div>
</section>

<section class="slide" data-slide-title="Key Review Points">
  <div class="slide-badge">Week 8 • Slide 2 of 4</div>
  <h2 class="slide-title">Critical Midterm Review Points</h2>
  <div class="slide-body">
    <ul class="text-xs text-zinc-700 space-y-2">
      <li>• <strong>Grain Statement:</strong> State the exact atomic business event represented by each row.</li>
      <li>• <strong>Cardinality:</strong> Identify parent vs child entities in 1:M relationships.</li>
      <li>• <strong>Normalization:</strong> Eliminate 1NF multi-values, 2NF partial dependencies, 3NF transitive dependencies.</li>
      <li>• <strong>Referential Actions:</strong> Choose RESTRICT vs CASCADE vs SET NULL correctly.</li>
    </ul>
  </div>
</section>

<section class="slide" data-slide-title="Examination Instructions">
  <div class="slide-badge">Week 8 • Slide 3 of 4</div>
  <h2 class="slide-title">Examination Protocol</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">1. Take the Midterm Theory Quiz below.<br/>2. Open the Project tab to write and test your SQL challenge.<br/>3. Verify execution output with "Run Sandbox" and submit when tests pass 100%.</p>
  </div>
</section>

<section class="slide" data-slide-title="Transition to Warehousing">
  <div class="slide-badge">Week 8 • Slide 4 of 4</div>
  <h2 class="slide-title">Looking Ahead: Phase 4 & 5</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-600">Following the Midterm, Week 9 begins our transition from OLTP operational databases to OLAP Dimensional Data Warehousing and Star Schemas!</p>
  </div>
</section>
`,
    quizData: [
      {
        id: 'w8-q1',
        question: 'Which of the following describes a relation that is in 2NF but NOT in 3NF?',
        options: [
          'It has multi-valued comma-separated attributes in a single cell',
          'It has no partial key dependencies, but contains transitive dependencies between non-key attributes',
          'All non-key attributes depend only on the primary key',
          'The table has no primary key defined'
        ],
        correctIndex: 1,
        explanation: 'A 2NF relation has eliminated all partial dependencies, but if a non-key attribute still depends on another non-key attribute (A -> B -> C), it violates 3NF.'
      },
      {
        id: 'w8-q2',
        question: 'What is the consequence of deleting a parent record when the foreign key specifies ON DELETE CASCADE?',
        options: [
          'PostgreSQL throws a foreign key constraint violation error and halts',
          'All child rows referencing that parent record are automatically and permanently deleted',
          'The child rows remain with their foreign keys set to NULL',
          'The database rolls back to the previous day\'s backup'
        ],
        correctIndex: 1,
        explanation: 'ON DELETE CASCADE propagates the delete operation to all dependent child records automatically.'
      },
      {
        id: 'w8-q3',
        question: 'When is Boyce-Codd Normal Form (BCNF) strictly necessary over standard 3NF?',
        options: [
          'Whenever there are multiple overlapping candidate keys with non-trivial dependencies',
          'Whenever a table exceeds 10 columns',
          'Whenever PostgreSQL triggers an out of memory error',
          'Only for tables containing financial bank records'
        ],
        correctIndex: 0,
        explanation: '3NF permits non-superkey determinants if the dependent attribute is part of a candidate key. BCNF eliminates this loophole when candidate keys overlap.'
      }
    ]
  },

  // WEEK 9
  {
    num: 9,
    title: 'Week 9: OLTP vs. OLAP Paradigms',
    slug: 'w9-oltp-vs-olap',
    desc: 'Transactional write throughput vs analytical scan performance',
    lectureSlidesHtml: `
<section class="slide" data-slide-title="The Great Divide: OLTP vs OLAP">
  <div class="slide-badge">Week 9 • Slide 1 of 5</div>
  <h2 class="slide-title">OLTP vs OLAP Paradigms</h2>
  <div class="slide-body">
    <p class="slide-lead">Why relational databases designed for transaction writes fail catastrophically at business analytics.</p>
    <div class="grid grid-cols-2 gap-3 my-3">
      <div class="p-3 bg-zinc-50 border rounded text-xs">
        <h4 class="font-bold text-zinc-900">OLTP (Online Transaction Processing)</h4>
        <p class="text-zinc-600 mt-1">• Highly normalized (3NF).<br/>• Short, rapid read/write operations (INSERT, UPDATE).<br/>• Hundreds of concurrent transactions per second.<br/>• Queries access 1 or 2 specific rows by primary key.</p>
      </div>
      <div class="p-3 bg-zinc-50 border rounded text-xs">
        <h4 class="font-bold text-zinc-900">OLAP (Online Analytical Processing)</h4>
        <p class="text-zinc-600 mt-1">• Denormalized Star / Snowflake schemas.<br/>• Massive batch reads scanning millions of records.<br/>• Heavy aggregations (SUM, AVG, COUNT, NTILE).<br/>• Historical trend reporting and cohort analytics.</p>
      </div>
    </div>
  </div>
</section>

<section class="slide" data-slide-title="Row Storage vs Columnar Concepts">
  <div class="slide-badge">Week 9 • Slide 2 of 5</div>
  <h2 class="slide-title">Row Storage vs Columnar Concepts</h2>
  <div class="slide-body">
    <p class="slide-lead">Access patterns dictate memory throughput.</p>
    <div class="p-3 bg-zinc-100 font-mono text-xs rounded my-2 text-zinc-800">
      Row Store: [ID, Name, Date, Price, Tax, SKU] [ID, Name, Date, Price, Tax, SKU]<br/>
      Scanning Price requires loading all unneeded text columns into RAM!<br/><br/>
      Column Store: [Price1, Price2, Price3...] [Date1, Date2, Date3...]<br/>
      Analytical queries scan ONLY the numerical column needed.
    </div>
  </div>
</section>

<section class="slide" data-slide-title="The Role of the Data Warehouse">
  <div class="slide-badge">Week 9 • Slide 3 of 5</div>
  <h2 class="slide-title">The Modern Enterprise Data Warehouse</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">A Data Warehouse is a subject-oriented, integrated, time-variant, and non-volatile collection of data in support of management's decision-making process (W.H. Inmon).</p>
    <ul class="text-xs text-zinc-600 space-y-1 mt-2">
      <li>• <strong>Subject-Oriented:</strong> Organized around business processes (Sales, Churn, Inventory).</li>
      <li>• <strong>Integrated:</strong> Unifies disparate databases, CRM, and ERP inputs into consistent formats.</li>
      <li>• <strong>Time-Variant:</strong> Stores snapshots over 5-10 years rather than just current state.</li>
    </ul>
  </div>
</section>

<section class="slide" data-slide-title="Analytical Query Architecture">
  <div class="slide-badge">Week 9 • Slide 4 of 5</div>
  <h2 class="slide-title">Transitioning from OLTP to Analytical Marts</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">In weeks 10-16, you will master Kimball Dimensional Modeling to construct analytical reporting marts that answer complex business questions in milliseconds.</p>
  </div>
</section>

<section class="slide" data-slide-title="Week 9 Summary">
  <div class="slide-badge">Week 9 • Slide 5 of 5</div>
  <h2 class="slide-title">Week 9 Summary</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">Do not run heavy business intelligence queries directly against operational OLTP transaction tables. Build dedicated dimensional data marts.</p>
  </div>
</section>
`,
    quizData: [
      {
        id: 'w9-q1',
        question: 'Which characteristic is typical of an OLAP (Online Analytical Processing) system compared to an OLTP system?',
        options: [
          'High frequency of single-row INSERT/UPDATE transactions',
          'Strict 3NF normalization with zero redundant attributes',
          'Complex queries scanning millions of historical rows with aggregations and grouping',
          'Sub-millisecond write transactions for cash register checkouts'
        ],
        correctIndex: 2,
        explanation: 'OLAP systems are optimized for analytical read queries across millions of rows to compute aggregations, metrics, and business trends.'
      },
      {
        id: 'w9-q2',
        question: 'Why does running heavy analytical aggregation queries directly on a production OLTP database cause operational issues?',
        options: [
          'It can lock tables, consume CPU/memory, and degrade transaction throughput for real-time customer checkouts',
          'PostgreSQL crashes if any SELECT statement reads more than 50 rows',
          'OLTP databases automatically delete data after it is read once',
          'OLTP engines do not support the SUM() function'
        ],
        correctIndex: 0,
        explanation: 'Heavy analytical queries monopolize server IO, CPU, and buffer cache, causing high latency or lock timeouts for critical customer-facing transactions.'
      },
      {
        id: 'w9-q3',
        question: 'What does "Non-Volatile" mean in the context of a Data Warehouse?',
        options: [
          'Data changes constantly every millisecond',
          'Once loaded, historical warehouse data is never overwritten or deleted; it is immutable for historical audit fidelity',
          'The warehouse hardware is immune to power outages',
          'All columns are converted to text format'
        ],
        correctIndex: 1,
        explanation: 'Non-volatile means analytical data is loaded and retained as permanent historical snapshots. You do not update past transaction facts.'
      }
    ],
    project: {
      id: 'c1f2e3d4-1111-4444-8888-000000000109',
      title: 'Week 9 Mini-Project: OLTP vs. OLAP Performance Benchmarking & Reporting Table',
      slug: 'w9-project-oltp-olap',
      type: 'analytics_query',
      maxScore: 100,
      weightPercentage: 0.0,
      businessCase: `# Week 9 Mini-Project: Analytical Reporting Transformation

### Business Context
The BI team needs an aggregated reporting dataset calculating cumulative customer orders, total spend, and product diversity metrics to avoid repeated full table scans on operational tables.
`,
      starterSql: `-- Week 9: Analytical Aggregated Customer Reporting Metric
SELECT
    c.id AS customer_id,
    c.full_name,
    COUNT(DISTINCT o.id) AS total_orders,
    COALESCE(SUM(oi.quantity * (oi.unit_price - oi.discount)), 0) AS total_revenue
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY c.id, c.full_name
ORDER BY total_revenue DESC;`,
      solutionSql: `SELECT
    c.id AS customer_id,
    c.full_name,
    COUNT(DISTINCT o.id) AS total_orders,
    COALESCE(SUM(oi.quantity * (oi.unit_price - oi.discount)), 0) AS total_revenue
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY c.id, c.full_name
ORDER BY total_revenue DESC;`,
      verificationSql: `SELECT COUNT(*) AS mismatch_count FROM (
  SELECT customer_id, full_name, total_orders, total_revenue FROM (
    {{STUDENT_SQL}}
  ) s
  EXCEPT
  SELECT customer_id, full_name, total_orders, total_revenue FROM (
    SELECT
        c.id AS customer_id,
        c.full_name,
        COUNT(DISTINCT o.id) AS total_orders,
        COALESCE(SUM(oi.quantity * (oi.unit_price - oi.discount)), 0) AS total_revenue
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    GROUP BY c.id, c.full_name
  ) ref
) diff;`,
      rubric: [
        { criterion: 'Clean customer aggregation grain', points: 40 },
        { criterion: 'Accurate discount-adjusted revenue calculation', points: 30 },
        { criterion: 'Clean descending revenue sort', points: 30 }
      ]
    }
  },

  // WEEK 10
  {
    num: 10,
    title: 'Week 10: Dimensional Modeling Fundamentals (Facts & Dimensions)',
    slug: 'w10-facts-and-dimensions',
    desc: 'Fact table grain, additive and semi-additive metrics',
    lectureSlidesHtml: `
<section class="slide" data-slide-title="Kimball Dimensional Modeling">
  <div class="slide-badge">Week 10 • Slide 1 of 5</div>
  <h2 class="slide-title">Facts and Dimensions (The Kimball Architecture)</h2>
  <div class="slide-body">
    <p class="slide-lead">Ralph Kimball's dimensional design organizes business measurements into two distinct categories.</p>
    <div class="grid grid-cols-2 gap-3 my-3">
      <div class="p-3 bg-white border rounded text-xs">
        <h4 class="font-bold text-zinc-900">Fact Tables (The Measurements)</h4>
        <p class="text-zinc-600 mt-1">Contain numerical metrics recorded from a business event (e.g., <code>quantity_sold</code>, <code>gross_revenue</code>, <code>discount_amount</code>).</p>
      </div>
      <div class="p-3 bg-white border rounded text-xs">
        <h4 class="font-bold text-zinc-900">Dimension Tables (The Context)</h4>
        <p class="text-zinc-600 mt-1">Contain descriptive textual attributes providing the "who, what, where, when, why" (e.g., Customer, Product, Store, Date).</p>
      </div>
    </div>
  </div>
</section>

<section class="slide" data-slide-title="The Central Importance of Fact Grain">
  <div class="slide-badge">Week 10 • Slide 2 of 5</div>
  <h2 class="slide-title">Declaring the Fact Table Grain</h2>
  <div class="slide-body">
    <div class="p-4 bg-zinc-900 text-zinc-100 rounded text-xs font-mono my-2">
      "One row in the sales_fact table represents one individual line item product scanned at a retail checkout register."
    </div>
    <p class="text-xs text-zinc-600">Golden Rule: You cannot mix different grains in the same fact table! E.g., Do not mix monthly budget totals with individual daily transactions.</p>
  </div>
</section>

<section class="slide" data-slide-title="Types of Fact Metrics">
  <div class="slide-badge">Week 10 • Slide 3 of 5</div>
  <h2 class="slide-title">Additive, Semi-Additive & Non-Additive Facts</h2>
  <div class="slide-body">
    <ul class="text-xs text-zinc-700 space-y-2">
      <li><strong>Fully Additive:</strong> Can be meaningfully summed across all dimensions (e.g., <code>sales_revenue</code>, <code>units_sold</code>).</li>
      <li><strong>Semi-Additive:</strong> Can be summed across some dimensions, but NOT time (e.g., Bank account balance, warehouse inventory level—you cannot sum yesterday's balance with today's!).</li>
      <li><strong>Non-Additive:</strong> Cannot be summed across any dimension (e.g., Unit profit margin %, temperature). Must calculate via ratios.</li>
    </ul>
  </div>
</section>

<section class="slide" data-slide-title="Dimensional Conformance">
  <div class="slide-badge">Week 10 • Slide 4 of 5</div>
  <h2 class="slide-title">Conformed Dimensions</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">A conformed dimension means the exact same dimension table (e.g., <code>dim_date</code>, <code>dim_customer</code>) is shared consistently across multiple enterprise fact tables, enabling cross-process analytics.</p>
  </div>
</section>

<section class="slide" data-slide-title="Week 10 Summary">
  <div class="slide-badge">Week 10 • Slide 5 of 5</div>
  <h2 class="slide-title">Week 10 Summary</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">Identify the business process, declare the grain, identify the dimensions, and identify the numeric facts.</p>
  </div>
</section>
`,
    quizData: [
      {
        id: 'w10-q1',
        question: 'Which of the following metrics is considered a "Semi-Additive" fact?',
        options: [
          'Total dollar amount of customer purchases',
          'Bank account end-of-day balance (cannot be summed across the Time dimension)',
          'Quantity of items shipped in an order',
          'Count of website page views'
        ],
        correctIndex: 1,
        explanation: 'Bank balances or inventory levels are semi-additive: summing balances across days makes no financial sense (you do not have the sum of your balance Monday + Tuesday).'
      },
      {
        id: 'w10-q2',
        question: 'What is the most critical first step before designing a dimensional fact table according to Ralph Kimball?',
        options: [
          'Writing PostgreSQL stored procedures',
          'Declaring the precise business grain of the fact table',
          'Purchasing enterprise BI software licenses',
          'Denormalizing all customer addresses into a single string'
        ],
        correctIndex: 1,
        explanation: 'Declaring the grain is the fundamental step. The grain establishes the exact real-world event represented by a single fact row.'
      },
      {
        id: 'w10-q3',
        question: 'In dimensional modeling, what are "Conformed Dimensions"?',
        options: [
          'Dimensions that are shared and identical across multiple enterprise fact tables',
          'Dimensions that have been converted to Third Normal Form',
          'Tables that contain only foreign keys and zero text attributes',
          'Temporary tables that are dropped at the end of each SQL session'
        ],
        correctIndex: 0,
        explanation: 'Conformed dimensions are standardized across the enterprise (like Date or Customer) so multiple business processes can be joined and compared seamlessly.'
      }
    ],
    project: {
      id: 'c1f2e3d4-1111-4444-8888-000000000110',
      title: 'Week 10 Mini-Project: Fact and Dimension Grain Modeling',
      slug: 'w10-project-fact-grain',
      type: 'analytics_query',
      maxScore: 100,
      weightPercentage: 0.0,
      businessCase: `# Week 10 Mini-Project: Fact Table Grain Analysis

### Business Context
Verify dimensional granularity across products and customer order line items to calculate item-level margins and line revenue.
`,
      starterSql: `-- Week 10: Fact Line Item Margin & Revenue Calculation
SELECT
    p.category,
    COUNT(oi.id) AS total_line_items,
    SUM(oi.quantity) AS total_units_sold,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS gross_revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
GROUP BY p.category
ORDER BY gross_revenue DESC;`,
      solutionSql: `SELECT
    p.category,
    COUNT(oi.id) AS total_line_items,
    SUM(oi.quantity) AS total_units_sold,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS gross_revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
GROUP BY p.category
ORDER BY gross_revenue DESC;`,
      verificationSql: `SELECT COUNT(*) AS mismatch_count FROM (
  SELECT category, total_line_items, total_units_sold, gross_revenue FROM (
    {{STUDENT_SQL}}
  ) s
  EXCEPT
  SELECT category, total_line_items, total_units_sold, gross_revenue FROM (
    SELECT
        p.category,
        COUNT(oi.id) AS total_line_items,
        SUM(oi.quantity) AS total_units_sold,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS gross_revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    GROUP BY p.category
  ) ref
) diff;`,
      rubric: [
        { criterion: 'Accurate product category grain aggregation', points: 40 },
        { criterion: 'Total units sold summation', points: 30 },
        { criterion: 'Gross revenue calculation', points: 30 }
      ]
    }
  },

  // WEEK 11: Project 3 (Star Schema) - Already has project in seed
  {
    num: 11,
    title: 'Week 11: Star Schema & Snowflake Schema Architecture',
    slug: 'w11-star-and-snowflake-schemas',
    desc: 'Star Schema design, dimensional 1:M relationships, date dimensions',
    lectureSlidesHtml: `
<section class="slide" data-slide-title="The Star Schema">
  <div class="slide-badge">Week 11 • Slide 1 of 5</div>
  <h2 class="slide-title">Star Schema Architecture</h2>
  <div class="slide-body">
    <p class="slide-lead">A central Fact table surrounded by radially connected Dimension tables via simple One-to-Many relationships.</p>
    <div class="p-3 bg-zinc-100 rounded text-xs font-mono my-3">
              [dim_customer]       [dim_product]<br/>
                     \\               /<br/>
                      \\             /<br/>
                   [fact_sales_orders]<br/>
                      /             \\<br/>
                     /               \\<br/>
                [dim_date]        [dim_store]
    </div>
  </div>
</section>

<section class="slide" data-slide-title="Star vs Snowflake Schema">
  <div class="slide-badge">Week 11 • Slide 2 of 5</div>
  <h2 class="slide-title">Star Schema vs Snowflake Schema</h2>
  <div class="slide-body">
    <div class="grid grid-cols-2 gap-3 my-3">
      <div class="p-3 border rounded text-xs">
        <h4 class="font-bold text-zinc-900">Star Schema (Industry Standard)</h4>
        <p class="text-zinc-600 mt-1">• Dimensions are completely denormalized.<br/>• Every dimension joins directly to fact with 1 hop.<br/>• Maximizes analytical query speed and simplicity.</p>
      </div>
      <div class="p-3 border rounded text-xs">
        <h4 class="font-bold text-zinc-900">Snowflake Schema</h4>
        <p class="text-zinc-600 mt-1">• Dimensions are normalized into secondary sub-tables (e.g. Product -> Category -> Department).<br/>• Saves minor disk space at the cost of multiple expensive joins.</p>
      </div>
    </div>
  </div>
</section>

<section class="slide" data-slide-title="The Role of Surrogate Keys in Warehouses">
  <div class="slide-badge">Week 11 • Slide 3 of 5</div>
  <h2 class="slide-title">Surrogate Keys in Data Warehousing</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">Never use natural operational keys as primary keys in dimension tables! Surrogate keys (e.g., <code>customer_key INT</code> or <code>UUID</code>) allow the warehouse to integrate multiple source systems and manage historical dimension changes.</p>
  </div>
</section>

<section class="slide" data-slide-title="Engineering the Date Dimension">
  <div class="slide-badge">Week 11 • Slide 4 of 5</div>
  <h2 class="slide-title">The Master Date Dimension (dim_date)</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">Pre-populating 10-20 years of dates with fiscal quarters, day of week, holiday flags, and business day indicators eliminates complex date math from analytical SQL.</p>
  </div>
</section>

<section class="slide" data-slide-title="Week 11 Summary">
  <div class="slide-badge">Week 11 • Slide 5 of 5</div>
  <h2 class="slide-title">Week 11 Summary</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">Proceed to Project 3: E-Commerce Analytics Star Schema to build facts, dimensions, and reporting queries.</p>
  </div>
</section>
`,
    quizData: [
      {
        id: 'w11-q1',
        question: 'Why do analytical data warehouse engineers strongly prefer Star Schemas over Snowflake Schemas in production?',
        options: [
          'Because Star Schemas eliminate multi-hop joins between sub-dimensions, optimizing query execution speed in analytical engines',
          'Because Snowflake Schemas cannot store dates',
          'Because Star Schemas take up zero megabytes on disk',
          'Because PostgreSQL refuses to run Snowflake queries'
        ],
        correctIndex: 0,
        explanation: 'Star schemas denormalize dimensions so any filter or group-by requires exactly one direct join to the central fact table, providing predictable, high query throughput.'
      },
      {
        id: 'w11-q2',
        question: 'Why is a pre-calculated Date Dimension (dim_date) table critical in a data warehouse?',
        options: [
          'It replaces the operating system clock',
          'It pre-computes fiscal quarters, holidays, day of week names, and business day flags, eliminating slow runtime string conversions',
          'To encrypt financial timestamps',
          'Because PostgreSQL cannot parse timestamps natively'
        ],
        correctIndex: 1,
        explanation: 'A Date dimension provides calendar attributes (fiscal periods, holiday flags, seasons) ready for grouping without expensive date calculation functions in every query.'
      },
      {
        id: 'w11-q3',
        question: 'In a Star Schema, what is the cardinality of the relationship between a Dimension table and the Fact table?',
        options: [
          'One-to-One (1:1)',
          'One Dimension row to Many Fact rows (1:M)',
          'Many Dimension rows to One Fact row (M:1)',
          'Many-to-Many (M:N)'
        ],
        correctIndex: 1,
        explanation: 'One dimension record (e.g. one Product) associates with many transaction records (Many Fact rows) over time: a 1:M relationship.'
      }
    ],
    project: {
      id: 'c1f2e3d4-1111-4444-8888-000000000111',
      title: 'Week 11 Python Project: E-Commerce RFM Customer Segmentation & Behavioral Scatter',
      slug: 'w11-project-rfm-segmentation',
      type: 'python_analytics',
      language: 'python',
      maxScore: 100,
      weightPercentage: 5,
      businessCase: `# Business Case: Customer RFM Segmentation & Valuation Modeling

## Context
"OmniRetail" wants to classify customer accounts using RFM (Recency, Frequency, Monetary) analytics to target high-value buyers and reactivate churned customers.

## Tasks:
1. Join \`customers\`, \`orders\`, and \`order_items\` via PostgreSQL read query.
2. Group by \`customer_id\` and compute:
   - \`recency\`: Number of days from the customer's latest order to reference date \`2026-11-15\`.
   - \`frequency\`: Total unique orders per customer.
   - \`monetary\`: Total spend per customer (sum of \`quantity * (unit_price - discount)\`).
3. Store in variable \`rfm_df\` with columns: \`customer_id\`, \`recency\`, \`frequency\`, \`monetary\`.
4. Generate a Matplotlib scatter plot of Recency vs Monetary spend.`,
      starterPython: `# Week 11 Python Analytics Project: RFM Customer Segmentation
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# 1. Extract unified transaction dataset from PostgreSQL
query = """
SELECT 
    c.id AS customer_id,
    c.full_name,
    o.id AS order_id,
    o.order_date,
    oi.quantity * (oi.unit_price - oi.discount) AS item_spend
FROM customers c
JOIN orders o ON c.id = o.customer_id
JOIN order_items oi ON o.id = oi.order_id
"""
df_transactions = pd.read_sql(query, conn)
df_transactions['order_date'] = pd.to_datetime(df_transactions['order_date'])

# 2. Compute RFM dataframe 'rfm_df' relative to '2026-11-15'
ref_date = pd.to_datetime('2026-11-15', utc=True)
rfm_df = df_transactions.groupby('customer_id').agg(
    recency=('order_date', lambda d: int((ref_date - d.max()).total_seconds() // 86400)),
    frequency=('order_id', 'nunique'),
    monetary=('item_spend', 'sum')
).reset_index()

# 3. Plot Recency vs Monetary scatter visualization
plt.figure(figsize=(6, 4))
plt.scatter(rfm_df['recency'], rfm_df['monetary'], s=rfm_df['frequency'] * 50, color='#2563EB', alpha=0.7)
plt.title('Customer Recency vs Monetary Spend')
plt.xlabel('Recency (Days)')
plt.ylabel('Monetary ($)')
plt.grid(True, linestyle='--', alpha=0.5)
plt.tight_layout()
`,
      solutionPython: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

query = """
SELECT 
    c.id AS customer_id,
    c.full_name,
    o.id AS order_id,
    o.order_date,
    oi.quantity * (oi.unit_price - oi.discount) AS item_spend
FROM customers c
JOIN orders o ON c.id = o.customer_id
JOIN order_items oi ON o.id = oi.order_id
"""
df_transactions = pd.read_sql(query, conn)
df_transactions['order_date'] = pd.to_datetime(df_transactions['order_date'])

ref_date = pd.to_datetime('2026-11-15', utc=True)
rfm_df = df_transactions.groupby('customer_id').agg(
    recency=('order_date', lambda d: int((ref_date - d.max()).total_seconds() // 86400)),
    frequency=('order_id', 'nunique'),
    monetary=('item_spend', 'sum')
).reset_index()

plt.figure(figsize=(6, 4))
plt.scatter(rfm_df['recency'], rfm_df['monetary'], s=rfm_df['frequency'] * 50, color='#2563EB', alpha=0.7)
plt.title('Customer Recency vs Monetary Spend')
plt.xlabel('Recency (Days)')
plt.ylabel('Monetary ($)')
plt.grid(True, linestyle='--', alpha=0.5)
plt.tight_layout()
`,
      verificationPython: `assert 'rfm_df' in locals(), "Expected DataFrame 'rfm_df' to be created"
assert isinstance(rfm_df, pd.DataFrame), "'rfm_df' must be a pandas DataFrame"
for col in ['customer_id', 'recency', 'frequency', 'monetary']:
    assert col in rfm_df.columns, f"Missing required column '{col}' in rfm_df"
assert len(rfm_df) == 5, f"Expected 5 customer RFM rows, found {len(rfm_df)}"
assert rfm_df['monetary'].sum() > 1000, "Monetary sum did not match expected business total"
`,
      rubric: [
        { criterion: 'Relational Star Schema query joining orders and items', points: 30 },
        { criterion: 'Accurate Recency, Frequency, Monetary calculation in Pandas', points: 40 },
        { criterion: 'RFM distribution visualization generated', points: 30 }
      ]
    }
  },

  // WEEK 12
  {
    num: 12,
    title: 'Week 12: Advanced Dimensional Modeling & Slowly Changing Dimensions (SCD)',
    slug: 'w12-slowly-changing-dimensions',
    desc: 'SCD Type 1, Type 2, and Type 3 temporal tracking',
    lectureSlidesHtml: `
<section class="slide" data-slide-title="Slowly Changing Dimensions">
  <div class="slide-badge">Week 12 • Slide 1 of 5</div>
  <h2 class="slide-title">Slowly Changing Dimensions (SCD)</h2>
  <div class="slide-body">
    <p class="slide-lead">How do we track historical changes over time when business reality mutates?</p>
    <div class="p-3 bg-zinc-50 border rounded text-xs text-zinc-700 my-3">
      Scenario: Customer Sokha moves from "Phnom Penh" to "Siem Reap" on June 1st. If we overwrite her city, past sales reports for Phnom Penh will incorrectly lose her past \$10,000 revenue!
    </div>
  </div>
</section>

<section class="slide" data-slide-title="Kimball SCD Types">
  <div class="slide-badge">Week 12 • Slide 2 of 5</div>
  <h2 class="slide-title">SCD Type 1, Type 2, Type 3</h2>
  <div class="slide-body">
    <div class="space-y-2 text-xs">
      <div class="p-2 border rounded"><strong>Type 1 (Overwrite):</strong> Destroys history. Overwrites old value with new. Used only for typo corrections.</div>
      <div class="p-2 border border-zinc-900 bg-zinc-50 rounded"><strong>Type 2 (Add New Row - Gold Standard):</strong> Retains full history. Creates a new row with new surrogate key, <code>valid_from</code>, <code>valid_to</code>, and <code>is_current = true</code>.</div>
      <div class="p-2 border rounded"><strong>Type 3 (Previous Value Column):</strong> Adds a <code>previous_city</code> column. Only tracks one level of history.</div>
    </div>
  </div>
</section>

<section class="slide" data-slide-title="Implementing SCD Type 2 in PostgreSQL">
  <div class="slide-badge">Week 12 • Slide 3 of 5</div>
  <h2 class="slide-title">PostgreSQL SCD Type 2 Schema</h2>
  <div class="slide-body">
    <pre class="bg-zinc-900 text-zinc-100 p-3 rounded text-xs font-mono overflow-x-auto">
CREATE TABLE dim_customer (
    customer_key UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Warehouse Surrogate
    customer_natural_id VARCHAR(50) NOT NULL,                -- Operational ID
    city VARCHAR(100) NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ,
    is_current BOOLEAN NOT NULL DEFAULT TRUE
);</pre>
  </div>
</section>

<section class="slide" data-slide-title="Time-Slice Queries">
  <div class="slide-badge">Week 12 • Slide 4 of 5</div>
  <h2 class="slide-title">Querying Point-in-Time History</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">To query state as of a historic date <code>'2026-03-15'</code>:</p>
    <pre class="bg-zinc-100 text-zinc-900 p-2 rounded text-xs font-mono my-2">WHERE transaction_date BETWEEN valid_from AND COALESCE(valid_to, '9999-12-31')</pre>
  </div>
</section>

<section class="slide" data-slide-title="Week 12 Summary">
  <div class="slide-badge">Week 12 • Slide 5 of 5</div>
  <h2 class="slide-title">Week 12 Summary</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">SCD Type 2 guarantees historical reporting fidelity without sacrificing current-state lookups.</p>
  </div>
</section>
`,
    quizData: [
      {
        id: 'w12-q1',
        question: 'Which Slowly Changing Dimension (SCD) type preserves complete historical truth by adding a new row with validity timestamps?',
        options: [
          'SCD Type 0',
          'SCD Type 1',
          'SCD Type 2',
          'SCD Type 3'
        ],
        correctIndex: 2,
        explanation: 'SCD Type 2 tracks historical changes by inserting a new record with effective date ranges (valid_from, valid_to) and an is_current flag.'
      },
      {
        id: 'w12-q2',
        question: 'When is it appropriate to use SCD Type 1 (Overwrite)?',
        options: [
          'When correcting an obvious spelling error in a customer\'s name that has no analytical significance',
          'When a customer relocates to a different sales territory',
          'When tracking monthly stock inventory prices over 10 years',
          'Whenever a new financial quarter begins'
        ],
        correctIndex: 0,
        explanation: 'SCD Type 1 overwrites existing values and should only be used for correcting administrative typos where preserving past misspellings is irrelevant.'
      },
      {
        id: 'w12-q3',
        question: 'In an SCD Type 2 dimension table, why must each row have a new surrogate primary key rather than reusing the natural key?',
        options: [
          'Because PostgreSQL primary keys must be strictly unique; a natural key will appear multiple times across historical versions',
          'Because natural keys cannot be queried in SQL',
          'Because surrogate keys take zero bytes of RAM',
          'To satisfy First Normal Form only'
        ],
        correctIndex: 0,
        explanation: 'Since the same natural entity will have multiple version rows over time, the natural key is no longer unique. A unique surrogate key is required for primary identity.'
      }
    ],
    project: {
      id: 'c1f2e3d4-1111-4444-8888-000000000112',
      title: 'Week 12 Mini-Project: Slowly Changing Dimensions (SCD Type 2) Implementation',
      slug: 'w12-project-scd-type-2',
      type: 'ddl_schema',
      maxScore: 100,
      weightPercentage: 0.0,
      businessCase: `# Week 12 Mini-Project: Temporal Dimension Analysis

### Business Context
Verify temporal customer subscriptions and status distributions across plan tiers for historical retention reporting.
`,
      starterSql: `-- Week 12: Active vs Canceled Subscription Tier Analysis
SELECT
    p.plan_name,
    s.status,
    COUNT(s.id) AS subscription_count
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
GROUP BY p.plan_name, s.status
ORDER BY p.plan_name, s.status;`,
      solutionSql: `SELECT
    p.plan_name,
    s.status,
    COUNT(s.id) AS subscription_count
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
GROUP BY p.plan_name, s.status
ORDER BY p.plan_name, s.status;`,
      verificationSql: `SELECT COUNT(*) AS mismatch_count FROM (
  SELECT plan_name, status, subscription_count FROM (
    {{STUDENT_SQL}}
  ) s
  EXCEPT
  SELECT plan_name, status, subscription_count FROM (
    SELECT
        p.plan_name,
        s.status,
        COUNT(s.id) AS subscription_count
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    GROUP BY p.plan_name, s.status
  ) ref
) diff;`,
      rubric: [
        { criterion: 'Accurate grouping across plan name and status', points: 40 },
        { criterion: 'Subscription count aggregation', points: 30 },
        { criterion: 'Clean deterministic sort order', points: 30 }
      ]
    }
  },

  // WEEK 13
  {
    num: 13,
    title: 'Week 13: PostgreSQL for Analytics: Materialized Views & Indexing',
    slug: 'w13-materialized-views-indexing',
    desc: 'Materialized aggregates, BRIN indexes, window functions',
    lectureSlidesHtml: `
<section class="slide" data-slide-title="PostgreSQL Analytical Engine">
  <div class="slide-badge">Week 13 • Slide 1 of 5</div>
  <h2 class="slide-title">PostgreSQL Materialized Views & Indexing</h2>
  <div class="slide-body">
    <p class="slide-lead">Accelerating analytical aggregates from seconds to microseconds.</p>
    <div class="p-3 bg-zinc-100 rounded text-xs font-mono my-3">
CREATE MATERIALIZED VIEW mv_daily_sales_summary AS
SELECT
    DATE_TRUNC('day', order_date) AS sales_day,
    COUNT(id) AS total_orders,
    SUM(total_amount) AS revenue
FROM orders
GROUP BY DATE_TRUNC('day', order_date);</div>
  </div>
</section>

<section class="slide" data-slide-title="Refreshing Materialized Views">
  <div class="slide-badge">Week 13 • Slide 2 of 5</div>
  <h2 class="slide-title">Concurrent Refreshing</h2>
  <div class="slide-body">
    <pre class="bg-zinc-900 text-zinc-100 p-3 rounded text-xs font-mono overflow-x-auto">
-- Requires a UNIQUE index on the materialized view
CREATE UNIQUE INDEX idx_mv_daily_sales ON mv_daily_sales_summary(sales_day);

-- Concurrent refresh allows ongoing analytical reads without locking!
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales_summary;</pre>
  </div>
</section>

<section class="slide" data-slide-title="BRIN Indexes for Timeseries">
  <div class="slide-badge">Week 13 • Slide 3 of 5</div>
  <h2 class="slide-title">BRIN (Block Range Index)</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">For huge append-only timeseries tables (100M+ rows), B-Tree indexes consume gigabytes of RAM. BRIN stores only min/max ranges per disk page, taking 99% less storage with comparable scan speed.</p>
  </div>
</section>

<section class="slide" data-slide-title="Analytical Window Functions">
  <div class="slide-badge">Week 13 • Slide 4 of 5</div>
  <h2 class="slide-title">Advanced Analytical Window Functions</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">Calculate cumulative revenue running totals, moving 7-day averages, and quintile rankings without self-joins:</p>
    <pre class="bg-zinc-100 text-zinc-900 p-2 rounded text-xs font-mono my-2">SUM(revenue) OVER (PARTITION BY region ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)</pre>
  </div>
</section>

<section class="slide" data-slide-title="Week 13 Summary">
  <div class="slide-badge">Week 13 • Slide 5 of 5</div>
  <h2 class="slide-title">Week 13 Summary</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">Materialized views, BRIN indexes, and window calculations form the high-performance core of PostgreSQL analytics.</p>
  </div>
</section>
`,
    quizData: [
      {
        id: 'w13-q1',
        question: 'What requirement must be met before running "REFRESH MATERIALIZED VIEW CONCURRENTLY" in PostgreSQL?',
        options: [
          'The materialized view must have at least one UNIQUE index on columns that uniquely identify each row',
          'The PostgreSQL server must be restarted in single-user mode',
          'All tables in the database must be truncated',
          'The query must contain zero WHERE clauses'
        ],
        correctIndex: 0,
        explanation: 'PostgreSQL requires a UNIQUE index on the materialized view so it can execute diff-based updates in place without locking readers.'
      },
      {
        id: 'w13-q2',
        question: 'Why are BRIN (Block Range Indexes) particularly efficient for massive chronological log or order tables in PostgreSQL?',
        options: [
          'They store min/max values for disk page blocks, consuming a tiny fraction of the memory required by a B-Tree index',
          'They automatically convert PostgreSQL to MySQL syntax',
          'They disable write transactions completely',
          'They encrypt the table data with AES-256'
        ],
        correctIndex: 0,
        explanation: 'BRIN indexes leverage the physical correlation between insertion order and chronological time, indexing disk block ranges with minuscule storage overhead.'
      },
      {
        id: 'w13-q3',
        question: 'What is the advantage of using SQL Window Functions (e.g. SUM() OVER (...)) over traditional GROUP BY aggregations?',
        options: [
          'Window functions allow computing cumulative totals and rankings without collapsing individual rows of the output',
          'Window functions work only on spreadsheets',
          'They eliminate the need for primary keys',
          'They run only during database backups'
        ],
        correctIndex: 0,
        explanation: 'Window functions calculate aggregate metrics over a window partition while retaining the individual grain and details of every row.'
      }
    ],
    project: {
      id: 'c1f2e3d4-1111-4444-8888-000000000113',
      title: 'Week 13 Mini-Project: Materialized Views & High-Performance Analytical Aggregation',
      slug: 'w13-project-materialized-views',
      type: 'analytics_query',
      maxScore: 100,
      weightPercentage: 0.0,
      businessCase: `# Week 13 Mini-Project: Materialized Analytical Performance

### Business Context
Construct a high-performance query evaluating cumulative running spend and RFM quintiles across top customer accounts.
`,
      starterSql: `-- Week 13: Customer RFM Quintile & Running Total
SELECT
    c.id AS customer_id,
    c.full_name,
    COALESCE(SUM(oi.quantity * (oi.unit_price - oi.discount)), 0) AS total_spend,
    NTILE(5) OVER (ORDER BY COALESCE(SUM(oi.quantity * (oi.unit_price - oi.discount)), 0) DESC) AS spend_quintile
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY c.id, c.full_name
ORDER BY total_spend DESC;`,
      solutionSql: `SELECT
    c.id AS customer_id,
    c.full_name,
    COALESCE(SUM(oi.quantity * (oi.unit_price - oi.discount)), 0) AS total_spend,
    NTILE(5) OVER (ORDER BY COALESCE(SUM(oi.quantity * (oi.unit_price - oi.discount)), 0) DESC) AS spend_quintile
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY c.id, c.full_name
ORDER BY total_spend DESC;`,
      verificationSql: `SELECT COUNT(*) AS mismatch_count FROM (
  SELECT customer_id, full_name, total_spend, spend_quintile FROM (
    {{STUDENT_SQL}}
  ) s
  EXCEPT
  SELECT customer_id, full_name, total_spend, spend_quintile FROM (
    SELECT
        c.id AS customer_id,
        c.full_name,
        COALESCE(SUM(oi.quantity * (oi.unit_price - oi.discount)), 0) AS total_spend,
        NTILE(5) OVER (ORDER BY COALESCE(SUM(oi.quantity * (oi.unit_price - oi.discount)), 0) DESC) AS spend_quintile
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    GROUP BY c.id, c.full_name
  ) ref
) diff;`,
      rubric: [
        { criterion: 'Accurate discount-adjusted total spend calculation', points: 40 },
        { criterion: 'NTILE(5) window ranking implementation', points: 30 },
        { criterion: 'Clean descending spend sort', points: 30 }
      ]
    }
  },

  // WEEK 14: Capstone Phase 1 - Already has project in seed
  {
    num: 14,
    title: 'Week 14: Capstone Phase 1: Physical Warehouse Implementation',
    slug: 'w14-capstone-phase-1',
    desc: 'Full DDL deployment and initial data warehouse seeding',
    lectureSlidesHtml: `
<section class="slide" data-slide-title="Capstone Architecture">
  <div class="slide-badge">Week 14 • Slide 1 of 4</div>
  <h2 class="slide-title">Capstone Phase 1: Physical Warehouse Implementation</h2>
  <div class="slide-body">
    <p class="slide-lead">Designing the complete end-to-end Enterprise Data Platform.</p>
    <ul class="text-xs text-zinc-700 space-y-2 my-3">
      <li>• Deploy fact and conformed dimension DDL scripts in PostgreSQL.</li>
      <li>• Implement ELT transformation logic populating analytical warehouse tables.</li>
      <li>• Maintain strict referential integrity across dimensional relationships.</li>
    </ul>
  </div>
</section>

<section class="slide" data-slide-title="ELT Pipeline Architecture">
  <div class="slide-badge">Week 14 • Slide 2 of 4</div>
  <h2 class="slide-title">Extract - Load - Transform (ELT)</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">Modern data stacks leverage PostgreSQL's analytical engine to execute in-database transformations using CTEs and window queries rather than external ETL processing.</p>
  </div>
</section>

<section class="slide" data-slide-title="Verification Strategy">
  <div class="slide-badge">Week 14 • Slide 3 of 4</div>
  <h2 class="slide-title">Milestone 1 Verification Strategy</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">Deploy your physical schema DDL, verify table creation via schema inspector, and run test assertions in the sandbox.</p>
  </div>
</section>

<section class="slide" data-slide-title="Week 14 Next Steps">
  <div class="slide-badge">Week 14 • Slide 4 of 4</div>
  <h2 class="slide-title">Next Steps</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">Complete the Capstone Phase 1 quiz, then submit your physical warehouse DDL deployment in the Project tab.</p>
  </div>
</section>
`,
    quizData: [
      {
        id: 'w14-q1',
        question: 'What distinguishes an ELT (Extract-Load-Transform) pipeline from a legacy ETL pipeline?',
        options: [
          'Transformations occur inside the target data warehouse engine after raw data is loaded, leveraging the database\'s parallel processing power',
          'ELT does not support SQL syntax',
          'ELT is only used for audio files',
          'ELT requires zero storage space'
        ],
        correctIndex: 0,
        explanation: 'ELT loads raw or lightly structured data directly into the warehouse, performing heavy modeling transformations using SQL inside the database engine.'
      },
      {
        id: 'w14-q2',
        question: 'When loading historical facts into an analytical data warehouse, how should duplicate transaction prevention be handled?',
        options: [
          'Using ON CONFLICT (transaction_id, date_key) DO NOTHING or DO UPDATE',
          'Dropping the entire database every night',
          'Ignoring duplicates because analytics does not care about accuracy',
          'Manually inspecting every row in Excel'
        ],
        correctIndex: 0,
        explanation: 'PostgreSQL\'s ON CONFLICT clause guarantees idempotent batch loads, avoiding duplicate fact records if an ELT pipeline is rerun.'
      },
      {
        id: 'w14-q3',
        question: 'What is a "Factless Fact Table"?',
        options: [
          'A table with no numerical measurement columns, used exclusively to record occurrences of events or coverage relationships (e.g., student attendance)',
          'A corrupted table that lost its data',
          'A table that has no primary key',
          'A view that returns zero rows'
        ],
        correctIndex: 0,
        explanation: 'A factless fact table records the occurrence of an event (like college course attendance or product promotions) where the key associations themselves are the analytical fact.'
      }
    ]
  },

  // WEEK 15: Capstone Phase 2 - Already has project in seed
  {
    num: 15,
    title: 'Week 15: Capstone Phase 2: Business Intelligence Validation',
    slug: 'w15-capstone-phase-2',
    desc: 'Advanced analytical reporting, YoY growth, cohort retention queries',
    lectureSlidesHtml: `
<section class="slide" data-slide-title="BI Validation">
  <div class="slide-badge">Week 15 • Slide 1 of 4</div>
  <h2 class="slide-title">Capstone Phase 2: Business Intelligence Validation</h2>
  <div class="slide-body">
    <p class="slide-lead">Authoring executive-ready analytical queries and cohort retention matrices.</p>
    <ul class="text-xs text-zinc-700 space-y-2 my-3">
      <li>• Calculate Year-over-Year (YoY) and Month-over-Month (MoM) revenue growth.</li>
      <li>• Construct user cohort retention heatmaps using PostgreSQL recursive CTEs.</li>
      <li>• Measure Churn Rate and Net Revenue Retention (NRR).</li>
    </ul>
  </div>
</section>

<section class="slide" data-slide-title="Cohort Analysis SQL">
  <div class="slide-badge">Week 15 • Slide 2 of 4</div>
  <h2 class="slide-title">Cohort Retention Matrix Architecture</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">Group customers by their acquisition cohort month, then calculate the percentage who remain active in Month +1, Month +2, Month +3.</p>
  </div>
</section>

<section class="slide" data-slide-title="Executive Reporting Dashboards">
  <div class="slide-badge">Week 15 • Slide 3 of 4</div>
  <h2 class="slide-title">Executive Metrics Translation</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">Learn to format database results into clean executive metrics with proper decimal rounding, percentages, and null handling.</p>
  </div>
</section>

<section class="slide" data-slide-title="Week 15 Summary">
  <div class="slide-badge">Week 15 • Slide 4 of 4</div>
  <h2 class="slide-title">Week 15 Summary</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">Take the Week 15 quiz, then complete your final BI Validation queries in the Project tab.</p>
  </div>
</section>
`,
    quizData: [
      {
        id: 'w15-q1',
        question: 'In a cohort retention analysis query, what defines a "Cohort"?',
        options: [
          'A group of customers who experienced a common event (such as signing up or making their first purchase) during the same time window',
          'All students enrolled in the university',
          'A specific PostgreSQL database cluster',
          'A foreign key index with 100% selectivity'
        ],
        correctIndex: 0,
        explanation: 'A cohort is a group of users who share a common characteristic or initiation event within a defined time period (e.g., January 2026 signups).'
      },
      {
        id: 'w15-q2',
        question: 'Which SQL function is best suited to retrieve the previous month\'s revenue for Month-over-Month (MoM) growth calculations?',
        options: [
          'LAG(monthly_revenue, 1) OVER (ORDER BY month_date)',
          'LEAD(monthly_revenue, 1) OVER (ORDER BY month_date)',
          'COUNT(*) OVER ()',
          'RANDOM()'
        ],
        correctIndex: 0,
        explanation: 'LAG() accesses data from a previous row at a specified physical offset within the window partition, perfect for MoM and YoY comparisons.'
      },
      {
        id: 'w15-q3',
        question: 'How is Net Revenue Retention (NRR) mathematically calculated for a subscription business?',
        options: [
          '(Starting MRR + Expansions - Contractions - Churn) / Starting MRR * 100%',
          'Total Gross Sales / Total Customers',
          'Average Order Value * Total Employees',
          'Sum of all active database connections'
        ],
        correctIndex: 0,
        explanation: 'NRR measures percentage of recurring revenue retained from existing customers over a period, accounting for upgrades (expansion), downgrades (contraction), and churn.'
      }
    ]
  },

  // WEEK 16: Final Examination - Already has project in seed
  {
    num: 16,
    title: 'Week 16: Final Examination & Capstone Defense',
    slug: 'w16-final-assessment',
    desc: 'Comprehensive final exam and live schema defense',
    lectureSlidesHtml: `
<section class="slide" data-slide-title="Final Assessment & Course Synthesis">
  <div class="slide-badge">Week 16 • Slide 1 of 4</div>
  <h2 class="slide-title">Week 16: Final Examination & Capstone Defense</h2>
  <div class="slide-body">
    <p class="slide-lead">Congratulations on reaching the capstone defense of the 16-Week Database Design & Analytics curriculum.</p>
    <div class="grid grid-cols-2 gap-3 my-3">
      <div class="p-3 border rounded text-xs">
        <h4 class="font-bold text-zinc-900">Foundational Mastery</h4>
        <p class="text-zinc-600 mt-1">From Business Reality, ERDs, and 3NF Normalization to physical PostgreSQL DDL execution.</p>
      </div>
      <div class="p-3 border rounded text-xs">
        <h4 class="font-bold text-zinc-900">Enterprise BI Architecture</h4>
        <p class="text-zinc-600 mt-1">Kimball Dimensional Modeling, Star Schemas, SCD Type 2, and high-performance analytical SQL.</p>
      </div>
    </div>
  </div>
</section>

<section class="slide" data-slide-title="The Modern Analytics Stack">
  <div class="slide-badge">Week 16 • Slide 2 of 4</div>
  <h2 class="slide-title">The Complete Analytics Architecture</h2>
  <div class="slide-body">
    <div class="p-3 bg-zinc-900 text-zinc-100 rounded text-xs font-mono my-2 overflow-x-auto">
[Business Transactions] ➔ [OLTP PostgreSQL (3NF)] ➔ [ELT Pipeline] ➔ [Data Warehouse (Star Schema)] ➔ [BI Analytics & Dashboards]
    </div>
  </div>
</section>

<section class="slide" data-slide-title="Final Exam Instructions">
  <div class="slide-badge">Week 16 • Slide 3 of 4</div>
  <h2 class="slide-title">Final Examination Protocol</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">1. Complete the Final Comprehensive Assessment Quiz below.<br/>2. Complete the Capstone Defense query in the Project tab.<br/>3. Verify tests pass and submit for final letter grade calculation.</p>
  </div>
</section>

<section class="slide" data-slide-title="Graduation & Certification">
  <div class="slide-badge">Week 16 • Slide 4 of 4</div>
  <h2 class="slide-title">Course Completion</h2>
  <div class="slide-body">
    <p class="text-xs text-zinc-700">Upon submission, your instructor will review the final cohort gradebook and export final university transcript records. Excellent work!</p>
  </div>
</section>
`,
    quizData: [
      {
        id: 'w16-q1',
        question: 'Which of the following architectural patterns represents the best-practice flow for business analytics data platforms?',
        options: [
          'OLTP Transactions (3NF) ➔ ELT Replication ➔ Dimensional Star Schema (Facts & Dimensions) ➔ Analytical BI Dashboards',
          'Connecting Excel directly to a production OLTP server with unindexed queries',
          'Storing all enterprise data in a single unnormalized spreadsheet',
          'Deleting database tables after every month-end close'
        ],
        correctIndex: 0,
        explanation: 'The industry gold standard separates high-speed transactional processing (3NF) from analytical reporting marts designed with dimensional star schemas.'
      },
      {
        id: 'w16-q2',
        question: 'What is the primary benefit of Kimball dimensional modeling for business intelligence analysts?',
        options: [
          'Simplicity of joins (1-hop from star center) and intuitive representation of business processes matching executive mental models',
          'It eliminates the need for computer hardware',
          'It prevents customers from unsubscribing',
          'It automatically writes JavaScript code'
        ],
        correctIndex: 0,
        explanation: 'Dimensional models are intuitive for business analysts, provide predictable star schema query performance, and match natural business reporting metrics.'
      },
      {
        id: 'w16-q3',
        question: 'When should an enterprise use PostgreSQL Materialized Views over regular SQL Views?',
        options: [
          'When the underlying query is an expensive aggregation over millions of rows that does not need real-time per-millisecond freshness',
          'When the database table has zero rows',
          'Only when running queries in dark mode',
          'When creating new user passwords'
        ],
        correctIndex: 0,
        explanation: 'Materialized views persist the computed result set on disk, allowing complex analytical queries to return instantly without re-aggregating millions of rows.'
      }
    ]
  }
];
