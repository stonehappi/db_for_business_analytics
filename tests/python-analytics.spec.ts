import { test, expect } from '@playwright/test';

test.describe('Python for Business Analytics - API & Security Verification', () => {

  test.beforeEach(async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: {
        email: 'prof.smith@uni.edu',
        password: 'Password123!',
      },
    });
    expect(loginRes.status()).toBe(200);
  });

  test('1. Python Execution Endpoint accepts code and returns tabular DataFrames', async ({ request }) => {
    const res = await request.post('/api/sandbox/execute', {
      data: {
        language: 'python',
        code: `
import pandas as pd
df = pd.DataFrame({
    'customer_id': [1, 2, 3],
    'order_count': [5, 12, 3],
    'total_spend': [250.50, 1120.00, 89.20]
})
print("Summary stats:")
print(df.describe())
        `,
      },
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('success');
    expect(data.executionTimeMs).toBeGreaterThan(0);
    expect(data.stdout).toContain('Summary stats:');
    expect(data.tables).toBeDefined();
    expect(data.tables.length).toBeGreaterThan(0);
    expect(data.tables[0].variableName).toBe('df');
    expect(data.tables[0].rowCount).toBe(3);
    expect(data.tables[0].columns.map((c: any) => c.name)).toContain('customer_id');
  });

  test('2. Python Execution Endpoint captures Matplotlib plots as base64 PNGs', async ({ request }) => {
    const res = await request.post('/api/sandbox/execute', {
      data: {
        language: 'python',
        code: `
import matplotlib.pyplot as plt
plt.figure(figsize=(4, 3))
plt.plot([1, 2, 3, 4], [10, 25, 40, 80], marker='o')
plt.title('Monthly MRR Growth')
plt.tight_layout()
        `,
      },
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('success');
    expect(data.plots).toBeDefined();
    expect(data.plots.length).toBe(1);
    expect(data.plots[0].format).toBe('png');
    expect(data.plots[0].base64).toContain('data:image/png;base64,');
  });

  test('3. AST Security Guard blocks prohibited system imports', async ({ request }) => {
    const dangerousScripts = [
      'import os; os.system("ls")',
      'import subprocess; subprocess.run(["whoami"])',
      'import sys; sys.exit(0)',
      '__import__("os").system("echo hacked")',
      'x = [].__class__.__base__.__subclasses__()',
    ];

    for (const code of dangerousScripts) {
      const res = await request.post('/api/sandbox/execute', {
        data: {
          language: 'python',
          code,
        },
      });

      expect(res.status()).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('security_violation');
      expect(data.error).toMatch(/Security [Vv]iolation/);
    }
  });

  test('4. Python Automated Verification tests validate student code assertions', async ({ request }) => {
    // A. Passing assertions
    const passRes = await request.post('/api/sandbox/execute', {
      data: {
        language: 'python',
        code: `
import pandas as pd
revenue = 45000.0
df_mrr = pd.DataFrame({'month': [1, 2], 'mrr': [40000, 45000]})
        `,
        verificationCode: `
assert revenue == 45000.0, "Revenue must equal 45000.0"
assert len(df_mrr) == 2, "Must contain exactly 2 months of MRR"
        `,
      },
    });

    expect(passRes.status()).toBe(200);
    const passData = await passRes.json();
    expect(passData.status).toBe('success');
    expect(passData.testResults.passed).toBe(true);
    expect(passData.testResults.scoreEstimate).toBe(100);

    // B. Failing assertion
    const failRes = await request.post('/api/sandbox/execute', {
      data: {
        language: 'python',
        code: `
revenue = 20000.0
        `,
        verificationCode: `
assert revenue == 45000.0, "Revenue must equal 45000.0"
        `,
      },
    });

    expect(failRes.status()).toBe(200);
    const failData = await failRes.json();
    expect(failData.status).toBe('success');
    expect(failData.testResults.passed).toBe(false);
    expect(failData.testResults.scoreEstimate).toBeLessThan(100);
    expect(failData.testResults.details).toContain('Assertion failed');
  });

});
