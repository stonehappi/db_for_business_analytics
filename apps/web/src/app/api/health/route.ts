import { NextResponse } from 'next/server';
import { appPool, sandboxStudentPool } from '@db-platform/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = performance.now();
  const checks: Record<string, string> = {
    web: 'ok',
    appDb: 'unknown',
    sandboxDb: 'unknown',
  };

  let allHealthy = true;

  // 1. Verify Application Database connectivity
  try {
    const appClient = await appPool.connect();
    try {
      await appClient.query('SELECT 1;');
      checks.appDb = 'ok';
    } finally {
      appClient.release();
    }
  } catch (err: any) {
    checks.appDb = `error: ${err.message}`;
    allHealthy = false;
  }

  // 2. Verify Sandbox Database connectivity
  try {
    const sandboxClient = await sandboxStudentPool.connect();
    try {
      await sandboxClient.query('SELECT 1;');
      checks.sandboxDb = 'ok';
    } finally {
      sandboxClient.release();
    }
  } catch (err: any) {
    checks.sandboxDb = `error: ${err.message}`;
    allHealthy = false;
  }

  const durationMs = Math.round((performance.now() - startTime) * 10) / 10;

  const payload = {
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    durationMs,
    version: '1.0.0',
    checks,
  };

  return NextResponse.json(payload, { status: allHealthy ? 200 : 503 });
}
