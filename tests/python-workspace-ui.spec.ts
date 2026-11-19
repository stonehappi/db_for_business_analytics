import { test, expect, Page } from '@playwright/test';

async function loginAs(page: Page, email: string, password = 'Password123!') {
  await page.goto('/login');
  await page.waitForSelector('[data-testid="input-email"]', { timeout: 10000 });
  await page.fill('[data-testid="input-email"]', email);
  await page.fill('[data-testid="input-password"]', password);
  await page.click('[data-testid="login-submit-btn"]');
  await page.waitForURL('/', { timeout: 10000 });
}

test.describe('Python for Business Analytics - End-to-End Browser UI Flow', () => {

  test('Student completes Week 3 Python Lab: runs script, views Matplotlib chart & DataFrames, submits for 100% score', async ({ page }) => {
    // 1. Sign in as Student (Sokha Chan)
    await loginAs(page, 'sokha.c@uni.edu');

    // Verify student mode
    await expect(page.getByTestId('role-mode-badge')).toContainText(/student mode/i);

    // 2. Select Week 3 (Python Analytics Lab) in the week dropdown
    const weekSelector = page.getByTestId('student-week-selector');
    await expect(weekSelector).toBeVisible();
    await weekSelector.selectOption('3');

    // Select Python lab in Week 3
    const assignSelector = page.getByTestId('student-assignment-selector');
    await assignSelector.waitFor({ state: 'visible', timeout: 5000 });
    await assignSelector.selectOption('w3-project-python-eda');
    await expect(assignSelector).toHaveValue('w3-project-python-eda');

    // 3. Verify Python environment badge and file label
    await expect(page.locator('text=w3-project-python-eda.py')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Python 3.11')).toBeVisible();
    await expect(page.locator('span:has-text("Python")').first()).toBeVisible();

    // 4. Click "Run Sandbox" (runs Python code against sandbox_db)
    const runBtn = page.getByTestId('run-sandbox-btn');
    await expect(runBtn).toBeVisible();
    await runBtn.click();

    // Wait for execution to finish (Run Sandbox button transitions back from 'Running...')
    await expect(runBtn).toContainText('Run Sandbox', { timeout: 15000 });

    // 5. Verify the Python tabs are rendered
    await expect(page.getByTestId('tab-plots')).toBeVisible();
    await expect(page.getByTestId('tab-logs')).toBeVisible();
    await expect(page.getByTestId('tab-results')).toBeVisible();
    await expect(page.getByTestId('tab-tests')).toBeVisible();

    // 6. Inspect Plots & Visualizations tab
    await page.getByTestId('tab-plots').click();
    const plotImg = page.locator('img[alt^="Analysis Plot"]');
    await expect(plotImg).toBeVisible();
    const imgSrc = await plotImg.getAttribute('src');
    expect(imgSrc).toContain('data:image/png;base64,');

    // Check download button is present
    await expect(page.locator('a[download^="chart_"]')).toBeVisible();

    // 7. Inspect DataFrames tab
    await page.getByTestId('tab-results').click();
    await expect(page.locator('text=DataFrame:')).toBeVisible();
    await expect(page.locator('th:has-text("email")')).toBeVisible();
    await expect(page.locator('th:has-text("full_name")')).toBeVisible();

    // 8. Inspect Console Logs tab
    await page.getByTestId('tab-logs').click();
    await expect(page.locator('div.bg-zinc-950')).toBeVisible();

    // 9. Inspect Verification Tests tab
    await page.getByTestId('tab-tests').click();
    await expect(page.locator('text=TESTS PASSED (100%)')).toBeVisible();

    // 10. Submit Final Solution
    const submitBtn = page.getByTestId('submit-solution-btn');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify submission confirmation banner
    await expect(page.locator('text=Submitted Successfully!')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Score: 100 / 100')).toBeVisible();

    // 11. Sign out
    await page.locator('[data-testid="logout-btn"]').click();
    await page.locator('[data-testid="confirm-signout-btn"]').click();
    await page.waitForURL(/\/login/);
  });

  test('Teacher inspects student Python submission with generated Matplotlib visualization in Grading Drawer', async ({ page }) => {
    // 1. Sign in as Lead Teacher
    await loginAs(page, 'prof.smith@uni.edu');
    await expect(page.getByTestId('role-mode-badge')).toContainText(/teacher mode/i);

    // 2. Open Gradebook Matrix
    await page.locator('[data-testid="tab-gradebook"]').click();
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });

    // 3. Find the cell for student Sokha Chan on Week 3 Python Lab and click to open grading drawer
    const pythonCell = page.locator('tr:has-text("Sokha Chan") td[data-assignment-slug="w3-project-python-eda"]');
    await expect(pythonCell).toBeVisible();
    await pythonCell.click();

    // 4. Verify Grading Drawer opens with Python indicators
    await expect(page.locator('text=Grade Submission:')).toBeVisible();
    await expect(page.locator('text=Student Submitted Code (Python)')).toBeVisible();

    // 5. Verify the generated chart visualization is visible inside Grading Drawer
    await expect(page.locator('text=Generated Visualizations')).toBeVisible();
    await expect(page.locator('img[alt^="Generated plot"]')).toBeVisible();

    // 6. Enter instructor feedback and save
    const feedbackBox = page.locator('textarea');
    await feedbackBox.fill('Excellent Pandas data aggregation and clean visual spend distribution.');
    await page.locator('[data-testid="save-grade-btn"]').click();
    await expect(page.locator('text=Saved!')).toBeVisible();
  });

});
