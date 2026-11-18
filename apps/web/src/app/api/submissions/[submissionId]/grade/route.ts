import { NextRequest, NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const { submissionId } = params;
    const body = await req.json();
    const { finalScore, teacherFeedback, status = 'graded', graderId } = body;

    const sessionUserId = req.headers.get('x-user-id');
    const sessionRole = req.headers.get('x-user-role');

    // Role-based authorization: students are strictly prohibited from grading
    if (sessionRole === 'student') {
      return NextResponse.json(
        { error: 'Forbidden: Students cannot grade or alter submissions' },
        { status: 403 }
      );
    }

    const effectiveGraderId = sessionUserId || graderId || '00000000-0000-0000-0000-000000000001';

    const res = await queryApp(
      `
      UPDATE submissions
      SET 
        final_score = $1,
        teacher_feedback = $2,
        execution_status = $3,
        graded_by = $4,
        graded_at = NOW()
      WHERE id = $5
      RETURNING *;
    `,
      [finalScore, teacherFeedback, status, effectiveGraderId, submissionId]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
