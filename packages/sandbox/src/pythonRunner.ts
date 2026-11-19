import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });
dotenv.config();

const PYTHON_RUNNER_URL =
  process.env.PYTHON_RUNNER_URL || 'http://python-sandbox:8000';

export interface PythonTableMeta {
  variableName: string;
  rowCount: number;
  columnCount: number;
  columns: { name: string; type: string }[];
  rows: any[];
}

export interface PythonPlotMeta {
  format: 'png' | 'svg';
  base64: string;
}

export interface PythonTestResult {
  passed: boolean;
  scoreEstimate: number;
  details: string;
}

export interface PythonExecutionSuccess {
  status: 'success';
  executionTimeMs: number;
  stdout: string;
  stderr: string;
  tables: PythonTableMeta[];
  plots: PythonPlotMeta[];
  testResults?: PythonTestResult;
}

export interface PythonExecutionError {
  status: 'syntax_error' | 'security_violation' | 'timeout_error';
  error: string;
  details?: string;
  stdout?: string;
  stderr?: string;
  executionTimeMs: number;
}

export type PythonExecutionResponse = PythonExecutionSuccess | PythonExecutionError;

export async function executePythonSandbox(
  code: string,
  verificationCode?: string | null,
  sandboxDbUrl?: string | null,
  timeoutSeconds: number = 5.0
): Promise<PythonExecutionResponse> {
  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), (timeoutSeconds + 2) * 1000);

    const targetUrl = `${PYTHON_RUNNER_URL.replace(/\/+$/, '')}/execute`;

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        verificationCode,
        sandboxDbUrl:
          sandboxDbUrl ||
          process.env.INTERNAL_SANDBOX_DB_URL ||
          'postgresql://student_sandbox_user:sandbox_safe_pw@postgres-sandbox:5432/sandbox_db',
        timeoutSeconds,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutTimer);

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return {
        status: 'syntax_error',
        error: errBody.detail || `HTTP ${res.status}: ${res.statusText}`,
        executionTimeMs: Math.round((performance.now() - startTime) * 10) / 10,
      };
    }

    const data = (await res.json()) as PythonExecutionResponse;
    return data;
  } catch (err: any) {
    const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
    if (err.name === 'AbortError') {
      return {
        status: 'timeout_error',
        error: `Python execution timed out after ${timeoutSeconds}s.`,
        executionTimeMs: elapsed,
      };
    }

    // If connection refused (e.g. runner container not up during local dev), provide clear guidance
    if (err.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
      return {
        status: 'syntax_error',
        error: `Python Sandbox Runner service is currently unreachable at ${PYTHON_RUNNER_URL}. Please ensure the 'python-sandbox' container is running.`,
        executionTimeMs: elapsed,
      };
    }

    return {
      status: 'syntax_error',
      error: err.message || 'Unknown error occurred while executing Python sandbox code.',
      executionTimeMs: elapsed,
    };
  }
}
