import { NextRequest, NextResponse } from 'next/server';
import { executeSandboxQuery, executePythonSandbox } from '@db-platform/sandbox';
import { queryApp } from '@db-platform/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cohortAssignmentId, masterAssignmentId, sqlCode, pythonCode, code, language, verificationCode } = body;

    const effectiveCode = pythonCode || sqlCode || code;
    if (!effectiveCode || typeof effectiveCode !== 'string') {
      return NextResponse.json({ error: 'code (sqlCode or pythonCode) is required' }, { status: 400 });
    }

    let assignmentMeta: {
      language?: string;
      verification_sql?: string | null;
      verification_python?: string | null;
    } | null = null;

    if (cohortAssignmentId) {
      const res = await queryApp(
        `
        SELECT ma.language, ma.verification_sql, ma.verification_python
        FROM cohort_assignments ca
        JOIN master_assignments ma ON ca.master_assignment_id = ma.id
        WHERE ca.id = $1;
      `,
        [cohortAssignmentId]
      );
      if (res.rowCount > 0) {
        assignmentMeta = res.rows[0];
      }
    } else if (masterAssignmentId) {
      const res = await queryApp(
        `
        SELECT language, verification_sql, verification_python
        FROM master_assignments
        WHERE id = $1;
      `,
        [masterAssignmentId]
      );
      if (res.rowCount > 0) {
        assignmentMeta = res.rows[0];
      }
    }

    const effectiveLanguage = (
      language ||
      (pythonCode ? 'python' : sqlCode ? 'sql' : assignmentMeta?.language) ||
      'sql'
    ).toLowerCase();

    if (effectiveLanguage === 'python') {
      const result = await executePythonSandbox(
        effectiveCode,
        verificationCode || assignmentMeta?.verification_python
      );
      return NextResponse.json(result);
    } else {
      const result = await executeSandboxQuery(
        effectiveCode,
        verificationCode || assignmentMeta?.verification_sql
      );
      return NextResponse.json(result);
    }
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
