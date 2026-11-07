import { NextRequest, NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { cohortId: string } }
) {
  try {
    const { cohortId } = params;

    // 1. Cohort details
    const cohortRes = await queryApp(
      `
      SELECT c.*, u.full_name AS teacher_name, u.email AS teacher_email
      FROM cohorts c
      JOIN users u ON c.teacher_id = u.id
      WHERE c.id = $1;
    `,
      [cohortId]
    );

    if (cohortRes.rowCount === 0) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    // 2. Published assignments
    const assignmentsRes = await queryApp(
      `
      SELECT 
        ca.id AS cohort_assignment_id,
        ca.master_assignment_id,
        ca.weight_override,
        ca.due_at,
        ca.is_published,
        ma.title,
        ma.slug,
        ma.type,
        ma.max_score,
        COALESCE(ca.weight_override, ma.weight_percentage) AS weight_percentage,
        ma.sort_order
      FROM cohort_assignments ca
      JOIN master_assignments ma ON ca.master_assignment_id = ma.id
      WHERE ca.cohort_id = $1 AND ca.is_published = TRUE
      ORDER BY ma.sort_order ASC;
    `,
      [cohortId]
    );

    // 3. Students gradebook rows from vw_cohort_final_gradebook
    const gradebookRes = await queryApp(
      `
      SELECT *
      FROM vw_cohort_final_gradebook
      WHERE cohort_id = $1
      ORDER BY student_id_code ASC;
    `,
      [cohortId]
    );

    return NextResponse.json({
      cohort: cohortRes.rows[0],
      assignments: assignmentsRes.rows,
      grades: gradebookRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
