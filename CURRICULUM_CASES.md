# Project-Based Curriculum Specifications: Database Design for Business Analytics

This document defines three end-to-end, real-world business analytics projects included in the master curriculum seed data. Each project challenges students to think from both a database engineering perspective (normalization, indexing, relational integrity) and a business intelligence perspective (metrics, cohort retention, supply chain latency).

---

## Project 1: E-Commerce Customer Analytics & Retention Engine

### Business Context
"OmniRetail" operates a multi-category online store. The marketing team requires an overhaul of their database to stop transaction anomalies, prevent redundant customer records, and calculate Customer Lifetime Value (CLV) and Monthly Active Buyers.

### Milestones & Tasks

#### Milestone 1: Schema Normalization (3NF)
Students are given an unnormalized legacy spreadsheet schema and must write clean PostgreSQL DDL creating:
* `customers`: Basic profile, registration date, acquisition channel.
* `products`: SKU, category, cost price, retail price.
* `orders`: Order timestamp, customer reference, shipping status.
* `order_items`: Quantity, unit price at purchase, applied discount.

#### Milestone 2: Analytical SQL Querying
Students must write an analytical query calculating:
1. Total revenue per customer.
2. Recency (days since last purchase relative to `2026-11-01`).
3. RFM (Recency, Frequency, Monetary) quintile ranking using `NTILE(5) OVER (...)`.

#### Reference Verification SQL
```sql
-- Automated verification query comparing student query result with solution
WITH student_calc AS (
    -- Evaluates student's query output
    SELECT customer_id, total_spend, order_count, rfm_score FROM student_submission_view
),
reference_calc AS (
    SELECT 
        c.id AS customer_id,
        COALESCE(SUM(oi.quantity * (oi.unit_price - oi.discount)), 0) AS total_spend,
        COUNT(DISTINCT o.id) AS order_count,
        NTILE(5) OVER (ORDER BY COALESCE(SUM(oi.quantity * (oi.unit_price - oi.discount)), 0) DESC) AS rfm_score
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    GROUP BY c.id
)
SELECT 
    COUNT(*) AS mismatch_count
FROM (
    SELECT customer_id, total_spend, order_count, rfm_score FROM student_calc
    EXCEPT
    SELECT customer_id, total_spend, order_count, rfm_score FROM reference_calc
) diff;
-- Assertion passes if mismatch_count == 0
```

---

## Project 2: B2B SaaS Recurring Revenue & Churn Intelligence

### Business Context
"CloudMetrics Inc." provides an enterprise analytics subscription. Leadership needs an accurate recurring revenue database to track Monthly Recurring Revenue (MRR), plan upgrades, downgrades, and subscriber churn.

### Milestones & Tasks

#### Milestone 1: Event-Sourced Subscription Schema
Students design a schema capturing temporal subscription states:
* `accounts`: Company name, domain, tier.
* `plans`: Monthly price, seat limit, billing frequency.
* `subscriptions`: Current status (`active`, `paused`, `canceled`), start timestamp, renewal date.
* `subscription_events`: Event timestamp, event type (`new_signup`, `upgrade`, `downgrade`, `churn`), previous MRR delta, new MRR.

#### Milestone 2: Cohort Churn Waterfall
Students write a window query that:
* Groups subscribers into monthly signup cohorts.
* Computes net revenue retention (NRR) at month 1, month 3, and month 6 using conditional aggregations and date truncation (`DATE_TRUNC('month', ...)`.

---

## Project 3: Supply Chain & Multi-Warehouse Fulfillment Network

### Business Context
"GlobalFreight" distributes industrial supplies across 5 regional warehouses. Backorders and delivery delays are hurting enterprise SLAs. The operations team needs a relational database to track stock levels, transfer legs, and fulfillment latencies.

### Milestones & Tasks

#### Milestone 1: Multi-Location Inventory Schema
Students define constraints ensuring:
* Inventory quantities cannot be negative (`CHECK (quantity_on_hand >= 0)`).
* Product movements between warehouses are recorded in a double-entry ledger (`stock_transfers`).
* Orders can be split across multiple warehouses if a single facility lacks stock.

#### Milestone 2: Fulfillment Latency & Bottleneck Analysis
Students craft an analytical query measuring:
* Average fulfillment latency in hours (order created to dispatched).
* Fulfillment performance ranking per warehouse using `DENSE_RANK() OVER (ORDER BY avg_latency ASC)`.
