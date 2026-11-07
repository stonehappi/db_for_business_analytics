import { NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';

export async function GET() {
  try {
    const cohortsRes = await queryApp(`
      SELECT 
        c.id, c.code, c.name, c.term, c.status, c.completed_at, c.created_at,
        u.full_name AS teacher_name, u.email AS teacher_email,
        COUNT(DISTINCT ce.student_id)::int AS student_count,
        COUNT(DISTINCT ca.id)::int AS assignment_count
      FROM cohorts c
      JOIN users u ON c.teacher_id = u.id
      LEFT JOIN cohort_enrollments ce ON ce.cohort_id = c.id
      LEFT JOIN cohort_assignments ca ON ca.cohort_id = c.id AND ca.is_published = TRUE
      GROUP BY c.id, u.full_name, u.email
      ORDER BY c.created_at DESC;
    `);

    return NextResponse.json(cohortsRes.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
