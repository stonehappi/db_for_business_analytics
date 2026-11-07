import { NextRequest, NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { cohortId: string } }
) {
  try {
    const { cohortId } = params;
    const body = await req.json();
    const { masterAssignmentId, dueAt, weightOverride, isPublished = true } = body;

    if (!masterAssignmentId) {
      return NextResponse.json({ error: 'masterAssignmentId is required' }, { status: 400 });
    }

    const res = await queryApp(
      `
      INSERT INTO cohort_assignments (
        cohort_id, master_assignment_id, due_at, weight_override, is_published
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (cohort_id, master_assignment_id) DO UPDATE SET
        due_at = EXCLUDED.due_at,
        weight_override = EXCLUDED.weight_override,
        is_published = EXCLUDED.is_published
      RETURNING *;
    `,
      [cohortId, masterAssignmentId, dueAt || null, weightOverride ?? null, isPublished]
    );

    return NextResponse.json(res.rows[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
