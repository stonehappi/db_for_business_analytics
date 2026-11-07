import { test, expect } from '@playwright/test';

test.describe('Database Learning Platform & Project Management E2E', () => {

  test('1. Role switcher and header indicators work correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Header brand and cohort code
    await expect(page.locator('text=DB Analytics')).toBeVisible();
    await expect(page.locator('text=BA-2026-FALL-A')).toBeVisible();

    // Verify user switcher
    const userSwitcher = page.locator('[data-testid="user-switcher"]');
    await expect(userSwitcher).toBeVisible();

    // Switch to Professor Alan Smith (Teacher)
    const options = await userSwitcher.locator('option').allInnerTexts();
    const teacherOption = options.find((o) => o.includes('Professor Alan Smith'));
    expect(teacherOption).toBeTruthy();

    await userSwitcher.selectOption({ label: teacherOption! });
    // Tab should automatically switch to Gradebook or stay accessible
    await expect(page.locator('[data-testid="tab-gradebook"]')).toBeVisible();
  });

  test('2. Teacher can inspect 16-week master curriculum and publish assignment', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Switch to Teacher
    const userSwitcher = page.locator('[data-testid="user-switcher"]');
    const options = await userSwitcher.locator('option').allInnerTexts();
    const teacherOption = options.find((o) => o.includes('Professor Alan Smith'))!;
    await userSwitcher.selectOption({ label: teacherOption });

    // Click Master Curriculum tab
    await page.locator('[data-testid="tab-curriculum"]').click();

    // Verify 16 modules are visible
    await expect(page.locator('text=16-Week Master Syllabus')).toBeVisible();
    await expect(page.locator('text=Week 1: Business Reality to Relational Abstraction')).toBeVisible();
    await expect(page.locator('text=Week 8: Midterm Examination & Practical Schema Defense')).toBeVisible();
    await expect(page.locator('text=Week 16: Final Examination & Capstone Defense')).toBeVisible();

    // Select Project 1 in syllabus
    await page.locator('text=Project 1: Multi-Vendor Marketplace Relational Model').first().click();

    // Verify detail canvas
    await expect(page.locator('text=Case Study Brief & Business Requirements')).toBeVisible();
    await expect(page.locator('text=Starter SQL Provided to Students')).toBeVisible();
    await expect(page.locator('text=Canonical Teacher Solution')).toBeVisible();

    // Click "Publish to Cohort" button
    const publishBtn = page.locator('[data-testid="publish-to-cohort-btn"]');
    await expect(publishBtn).toBeVisible();
    await publishBtn.click();

    // Verify modal appears and submit
    await expect(page.locator('text=Submission Deadline (Due Date)')).toBeVisible();
    const confirmPublish = page.locator('[data-testid="confirm-publish-btn"]');
    await confirmPublish.click();
    await expect(page.locator('text=Published!')).toBeVisible({ timeout: 5000 });
  });

  test('3. Student 3-panel workspace: load brief, run query, verify tests, submit', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Select Student (Sokha Chan)
    const userSwitcher = page.locator('[data-testid="user-switcher"]');
    const options = await userSwitcher.locator('option').allInnerTexts();
    const studentOption = options.find((o) => o.includes('Sokha Chan'))!;
    await userSwitcher.selectOption({ label: studentOption });

    // Open Student Workspace
    await page.locator('[data-testid="tab-workspace"]').click();

    // 1. Left Panel check
    await expect(page.locator('text=Assignment Scenario')).toBeVisible();
    await expect(page.locator('text=Business Case Description')).toBeVisible();
    await expect(page.locator('text=Evaluation Rubric Criteria')).toBeVisible();

    // 2. Schema Inspector tab check
    await page.locator('[data-testid="tab-schema"]').click();
    await expect(page.getByText('customers', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('order_items', { exact: true }).first()).toBeVisible();

    // 3. Run Sandbox execution
    const runBtn = page.locator('[data-testid="run-sandbox-btn"]');
    await expect(runBtn).toBeVisible();
    await runBtn.click();

    // Query Results should display
    await page.locator('[data-testid="tab-results"]').click();
    await expect(page.locator('th >> text=customer_id')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('th >> text=total_spend')).toBeVisible();

    // 4. Verification Tests tab check
    await page.locator('[data-testid="tab-tests"]').click();
    await expect(page.locator('text=TESTS PASSED (100%)')).toBeVisible({ timeout: 5000 });

    // 5. Submit final solution
    const submitBtn = page.locator('[data-testid="submit-solution-btn"]');
    await submitBtn.click();
    await expect(page.locator('text=Submitted Successfully!')).toBeVisible({ timeout: 8000 });
  });

  test('4. Teacher Gradebook Matrix: spreadsheet view, side-by-side grading drawer', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Switch to Teacher
    const userSwitcher = page.locator('[data-testid="user-switcher"]');
    const options = await userSwitcher.locator('option').allInnerTexts();
    const teacherOption = options.find((o) => o.includes('Professor Alan Smith'))!;
    await userSwitcher.selectOption({ label: teacherOption });

    await page.locator('[data-testid="tab-gradebook"]').click();

    // Verify matrix headers and students
    await expect(page.locator('th >> text=Student ID')).toBeVisible();
    await expect(page.locator('th >> text=Full Name')).toBeVisible();
    await expect(page.locator('th >> text=Weighted Total')).toBeVisible();
    await expect(page.locator('th >> text=Grade')).toBeVisible();

    // Check enrolled students exist in matrix cells
    await expect(page.getByRole('cell', { name: 'STU-2026-001' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Sokha Chan' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Dara Vong' })).toBeVisible();

    // Click on Sokha Chan's first score cell to open grading drawer
    const scoreCell = page.locator('[data-testid="score-cell"]').first();
    await scoreCell.click();

    // Verify grading drawer opens
    await expect(page.locator('text=Grade Submission:')).toBeVisible();
    await expect(page.locator('text=Student Submitted SQL')).toBeVisible();
    await expect(page.locator('text=Canonical Teacher Solution:')).toBeVisible();

    // Adjust score and save
    const scoreInput = page.locator('input[type="number"]');
    await scoreInput.fill('95');
    const saveBtn = page.locator('[data-testid="save-grade-btn"]');
    await saveBtn.click();
    await expect(page.locator('text=Saved!')).toBeVisible();
  });

  test('5. End-of-class completion & lock grades workflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Switch to Teacher
    const userSwitcher = page.locator('[data-testid="user-switcher"]');
    const options = await userSwitcher.locator('option').allInnerTexts();
    const teacherOption = options.find((o) => o.includes('Professor Alan Smith'))!;
    await userSwitcher.selectOption({ label: teacherOption });

    await page.locator('[data-testid="tab-gradebook"]').click();

    const finalizeBtn = page.locator('[data-testid="finalize-cohort-btn"]');
    await expect(finalizeBtn).toBeVisible();

    // If not already completed, click and confirm
    const isAlreadyCompleted = await finalizeBtn.innerText().then((t) => t.includes('Completed'));
    if (!isAlreadyCompleted) {
      await finalizeBtn.click();
      await expect(page.locator('text=Finalize Class & Lock Cohort Grades?')).toBeVisible();
      await page.locator('[data-testid="confirm-lock-grades-btn"]').click();
      await expect(page.locator('text=Grades Locked')).toBeVisible({ timeout: 5000 });
    } else {
      await expect(page.locator('text=Grades Locked')).toBeVisible();
    }
  });

  test('6. Gradebook Export (.CSV and .XLSX) API verification', async ({ request }) => {
    const cohortId = 'a1b2c3d4-0000-1111-2222-333333333333';

    // 1. Test CSV Export
    const csvResponse = await request.get(`/api/cohorts/${cohortId}/scores/export?format=csv`);
    expect(csvResponse.status()).toBe(200);
    expect(csvResponse.headers()['content-type']).toContain('text/csv');
    const csvText = await csvResponse.text();
    expect(csvText).toContain('Student_ID,Full_Name,Email,Cohort_Code');
    expect(csvText).toContain('STU-2026-001');
    expect(csvText).toContain('STU-2026-002');
    expect(csvText).toContain('Weighted_Total (100%),Letter_Grade');

    // 2. Test XLSX Export
    const xlsxResponse = await request.get(`/api/cohorts/${cohortId}/scores/export?format=xlsx`);
    expect(xlsxResponse.status()).toBe(200);
    expect(xlsxResponse.headers()['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const xlsxBuffer = await xlsxResponse.body();
    expect(xlsxBuffer.length).toBeGreaterThan(1000); // Valid zip archive
  });

  test('7. Sandbox Security Guardrails & Timeout Enforcement', async ({ request }) => {
    // 1. Prohibited DROP DATABASE command
    const resDrop = await request.post('/api/sandbox/execute', {
      data: { sqlCode: 'DROP DATABASE sandbox_db;' },
    });
    const dataDrop = await resDrop.json();
    expect(dataDrop.status).toBe('security_violation');
    expect(dataDrop.error).toContain('Security violation: Prohibited command detected');

    // 2. Prohibited ALTER SYSTEM command
    const resAlter = await request.post('/api/sandbox/execute', {
      data: { sqlCode: 'ALTER SYSTEM SET max_connections = 100;' },
    });
    const dataAlter = await resAlter.json();
    expect(dataAlter.status).toBe('security_violation');

    // 3. Infinite recursive CTE triggers statement timeout without crashing
    const resTimeout = await request.post('/api/sandbox/execute', {
      data: { sqlCode: 'WITH RECURSIVE loop(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM loop) SELECT * FROM loop;' },
    });
    const dataTimeout = await resTimeout.json();
    expect(dataTimeout.status).toBe('timeout_error');
    expect(dataTimeout.error).toContain('statement timeout limit');
  });

});
