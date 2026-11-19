import { NextRequest, NextResponse } from 'next/server';
import { executeSandboxQuery, executePythonSandbox } from '@db-platform/sandbox';
import { queryApp } from '@db-platform/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cohortAssignmentId, submittedSql, submittedPython, erdDiagramJson, studentId, language } = body;

    if (!cohortAssignmentId || (!submittedSql && !submittedPython)) {
      return NextResponse.json(
        { error: 'cohortAssignmentId and either submittedSql or submittedPython are required' },
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

    // 1. Fetch assignment details (language, verifications, max_score)
    const assignRes = await queryApp(
      `
      SELECT ma.language, ma.verification_sql, ma.verification_python, ma.max_score
      FROM cohort_assignments ca
      JOIN master_assignments ma ON ca.master_assignment_id = ma.id
      WHERE ca.id = $1;
    `,
      [cohortAssignmentId]
    );

    if (assignRes.rowCount === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const {
      language: assignLang,
      verification_sql,
      verification_python,
      max_score,
    } = assignRes.rows[0];

    const effectiveLanguage = (language || (submittedPython ? 'python' : assignLang) || 'sql').toLowerCase();

    // 2. Execute verification run based on language
    let execResult: any;
    let status = 'syntax_error';
    let score = 0;

    if (effectiveLanguage === 'python') {
      const codeToRun = submittedPython || submittedSql;
      execResult = await executePythonSandbox(codeToRun, verification_python);

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
    } else {
      const codeToRun = submittedSql || submittedPython;
      execResult = await executeSandboxQuery(codeToRun, verification_sql);

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
        cohort_assignment_id, student_id, version, submitted_sql, submitted_python,
        erd_diagram_json, execution_status, execution_output, execution_artifacts,
        verification_score, final_score, submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *;
    `,
      [
        cohortAssignmentId,
        effectiveStudentId,
        nextVersion,
        submittedSql || null,
        submittedPython || null,
        erdDiagramJson ? JSON.stringify(erdDiagramJson) : null,
        status,
        JSON.stringify(execResult),
        effectiveLanguage === 'python' ? JSON.stringify(execResult) : null,
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
