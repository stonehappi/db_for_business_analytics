# Frontend Design & UI/UX Guidelines
## Minimalist Light Theme for Developer-Grade Learning

### 1. Core Visual Principles

* **Restraint Over Decoration**: Zero decorative illustrations, zero floating gradient blobs, and zero neon accent glows. The design prioritizes extreme visual clarity, readable typography, and high data density.
* **Light Theme Only**: The interface uses a clean, light palette optimized for prolonged analytical work, reading schema dictionaries, and writing SQL.
* **Content First**: Business case documentation, code editing, and data tables dominate the screen. Chrome, navigation bars, and buttons remain quiet and utilitarian.

---

### 2. Design Tokens & Styling System

```css
/* Color Palette */
--bg-canvas: #FAFAFA;          /* Main app background (Zinc 50) */
--bg-surface: #FFFFFF;         /* Cards, modals, workspace panes */
--bg-subtle: #F4F4F5;          /* Table headers, subtle hover states (Zinc 100) */
--bg-active: #E4E4E7;          /* Active tab background, selected row (Zinc 200) */

--border-primary: #E4E4E7;     /* Standard panel border, 1px solid (Zinc 200) */
--border-strong: #D4D4D8;      /* Focused inputs, active borders (Zinc 300) */

--text-primary: #18181B;       /* High-contrast body & headings (Zinc 900) */
--text-secondary: #71717A;     /* Helper text, timestamps, labels (Zinc 500) */
--text-muted: #A1A1AA;         /* Inactive icons, subtle placeholders (Zinc 400) */

--accent-primary: #18181B;     /* Action buttons: solid dark ink on white */
--accent-primary-hover: #27272A;
--accent-success: #15803D;     /* Test passed (Green 700 - high contrast) */
--accent-danger: #B91C1C;      /* Syntax error / Test failed (Red 700) */
```

#### Typography
* **UI Typography**: `Inter`, `Geist Sans`, or system sans-serif (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`).
* **Code & Tabular Typography**: `JetBrains Mono`, `Fira Code`, or `ui-monospace`.
* **Sizing Scale**:
  * Page Title: `18px`, medium/semibold weight (`font-medium`).
  * Section Headers: `14px`, medium weight.
  * Body Text: `13px` or `14px`, regular weight (`leading-relaxed`).
  * Code & Table Data: `12px`, tabular numerals (`font-mono tabular-nums`).

---

### 3. Key View Layouts

#### 3.1 Student 3-Panel Project Workspace
A full-viewport split interface (`h-screen overflow-hidden`):
* **Left Panel (Width: 32%)**:
  * Case Study Brief: Business context, narrative, client requirements.
  * Data Dictionary: Entity attributes, expected data types, constraints.
  * Milestone Rubric: Checklist of criteria needed for full marks.
* **Top-Right Panel (Height: 55%)**:
  * Toolbar: Schema Selector, "Run Sandbox" (Ctrl/Cmd + Enter), "Submit Final Solution".
  * Monaco SQL Editor: Configured with light theme (`vs-light`), mini-map disabled, bracket pair colorization enabled.
* **Bottom-Right Panel (Height: 45%)**:
  * Tab 1: **Query Results**: Fast virtualized data grid with pagination, row counts, and query execution latency (e.g. `24 rows returned in 34ms`).
  * Tab 2: **Verification Tests**: Status report indicating passed/failed assertions against the teacher's test suite.
  * Tab 3: **Schema Inspector**: Visual representation of current tables and relationships.

#### 3.2 Teacher Master Curriculum View
* **Left Navigation**: Collapsible hierarchy of Master Modules and Assignments with drag-and-drop reordering.
* **Center Detail Canvas**:
  * Markdown editor for the business case narrative.
  * Split SQL editors for:
    * Starter template (provided to students).
    * Teacher canonical solution.
    * Automated verification test script.
* **Publishing Modal**:
  * Quick-select target cohorts (`e.g. BA-2026-A`, `BA-2026-B`).
  * Date/time picker for cohort due dates.
  * Single-click sync button to propagate master updates.

#### 3.3 Teacher Cohort Grading Matrix & End-of-Class Score Export
* **Top Action Toolbar**:
  * Cohort status badge (`Active` or `Completed`).
  * **"Complete Class & Lock Grades"** button: Prompts confirmation when any submissions remain ungraded, then snapshots final weighted scores.
  * **"Export Final Scores"** split-button dropdown:
    * **Export CSV (`.csv`)**: Immediate browser download formatted for university registrar import.
    * **Export Excel Workbook (`.xlsx`)**: Immediate download of the 3-tab gradebook workbook.
* **Gradebook Matrix Table**:
  * Dense monospace-numeric spreadsheet layout (`tabular-nums`) with sticky left columns (`Student ID`, `Full Name`) and sticky right summary columns (`Weighted Total %`, `Letter Grade`).
  * Intermediate columns for each published milestone (`Project 1 (15%)`, `Project 2 (15%)`, `Midterm (20%)`, `Project 3 (15%)`, `Capstone (20%)`, `Final Exam (15%)`).
  * Clicking any cell opens the **Grading Side Drawer**:
    * Unified diff viewer comparing student's SQL with canonical solution.
    * Test execution logs and error traces.
    * Markdown feedback input box with fast keyboard shortcut (`Cmd + Enter` to save and advance to next student).

---

### 4. Anti-AI Design Guardrails (Explicit Checklist)

| Element | Allowed / Required | Prohibited (Generic AI Cliché) |
| :--- | :--- | :--- |
| **Colors** | Black, white, neutral grays, muted green/red alerts. | Indigo/purple gradient backgrounds, neon cyan accents. |
| **Cards & Panels** | Crisp square corners (`rounded-sm` or `rounded-md`), 1px borders. | Pillowy `rounded-3xl` cards with heavy blurry drop-shadows. |
| **Motion** | Fast, snappy micro-interactions (100ms-150ms ease-out). | Floating bouncy cards, slow pulsating glowing borders. |
| **Icons** | Minimal, stroke-based 16px icons (Lucide or Heroicons). | Sparkle/star icons, floating robot head illustrations. |
| **Layout** | Information-dense, split-pane workspace. | Center-aligned landing page cards with excessive empty padding. |
