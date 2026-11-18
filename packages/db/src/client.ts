import { Pool } from 'pg';
import path from 'path';

// Load environment variables if dotenv is available
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dotenv = require('dotenv');
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });
  dotenv.config();
} catch {
  // Environment variables already populated by host/container environment
}

const appDbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/app_db';
const sandboxAdminUrl = process.env.SANDBOX_ADMIN_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5435/sandbox_db';
const sandboxStudentUrl = process.env.SANDBOX_STUDENT_DATABASE_URL || 'postgresql://student_sandbox_user:sandbox_safe_pw@localhost:5435/sandbox_db';

const isSslEnabled = process.env.DATABASE_SSL === 'true';
const sslConfig = isSslEnabled ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined;
const poolMax = parseInt(process.env.DB_POOL_MAX || '10', 10);
const sandboxPoolMax = parseInt(process.env.SANDBOX_POOL_MAX || '15', 10);

export const appPool = new Pool({
  connectionString: appDbUrl,
  max: poolMax,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: sslConfig,
});

export const sandboxAdminPool = new Pool({
  connectionString: sandboxAdminUrl,
  max: Math.min(poolMax, 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: sslConfig,
});

export const sandboxStudentPool = new Pool({
  connectionString: sandboxStudentUrl,
  max: sandboxPoolMax,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  ssl: sslConfig,
});

export async function queryApp<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
  const client = await appPool.connect();
  try {
    const res = await client.query(text, params);
    return { rows: res.rows, rowCount: res.rowCount ?? 0 };
  } finally {
    client.release();
  }
}
