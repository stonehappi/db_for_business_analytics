import { NextRequest, NextResponse } from 'next/server';
import { executeSandboxQuery } from '@db-platform/sandbox';
import { queryApp } from '@db-platform/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cohortAssignmentId, submittedSql, erdDiagramJson, studentId } = body;

    if (!cohortAssignmentId || !submittedSql) {
      return NextResponse.json(
        { error: 'cohortAssignmentId and submittedSql are required' },
        { status: 400 }
      );
    }

    // Secure student identity resolution:
    // Prevent identity spoofing: authenticated students can strictly only submit for themselves
    const sessionUserId = req.headers.get('x-user-id');
    const sessionRole = req.headers.get('x-user-role');

    let effectiveStudentId = studentId || sessionUserId || '00000000-0000-0000-0000-000000000011';
    if (sessionRole === 'student' && sessionUserId) {
      effectiveStudentId = sessionUserId;
    }

    // 1. Fetch assignment verification SQL
    const assignRes = await queryApp(
      `
      SELECT ma.verification_sql, ma.max_score
      FROM cohort_assignments ca
      JOIN master_assignments ma ON ca.master_assignment_id = ma.id
      WHERE ca.id = $1;
    `,
      [cohortAssignmentId]
    );

    if (assignRes.rowCount === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const { verification_sql, max_score } = assignRes.rows[0];

    // 2. Execute verification run
    const execResult = await executeSandboxQuery(submittedSql, verification_sql);

    let status = 'syntax_error';
    let score = 0;

    if (execResult.status === 'success') {
      if (execResult.testResults?.passed) {
        status = 'verified_pass';
        score = Number(max_score);
      } else {
        status = 'verified_fail';
        score = Math.round(((execResult.testResults?.scoreEstimate ?? 50) / 100) * Number(max_score));
      }
    } else {
      status = 'syntax_error';
      score = 0;
    }

    // 3. Get next version number
    const verRes = await queryApp(
      `
      SELECT COALESCE(MAX(version), 0) + 1 AS next_version
      FROM submissions
      WHERE cohort_assignment_id = $1 AND student_id = $2;
    `,
      [cohortAssignmentId, effectiveStudentId]
    );
    const nextVersion = verRes.rows[0].next_version;

    // 4. Insert submission
    const insertRes = await queryApp(
      `
      INSERT INTO submissions (
        cohort_assignment_id, student_id, version, submitted_sql,
        erd_diagram_json, execution_status, execution_output,
        verification_score, final_score, submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *;
    `,
      [
        cohortAssignmentId,
        effectiveStudentId,
        nextVersion,
        submittedSql,
        erdDiagramJson ? JSON.stringify(erdDiagramJson) : null,
        status,
        JSON.stringify(execResult),
        score,
        score, // Initial final_score defaults to verification_score until teacher adjusts
      ]
    );

    return NextResponse.json(
      {
        submission: insertRes.rows[0],
        execution: execResult,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
