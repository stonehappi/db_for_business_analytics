import { NextRequest, NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const url = new URL(req.url);
    const moduleId = url.searchParams.get('moduleId');
    const studentId = url.searchParams.get('studentId') || user?.id;

    if (!studentId) {
      return NextResponse.json({ error: 'studentId required' }, { status: 400 });
    }

    let res;
    if (moduleId) {
      res = await queryApp(
        `SELECT id, module_id, student_id, cohort_id, score, max_score, answers, submitted_at
         FROM quiz_submissions
         WHERE student_id = $1 AND module_id = $2
         ORDER BY submitted_at DESC LIMIT 1`,
        [studentId, moduleId]
      );
    } else {
      res = await queryApp(
        `SELECT id, module_id, student_id, cohort_id, score, max_score, answers, submitted_at
         FROM quiz_submissions
         WHERE student_id = $1
         ORDER BY submitted_at DESC`,
        [studentId]
      );
    }

    return NextResponse.json(moduleId ? (res.rows[0] || null) : res.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
