import { test, expect, Page } from '@playwright/test';

// Authentication helper
async function loginAs(page: Page, email: string, password = 'Password123!') {
  await page.goto('/login');
  await page.fill('[data-testid="input-email"]', email);
  await page.fill('[data-testid="input-password"]', password);
  await page.click('[data-testid="login-submit-btn"]');
  await page.waitForURL('/', { timeout: 10000 });
}

test.describe('Database Learning Platform & Project Management E2E', () => {

  test('1. Production Authentication: login guard, invalid credentials, sign in, logout & registration', async ({ page }) => {
    // 1. Unauthenticated request to '/' must redirect to '/login'
    await page.goto('/');
    await page.waitForURL(/\/login/);
    await expect(page.locator('text=Sign in to your account')).toBeVisible();

    // 2. Invalid credentials show error alert
    await page.fill('[data-testid="input-email"]', 'prof.smith@uni.edu');
    await page.fill('[data-testid="input-password"]', 'WrongPassword999!');
    await page.click('[data-testid="login-submit-btn"]');
    await expect(page.getByTestId('auth-error-banner')).toContainText(/invalid email or password/i);

    // 3. Successful login as Lead Teacher
    await page.fill('[data-testid="input-email"]', 'prof.smith@uni.edu');
    await page.fill('[data-testid="input-password"]', 'Password123!');
    await page.click('[data-testid="login-submit-btn"]');
    await page.waitForURL('/');

    // Verify teacher controls are visible
    await expect(page.getByTestId('role-mode-badge')).toContainText(/teacher mode/i);
    await expect(page.locator('[data-testid="tab-gradebook"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-curriculum"]')).toBeVisible();

    // 4. Test Sign Out
    const logoutBtn = page.locator('[data-testid="logout-btn"]');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();
    await page.waitForURL(/\/login/);

    // 5. One-Click Demo Persona Login as Student (Sokha Chan)
    const demoStudentBtn = page.locator('[data-testid^="demo-login-student"]').first();
    await expect(demoStudentBtn).toBeVisible();
    await demoStudentBtn.click();
    await page.waitForURL('/');

    // Verify student view controls
    await expect(page.getByTestId('role-mode-badge')).toContainText(/student mode/i);
    await expect(page.locator('[data-testid="tab-workspace"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-my-grades"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-curriculum"]')).not.toBeVisible();

    // 6. Test My Grades view
    await page.locator('[data-testid="tab-my-grades"]').click();
    await expect(page.locator('text=Current Weighted Score')).toBeVisible();
    await expect(page.locator('text=Assignment Scores & Grade Contributions')).toBeVisible();

    // 7. Test Student Registration
    await page.locator('[data-testid="logout-btn"]').click();
    await page.waitForURL(/\/login/);

    await page.locator('[data-testid="switch-to-register-btn"]').click();
    await expect(page.locator('text=Student Course Enrollment')).toBeVisible();

    const timestamp = Date.now();
    await page.fill('[data-testid="register-name"]', `New Student ${timestamp}`);
    await page.fill('[data-testid="register-student-id"]', `STU-NEW-${timestamp.toString().slice(-4)}`);
    await page.fill('[data-testid="register-email"]', `newstudent${timestamp}@uni.edu`);
    await page.fill('[data-testid="register-password"]', 'Password123!');
    await page.click('[data-testid="register-submit-btn"]');

    // Automatically logs in and lands on dashboard
    await page.waitForURL('/');
    await expect(page.getByTestId('role-mode-badge')).toContainText(/student mode/i);
  });

  test('2. Teacher can inspect 16-week master curriculum and publish assignment', async ({ page }) => {
    await loginAs(page, 'prof.smith@uni.edu');

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
    await loginAs(page, 'sokha.c@uni.edu');

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
    await loginAs(page, 'prof.smith@uni.edu');

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
    await loginAs(page, 'prof.smith@uni.edu');

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

    // Authenticate as teacher
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'prof.smith@uni.edu', password: 'Password123!' },
    });
    expect(loginRes.status()).toBe(200);

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
    // Authenticate as student
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'sokha.c@uni.edu', password: 'Password123!' },
    });
    expect(loginRes.status()).toBe(200);

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
