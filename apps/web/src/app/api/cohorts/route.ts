import { NextRequest, NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const isStudent = user && user.role === 'student';

    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId');
    const term = url.searchParams.get('term');

    let cohortsRes;

    if (isStudent) {
      // Students only see classes they are enrolled in
      cohortsRes = await queryApp(
        `
        SELECT 
          c.id, c.course_id, c.code, c.name, c.term, c.status, c.completed_at, c.created_at,
          mc.code AS course_code, mc.title AS course_title,
          u.full_name AS teacher_name, u.email AS teacher_email,
          COUNT(DISTINCT ce.student_id)::int AS student_count,
          COUNT(DISTINCT ca.id)::int AS assignment_count
        FROM cohorts c
        JOIN cohort_enrollments ce_user ON ce_user.cohort_id = c.id AND ce_user.student_id = $1
        LEFT JOIN master_courses mc ON c.course_id = mc.id
        JOIN users u ON c.teacher_id = u.id
        LEFT JOIN cohort_enrollments ce ON ce.cohort_id = c.id
        LEFT JOIN cohort_assignments ca ON ca.cohort_id = c.id AND ca.is_published = TRUE
        WHERE ($2::uuid IS NULL OR c.course_id = $2)
          AND ($3::text IS NULL OR c.term = $3)
        GROUP BY c.id, mc.code, mc.title, u.full_name, u.email
        ORDER BY c.created_at ASC, c.code ASC;
        `,
        [user.id, courseId || null, term || null]
      );
    } else {
      // Teachers and TAs see all classes for the filtered course / semester
      cohortsRes = await queryApp(
        `
        SELECT 
          c.id, c.course_id, c.code, c.name, c.term, c.status, c.completed_at, c.created_at,
          mc.code AS course_code, mc.title AS course_title,
          u.full_name AS teacher_name, u.email AS teacher_email,
          COUNT(DISTINCT ce.student_id)::int AS student_count,
          COUNT(DISTINCT ca.id)::int AS assignment_count
        FROM cohorts c
        LEFT JOIN master_courses mc ON c.course_id = mc.id
        JOIN users u ON c.teacher_id = u.id
        LEFT JOIN cohort_enrollments ce ON ce.cohort_id = c.id
        LEFT JOIN cohort_assignments ca ON ca.cohort_id = c.id AND ca.is_published = TRUE
        WHERE ($1::uuid IS NULL OR c.course_id = $1)
          AND ($2::text IS NULL OR c.term = $2)
        GROUP BY c.id, mc.code, mc.title, u.full_name, u.email
        ORDER BY c.created_at ASC, c.code ASC;
        `,
        [courseId || null, term || null]
      );
    }

    return NextResponse.json(cohortsRes.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Only teachers can create classes' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { courseId, code, name, term, teacherId } = body;

    if (!code || !name || !term) {
      return NextResponse.json(
        { error: 'Code, name, and term are required' },
        { status: 400 }
      );
    }

    const assignedTeacherId = teacherId || user.id;

    const res = await queryApp(
      `
      INSERT INTO cohorts (course_id, code, name, term, teacher_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
      `,
      [courseId || null, String(code).trim().toUpperCase(), String(name).trim(), String(term).trim(), assignedTeacherId]
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json(
        { error: 'Class code already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
