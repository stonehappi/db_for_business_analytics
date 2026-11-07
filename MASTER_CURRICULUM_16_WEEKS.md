# Master Curriculum: Database Design & Data Warehousing for Business Analytics
## 16-Week Project-Based Syllabus

### Course Overview
* **Focus**: Conceptual, logical, and physical relational database design, normalization, entity relationships (emphasizing 1-to-many), and dimensional data warehousing for business intelligence and analytics.
* **Format**: 16 Weeks (Week 8: Midterm Assessment; Week 16: Final Assessment & Capstone Defense).
* **Pedagogical Strategy**: Project-Based Learning (PBL). Students master theory through business case scenarios, drafting entity-relationship diagrams (ERDs), normalising real-world messy data, building DDL migrations in PostgreSQL, and architecting star schemas for analytics.

---

### Master Schedule & Weekly Breakdown

#### Phase 1: Conceptual Modeling, ERDs & Relationships (Weeks 1–3)

##### Week 1: Business Reality to Relational Abstraction
* **Core Concepts**: The role of databases in business analytics; entities vs. attributes; candidate keys, primary keys, and surrogate keys; natural keys vs. synthetic identifiers.
* **Pedagogical Reordering Rationale**: Students first learn to identify business entities and grain before touching SQL syntax.
* **Lab / Practice**: Identifying business entities from an invoice, customer receipt, and shipping manifest.
* **Mini-Project 1 Kickoff**: *The Coffee Shop Franchise*—Mapping physical retail operations into conceptual entities.

##### Week 2: Relational Cardinality & One-to-Many Relationships
* **Core Concepts**: Cardinality and participation (mandatory vs. optional); deep-dive into One-to-Many (`1:M`) parent-child relationships; foreign keys as relational pointers; modeling Many-to-Many (`M:N`) using associative/junction entities.
* **Lab / Practice**: Diagramming parent-child hierarchies (e.g., `Department 1:M Employees`, `Order 1:M Order_Items`).
* **Deliverable**: Draft ERD using Crow's Foot notation showing primary-to-foreign key lineage for a multi-store inventory system.

##### Week 3: Advanced ER-Diagramming & Business Rules
* **Core Concepts**: Crow’s Foot notation standards; recursive/self-referencing relationships (e.g., organizational reporting lines); relationship constraints (`ON DELETE CASCADE`, `ON DELETE RESTRICT`, `ON DELETE SET NULL`).
* **Lab / Practice**: Translating strict business policy statements into precise diagrammatic constraints.
* **Project Milestone**: **Project 1 Submission: Multi-Vendor Marketplace Relational Model** (Full Crow's Foot ERD, data dictionary, and constraint documentation).

---

#### Phase 2: Relational Normalization & Physical Schema (Weeks 4–7)

##### Week 4: Functional Dependencies & First Normal Form (1NF)
* **Core Concepts**: Data anomalies (insertion, update, deletion); functional dependencies (`X -> Y`); definition of atomic attributes; eliminating repeating groups; achieving First Normal Form (1NF).
* **Lab / Practice**: Deconstructing multi-valued spreadsheet columns (e.g., comma-separated tags, multi-item order strings) into strict 1NF tables.
* **Mini-Project 2 Kickoff**: *The Legacy Excel Migration*—Auditing a 50,000-row unnormalized sales sheet.

##### Week 5: Second (2NF) and Third Normal Form (3NF)
* **Core Concepts**: Full functional dependency vs. partial dependency; composite primary keys and Second Normal Form (2NF); transitive dependencies (`A -> B -> C`) and Third Normal Form (3NF); eliminating data redundancy.
* **Lab / Practice**: Step-by-step mathematical decomposition of an order-fulfillment dataset from unnormalized to 3NF.
* **Deliverable**: Dependency diagram proving absence of partial and transitive dependencies.

##### Week 6: Boyce-Codd Normal Form (BCNF) & Practical Denormalization
* **Core Concepts**: BCNF edge cases (multiple overlapping candidate keys); the cost of over-normalization in business queries (excessive joins); when and how business analysts deliberately denormalize transactional databases.
* **Lab / Practice**: Identifying BCNF violations in scheduling/booking systems (e.g., `Course, Teacher, TimeSlot`).
* **Project Milestone**: **Project 2 Submission: Legacy ERP Schema Refactoring** (Decomposing a bloated legacy schema into clean 3NF tables with zero redundancy).

##### Week 7: Physical Schema Implementation in PostgreSQL
* **Core Concepts**: Translating 3NF logical models into physical PostgreSQL DDL; choosing proper data types (`UUID`, `VARCHAR`, `TIMESTAMPTZ`, `NUMERIC` vs `FLOAT`); creating primary, foreign key, unique, and check constraints; indexing foreign keys for join performance.
* **Lab / Practice**: Writing and executing executable DDL migration scripts in PostgreSQL.
* **Midterm Preparation**: Comprehensive review of ERDs, cardinalities, functional dependencies, and normalization proofs.

---

#### Phase 3: Midterm Evaluation (Week 8)

##### Week 8: Midterm Examination & Practical Schema Defense
* **Format**:
  * Part 1 (Theory & Analysis, 40%): Identifying normalization violations, resolving relationship ambiguities, determining candidate keys.
  * Part 2 (Hands-on Modeling Challenge, 60%): 3-hour live modeling case study. Students receive an unnormalized client dataset and business brief, produce a compliant 3NF Crow's Foot ERD, write executable PostgreSQL DDL, and submit for automated sandbox verification.

---

#### Phase 4: Data Warehousing & Dimensional Modeling (Weeks 9–12)

##### Week 9: OLTP vs. OLAP Paradigms
* **Core Concepts**: Why normalized transactional systems (3NF) fail analytical workloads; row storage vs. column concepts; transactional throughput vs. analytical scan performance; Introduction to Data Warehouses and dimensional modeling.
* **Pedagogical Reordering Rationale**: After mastering why normalization prevents transaction write anomalies, students learn why analytical reads require dimensional remodeling.
* **Lab / Practice**: Benchmarking an analytical aggregation query on a normalized 3NF schema versus a denormalized reporting table.
* **Capstone Project Announcement**: Enterprise Business Analytics Data Platform.

##### Week 10: Dimensional Modeling Fundamentals (Facts & Dimensions)
* **Core Concepts**: Fact tables (business measurements, numerical metrics) vs. Dimension tables (context, filters, grouping attributes); the critical concept of Fact Table Grain; additive, semi-additive, and non-additive metrics.
* **Lab / Practice**: Defining grain statements for business events (e.g., "One row per customer order line item scanned at checkout").
* **Deliverable**: Fact and Dimension Matrix mapping business processes to dimensional contexts.

##### Week 11: Star Schema & Snowflake Schema Architecture
* **Core Concepts**: Designing the Star Schema (central fact with 1:M relationships to denormalized dimensions); Snowflake Schema (normalized dimensions) and comparison of query complexity; surrogate keys vs. natural operational keys; date/time dimension engineering.
* **Lab / Practice**: Building an analytical Date Dimension table in PostgreSQL with fiscal calendars, quarters, and business day flags.
* **Project Milestone**: **Project 3 Submission: E-Commerce Analytics Star Schema** (Drafting fact and dimension tables, defining surrogate keys, and mapping 1:M dimensional relationships).

##### Week 12: Advanced Dimensional Modeling & Slowly Changing Dimensions (SCD)
* **Core Concepts**: Capturing historical changes over time; Slowly Changing Dimensions: Type 0 (Retain), Type 1 (Overwrite), Type 2 (Add new row with effective timestamps and `is_current` flag), Type 3 (Add previous value column); modeling accumulating snapshot facts.
* **Lab / Practice**: Writing SQL triggers/queries to handle customer address changes using SCD Type 2 in PostgreSQL.
* **Deliverable**: Dimensional model handling sales territory reassignments without corrupting historical revenue reports.

---

#### Phase 5: Analytical Performance & Capstone Engineering (Weeks 13–15)

##### Week 13: PostgreSQL for Analytics: Materialized Views & Indexing
* **Core Concepts**: Materialized views for pre-aggregated analytical reporting; refresh strategies; indexing dimensional models (B-Tree, BRIN for timeseries data); handling analytical window functions over star schemas.
* **Lab / Practice**: Creating and benchmarking materialized aggregate tables refreshed on schedule.
* **Capstone Work**: Finalizing conceptual and logical dimensional designs for the capstone dataset.

##### Week 14: Capstone Project Phase 1: Physical Warehouse Implementation
* **Core Concepts**: Implementing complete analytical data warehouse schemas in PostgreSQL; populating facts and dimensions via ELT SQL queries; maintaining referential integrity across dimensional relationships.
* **Milestone**: Full DDL script deployment and initial data population for the Capstone scenario.
* **Peer Review**: Students critique peer schemas for grain consistency and dimensional conformability.

##### Week 15: Capstone Project Phase 2: Business Intelligence Validation
* **Core Concepts**: Writing complex analytical SQL reports against the warehouse (Year-over-Year revenue, customer cohort retention, inventory velocity); verifying schema performance and grain accuracy.
* **Milestone**: Executing the verification query suite to prove the warehouse accurately answers all executive business questions.
* **Course Wrap-up**: Review of the complete database journey from conceptual ERD -> 3NF transactional DB -> Dimensional Data Warehouse.

---

#### Phase 6: Final Evaluation & Capstone Defense (Week 16)

##### Week 16: Final Examination & Capstone Defense
* **Format**:
  * Part 1 (Comprehensive Final Exam, 40%): ERD design, Normalization algorithms, 1:M relationship mapping, Star vs. Snowflake architecture, SCD implementations.
  * Part 2 (Capstone Defense & Code Review, 60%): Live demonstration and defense of the Capstone Data Warehouse. Students explain schema decisions, justify dimensional grain, and run real-time analytical queries against their database.

---

### Project & Assessment Weights

| Component | Focus Area | Due Week | Weight |
| :--- | :--- | :--- | :--- |
| **Project 1** | Multi-Vendor Marketplace Conceptual & 1:M Relational Model | Week 3 | 15% |
| **Project 2** | Legacy ERP Normalization to 3NF & PostgreSQL DDL | Week 6 | 15% |
| **Midterm Exam** | ERDs, Cardinality Constraints, Normalization Theory & Practical DDL | Week 8 | 20% |
| **Project 3** | Dimensional Modeling & Star Schema Architecture | Week 11 | 15% |
| **Capstone Project** | End-to-End Enterprise Data Warehouse & Analytical Verification | Week 15 | 20% |
| **Final Exam** | Comprehensive Theory & Capstone Defense | Week 16 | 15% |
