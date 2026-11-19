import { NextRequest, NextResponse } from 'next/server';
import { queryApp, generate16WeeksForCourse } from '@db-platform/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const isStudent = user && user.role === 'student';

    let coursesRes;
    if (isStudent) {
      // Students only see courses they have enrolled classes in
      coursesRes = await queryApp(
        `
        SELECT 
          mc.id,
          mc.code,
          mc.title,
          mc.description,
          mc.teacher_id,
          u.full_name AS teacher_name,
          u.email AS teacher_email,
          COUNT(DISTINCT c.id)::int AS class_count,
          COUNT(DISTINCT mm.id)::int AS module_count,
          COUNT(DISTINCT ce.student_id)::int AS student_count,
          mc.created_at
        FROM master_courses mc
        JOIN cohorts c ON c.course_id = mc.id
        JOIN cohort_enrollments ce ON ce.cohort_id = c.id AND ce.student_id = $1
        LEFT JOIN users u ON mc.teacher_id = u.id
        LEFT JOIN master_modules mm ON mm.course_id = mc.id
        GROUP BY mc.id, u.full_name, u.email
        ORDER BY mc.code ASC;
        `,
        [user.id]
      );
    } else {
      // Teachers and TAs see all master courses
      coursesRes = await queryApp(`
        SELECT 
          mc.id,
          mc.code,
          mc.title,
          mc.description,
          mc.teacher_id,
          u.full_name AS teacher_name,
          u.email AS teacher_email,
          COUNT(DISTINCT c.id)::int AS class_count,
          COUNT(DISTINCT mm.id)::int AS module_count,
          COUNT(DISTINCT ce.student_id)::int AS student_count,
          mc.created_at
        FROM master_courses mc
        LEFT JOIN users u ON mc.teacher_id = u.id
        LEFT JOIN cohorts c ON c.course_id = mc.id
        LEFT JOIN master_modules mm ON mm.course_id = mc.id
        LEFT JOIN cohort_enrollments ce ON ce.cohort_id = c.id
        GROUP BY mc.id, u.full_name, u.email
        ORDER BY mc.code ASC;
      `);
    }

    return NextResponse.json(coursesRes.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Only teachers can create master courses' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { code, title, description, autoGenerateWeeks = true } = body;

    if (!code || !title) {
      return NextResponse.json(
        { error: 'Course code and title are required' },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim().toUpperCase();
    const cleanTitle = String(title).trim();
    const cleanDesc = description ? String(description).trim() : null;

    const res = await queryApp(
      `
      INSERT INTO master_courses (code, title, description, teacher_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
      `,
      [cleanCode, cleanTitle, cleanDesc, user.id]
    );

    const createdCourse = res.rows[0];

    // Automatically generate 16 weeks of structured curriculum
    if (autoGenerateWeeks) {
      try {
        await generate16WeeksForCourse(createdCourse.id, cleanCode);
      } catch (genErr) {
        console.error('Warning: Error auto-generating 16 weeks:', genErr);
      }
    }

    return NextResponse.json(createdCourse, { status: 201 });
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json(
        { error: `Course code already exists` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Only teachers can delete master courses' },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Course id is required' }, { status: 400 });
    }

    const res = await queryApp(
      `DELETE FROM master_courses WHERE id = $1 RETURNING id, code, title;`,
      [id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Course ${res.rows[0].code} successfully deleted`,
      deletedCourse: res.rows[0],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
