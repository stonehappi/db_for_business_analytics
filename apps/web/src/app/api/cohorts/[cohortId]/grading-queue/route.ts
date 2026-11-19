import { NextRequest, NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { cohortId: string } }
) {
  try {
    const { cohortId } = params;
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('assignmentId');

    let sql = `
      SELECT 
        s.id AS submission_id,
        s.cohort_assignment_id,
        s.student_id,
        s.version,
        s.submitted_sql,
        s.submitted_python,
        s.erd_diagram_json,
        s.execution_status,
        s.execution_output,
        s.execution_artifacts,
        s.verification_score,
        s.final_score,
        s.teacher_feedback,
        s.submitted_at,
        s.graded_at,
        u.student_id_code,
        u.full_name AS student_name,
        u.email AS student_email,
        ma.title AS assignment_title,
        ma.slug AS assignment_slug,
        ma.language,
        ma.solution_sql,
        ma.solution_python,
        ma.max_score,
        ma.rubric_criteria
      FROM submissions s
      JOIN cohort_assignments ca ON s.cohort_assignment_id = ca.id
      JOIN master_assignments ma ON ca.master_assignment_id = ma.id
      JOIN users u ON s.student_id = u.id
      WHERE ca.cohort_id = $1
    `;

    const queryParams: any[] = [cohortId];

    if (assignmentId) {
      queryParams.push(assignmentId);
      sql += ` AND (ca.id::text = $2 OR ma.id::text = $2 OR ma.slug = $2)`;
    }

    sql += ` ORDER BY s.submitted_at DESC;`;

    const res = await queryApp(sql, queryParams);
    return NextResponse.json(res.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
