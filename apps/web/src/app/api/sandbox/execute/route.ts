import { NextRequest, NextResponse } from 'next/server';
import { executeSandboxQuery } from '@db-platform/sandbox';
import { queryApp } from '@db-platform/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cohortAssignmentId, masterAssignmentId, sqlCode } = body;

    if (!sqlCode || typeof sqlCode !== 'string') {
      return NextResponse.json({ error: 'sqlCode is required' }, { status: 400 });
    }

    let verificationSql: string | null = null;

    if (cohortAssignmentId) {
      const res = await queryApp(
        `
        SELECT ma.verification_sql
        FROM cohort_assignments ca
        JOIN master_assignments ma ON ca.master_assignment_id = ma.id
        WHERE ca.id = $1;
      `,
        [cohortAssignmentId]
      );
      if (res.rowCount > 0) {
        verificationSql = res.rows[0].verification_sql;
      }
    } else if (masterAssignmentId) {
      const res = await queryApp(
        `
        SELECT verification_sql
        FROM master_assignments
        WHERE id = $1;
      `,
        [masterAssignmentId]
      );
      if (res.rowCount > 0) {
        verificationSql = res.rows[0].verification_sql;
      }
    }

    const result = await executeSandboxQuery(sqlCode, verificationSql);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'syntax_error',
        error: err.message || 'Execution error',
        executionTimeMs: 0,
      },
      { status: 500 }
    );
  }
}
