import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });
dotenv.config();

const appDbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/app_db';
const sandboxAdminUrl = process.env.SANDBOX_ADMIN_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5435/sandbox_db';
const sandboxStudentUrl = process.env.SANDBOX_STUDENT_DATABASE_URL || 'postgresql://student_sandbox_user:sandbox_safe_pw@localhost:5435/sandbox_db';

export const appPool = new Pool({
  connectionString: appDbUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const sandboxAdminPool = new Pool({
  connectionString: sandboxAdminUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const sandboxStudentPool = new Pool({
  connectionString: sandboxStudentUrl,
  max: 20,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
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
