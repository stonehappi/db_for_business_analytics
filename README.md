# Database Design & Project Learning System for Business Analytics
## Antigravity Implementation Specification Bundle

This folder contains the complete, production-ready specification files to direct AI agents in Antigravity to implement the teaching and learning platform.

### Document Index

1. **[PRD.md](PRD.md)**: Product requirements document detailing core user personas, the single-master-class-to-multiple-cohorts inheritance architecture, project-based learning model, and anti-AI design constraints.
2. **[DATABASE.md](DATABASE.md)**: Complete PostgreSQL DDL schema (`users`, `cohorts`, `master_modules`, `master_assignments`, `cohort_assignments`, `submissions`), Row-Level Security (RLS) policies, and the dual-database sandbox execution architecture.
3. **[ARCHITECTURE_AND_API.md](ARCHITECTURE_AND_API.md)**: Technical architecture, request/response contracts for REST/tRPC routes, and the SQL execution sandbox runner pipeline.
4. **[FRONTEND_GUIDELINES.md](FRONTEND_GUIDELINES.md)**: Minimalist editorial light-theme design system, design tokens, typography, 3-panel student workspace layout, and explicit anti-AI styling guardrails.
5. **[CURRICULUM_CASES.md](CURRICULUM_CASES.md)**: Three real-world business analytics projects (E-Commerce Retention, SaaS Churn & MRR, Supply Chain Latency) with business requirements and automated verification SQL queries.
6. **[MASTER_CURRICULUM_16_WEEKS.md](MASTER_CURRICULUM_16_WEEKS.md)**: 16-week project-based master syllabus logically reordered from conceptual ERDs and 1:M relationships to 3NF normalization, midterm exam (Week 8), dimensional data warehousing (star/snowflake schemas, SCDs), and capstone defense (Week 16).
7. **[AGENT_INSTRUCTIONS.md](AGENT_INSTRUCTIONS.md)**: Step-by-step phased execution roadmap with verification criteria for autonomous AI agents in Antigravity.

### Quick Start for Antigravity

1. Upload this directory (`antigravity_db_project`) into your Antigravity project workspace.
2. Direct the Antigravity agent to read `AGENT_INSTRUCTIONS.md` as its primary prompt and execution guide.
3. Start execution with Phase 1 (Environment & Container Setup).
