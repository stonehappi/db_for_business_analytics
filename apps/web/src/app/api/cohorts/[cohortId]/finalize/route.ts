import { NextRequest, NextResponse } from 'next/server';
import { queryApp, appPool } from '@db-platform/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { cohortId: string } }
) {
  const client = await appPool.connect();
  try {
    const { cohortId } = params;

    await client.query('BEGIN;');

    // 1. Mark cohort as completed
    const cohortRes = await client.query(
      `
      UPDATE cohorts
      SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `,
      [cohortId]
    );

    if (cohortRes.rowCount === 0) {
      await client.query('ROLLBACK;');
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    // 2. Fetch current calculated final scores from vw_cohort_final_gradebook
    const gradebookRes = await client.query(
      `
      SELECT student_uuid, total_weighted_score, letter_grade
      FROM vw_cohort_final_gradebook
      WHERE cohort_id = $1;
    `,
      [cohortId]
    );

    // 3. Snapshot into cohort_enrollments
    let totalScoreSum = 0;
    for (const row of gradebookRes.rows) {
      const score = Number(row.total_weighted_score) || 0;
      totalScoreSum += score;
      await client.query(
        `
        UPDATE cohort_enrollments
        SET final_weighted_score = $1, final_letter_grade = $2
        WHERE cohort_id = $3 AND student_id = $4;
      `,
        [row.total_weighted_score, row.letter_grade, cohortId, row.student_uuid]
      );
    }

    const studentsFinalized = gradebookRes.rowCount ?? 0;
    const cohortAverage =
      studentsFinalized > 0
        ? Math.round((totalScoreSum / studentsFinalized) * 100) / 100
        : 0;

    await client.query('COMMIT;');

    return NextResponse.json({
      cohortId,
      status: 'completed',
      completedAt: cohortRes.rows[0].completed_at,
      studentsFinalized,
      cohortAverage,
    });
  } catch (err: any) {
    await client.query('ROLLBACK;');
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
