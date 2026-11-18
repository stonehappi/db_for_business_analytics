import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });
dotenv.config();

const sandboxStudentUrl =
  process.env.SANDBOX_STUDENT_DATABASE_URL ||
  'postgresql://student_sandbox_user:sandbox_safe_pw@localhost:5435/sandbox_db';

export const sandboxPool = new Pool({
  connectionString: sandboxStudentUrl,
  max: 20,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

// Prohibited SQL commands and functions
const PROHIBITED_PATTERNS = [
  /\bDROP\s+DATABASE\b/i,
  /\bALTER\s+SYSTEM\b/i,
  /\bCOPY\b/i,
  /\bpg_terminate_backend\b/i,
  /\bpg_cancel_backend\b/i,
  /\bpg_read_file\b/i,
  /\bpg_write_file\b/i,
  /\bpg_ls_dir\b/i,
  /\bpg_stat_file\b/i,
  /\blo_export\b/i,
  /\blo_import\b/i,
  /\blo_unlink\b/i,
  /\bdblink\b/i,
  /\bpg_sleep\b/i,
  /\bGRANT\b/i,
  /\bREVOKE\b/i,
  /\bCREATE\s+ROLE\b/i,
  /\bALTER\s+ROLE\b/i,
  /\bDROP\s+ROLE\b/i,
  /\bCREATE\s+DATABASE\b/i,
  /\bSHUTDOWN\b/i,
  /\bCOMMIT\b/i,
  /\bROLLBACK\b/i,
  /\bSTART\s+TRANSACTION\b/i,
  /\bSET\s+TRANSACTION\b/i,
  /\bDISCARD\b/i,
  /\bVACUUM\b/i,
  /\bTRUNCATE\b/i,
];

// Helper to strip comments and string literals for accurate security analysis
function sanitizeSqlForCheck(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--.*$/gm, ' ')
    .replace(/(\$[a-zA-Z0-9_]*\$)[\s\S]*?\1/g, " '' ")
    .replace(/'(?:''|[^'])*'/g, " '' ");
}

export function hasMultipleStatements(sql: string): boolean {
  const stripped = sanitizeSqlForCheck(sql).trim();
  const withoutTrailing = stripped.replace(/;+\s*$/, '');
  return withoutTrailing.includes(';');
}

export interface ColumnMeta {
  name: string;
  type: string;
}

export interface TestResult {
  passed: boolean;
  scoreEstimate: number;
  details: string;
  mismatchCount?: number;
}

export interface ExecutionSuccess {
  status: 'success';
  executionTimeMs: number;
  rowCount: number;
  columns: ColumnMeta[];
  rows: any[];
  testResults?: TestResult;
}

export interface ExecutionError {
  status: 'syntax_error' | 'security_violation' | 'timeout_error';
  error: string;
  position?: number;
  executionTimeMs: number;
}

export type ExecutionResponse = ExecutionSuccess | ExecutionError;

// Map PostgreSQL Type OIDs to human-readable names
function mapOidToType(dataTypeId: number): string {
  switch (dataTypeId) {
    case 16: return 'bool';
    case 20: return 'int8';
    case 21: return 'int2';
    case 23: return 'int4';
    case 25: return 'text';
    case 700: return 'float4';
    case 701: return 'float8';
    case 1043: return 'varchar';
    case 1082: return 'date';
    case 1114: return 'timestamp';
    case 1184: return 'timestamptz';
    case 1700: return 'numeric';
    case 2950: return 'uuid';
    case 3802: return 'jsonb';
    default: return 'text';
  }
}

export async function executeSandboxQuery(
  sqlCode: string,
  verificationSql?: string | null
): Promise<ExecutionResponse> {
  const startTime = performance.now();

  // 1. Pre-execution sanitization check
  const sanitizedForCheck = sanitizeSqlForCheck(sqlCode);

  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(sanitizedForCheck)) {
      const execTime = Math.round((performance.now() - startTime) * 10) / 10;
      return {
        status: 'security_violation',
        error: `Security violation: Prohibited command detected (${pattern.source.replace(/\\b/g, '')}).`,
        executionTimeMs: execTime,
      };
    }
  }

  // Multi-statement injection guard: disallow chained commands
  if (hasMultipleStatements(sqlCode)) {
    const execTime = Math.round((performance.now() - startTime) * 10) / 10;
    return {
      status: 'security_violation',
      error: 'Security violation: Multiple SQL statements are not permitted in a single submission.',
      executionTimeMs: execTime,
    };
  }

  // Strip trailing semicolons for single clean query execution
  const trimmedSql = sqlCode.trim().replace(/;+\s*$/, '');

  let client: PoolClient | null = null;
  try {
    client = await sandboxPool.connect();

    // 2. Set strict local execution parameters
    await client.query('BEGIN TRANSACTION READ ONLY;');
    await client.query("SET LOCAL statement_timeout = '3000ms';");
    await client.query("SET LOCAL work_mem = '16MB';");
    await client.query('SET LOCAL search_path = public;');

    // 3. Execute student SQL
    const execStart = performance.now();
    const queryResult = await client.query(trimmedSql);
    const execTimeMs = Math.round((performance.now() - execStart) * 10) / 10;

    const columns: ColumnMeta[] = (queryResult.fields || []).map((f) => ({
      name: f.name,
      type: mapOidToType(f.dataTypeID),
    }));

    let testResults: TestResult | undefined = undefined;

    // 4. Run verification if provided
    if (verificationSql && verificationSql.trim().length > 0) {
      try {
        // Prepare verification SQL query
        // The verification_sql in seed uses {{STUDENT_SQL}} placeholder
        let testQuery = verificationSql;
        // Clean inner student sql for subquery wrapping
        const innerSql = trimmedSql.replace(/;+\s*$/, '');
        testQuery = testQuery.replace(/\{\{STUDENT_SQL\}\}/g, innerSql);

        const verifyRes = await client.query(testQuery);
        if (verifyRes.rows.length > 0 && 'mismatch_count' in verifyRes.rows[0]) {
          const mismatchCount = parseInt(verifyRes.rows[0].mismatch_count, 10);
          const passed = mismatchCount === 0;
          testResults = {
            passed,
            scoreEstimate: passed ? 100 : Math.max(0, 100 - mismatchCount * 25),
            details: passed
              ? 'All test assertions and row validations passed successfully.'
              : `Found ${mismatchCount} mismatching rows compared to canonical solution.`,
            mismatchCount,
          };
        } else {
          testResults = {
            passed: true,
            scoreEstimate: 100,
            details: 'Query executed without assertion errors.',
          };
        }
      } catch (testErr: any) {
        testResults = {
          passed: false,
          scoreEstimate: 30,
          details: `Verification assertion check error: ${testErr.message || String(testErr)}`,
        };
      }
    }

    // Always rollback student read-only transaction to leave clean state
    await client.query('ROLLBACK;');

    return {
      status: 'success',
      executionTimeMs: execTimeMs,
      rowCount: queryResult.rowCount ?? queryResult.rows.length,
      columns,
      rows: queryResult.rows,
      testResults,
    };
  } catch (err: any) {
    if (client) {
      try {
        await client.query('ROLLBACK;');
      } catch {}
    }

    const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
    const msg: string = err.message || String(err);

    if (err.code === '57014' || msg.includes('canceling statement due to statement timeout')) {
      return {
        status: 'timeout_error',
        error: 'Query execution cancelled: exceeded 3000ms statement timeout limit.',
        executionTimeMs: elapsed,
      };
    }

    const pos = err.position ? parseInt(err.position, 10) : undefined;
    return {
      status: 'syntax_error',
      error: msg,
      position: pos,
      executionTimeMs: elapsed,
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}
