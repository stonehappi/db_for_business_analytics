import { NextRequest, NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';
import { getSessionUser, hashPassword } from '@/lib/auth';

// GET /api/students: List students (optionally filtered by cohortId and search query)
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'teacher' && user.role !== 'ta')) {
      return NextResponse.json(
        { error: 'Forbidden: Only teachers and TAs can manage students' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const cohortId = searchParams.get('cohortId');
    const search = searchParams.get('search')?.trim();
    const searchPattern = search ? `%${search}%` : null;

    if (cohortId && cohortId !== 'all') {
      const res = await queryApp(
        `
        SELECT 
          u.id,
          u.student_id_code,
          u.full_name,
          u.email,
          u.role,
          u.created_at,
          ce.enrolled_at,
          c.id AS cohort_id,
          c.code AS cohort_code,
          c.name AS cohort_name,
          c.term AS cohort_term,
          ce.final_weighted_score,
          ce.final_letter_grade
        FROM cohort_enrollments ce
        JOIN users u ON ce.student_id = u.id
        JOIN cohorts c ON ce.cohort_id = c.id
        WHERE ce.cohort_id = $1
          AND ($2::text IS NULL OR (
            u.full_name ILIKE $2 OR
            u.email ILIKE $2 OR
            u.student_id_code ILIKE $2
          ))
        ORDER BY u.student_id_code ASC NULLS LAST, u.full_name ASC;
      `,
        [cohortId, searchPattern]
      );
      return NextResponse.json(res.rows);
    }

    // All students
    const res = await queryApp(
      `
      SELECT 
        u.id,
        u.student_id_code,
        u.full_name,
        u.email,
        u.role,
        u.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'cohort_id', c.id,
              'cohort_code', c.code,
              'cohort_name', c.name,
              'term', c.term,
              'enrolled_at', ce.enrolled_at,
              'final_weighted_score', ce.final_weighted_score,
              'final_letter_grade', ce.final_letter_grade
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'::json
        ) AS enrollments
      FROM users u
      LEFT JOIN cohort_enrollments ce ON u.id = ce.student_id
      LEFT JOIN cohorts c ON ce.cohort_id = c.id
      WHERE u.role = 'student'
        AND ($1::text IS NULL OR (
          u.full_name ILIKE $1 OR
          u.email ILIKE $1 OR
          u.student_id_code ILIKE $1
        ))
      GROUP BY u.id, u.student_id_code, u.full_name, u.email, u.role, u.created_at
      ORDER BY u.student_id_code ASC NULLS LAST, u.full_name ASC;
    `,
      [searchPattern]
    );

    return NextResponse.json(res.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/students: Create a new student and optionally enroll into cohort
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'teacher' && user.role !== 'ta')) {
      return NextResponse.json(
        { error: 'Forbidden: Only teachers and TAs can create students' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { fullName, email, studentIdCode, password, cohortId } = body;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(fullName).trim();
    const cleanCode = studentIdCode ? String(studentIdCode).trim() : null;
    const studentPassword = password && String(password).trim().length >= 6
      ? String(password).trim()
      : 'Password123!';

    // Check if user already exists
    const existingRes = await queryApp(
      `SELECT id, student_id_code, email, full_name, role FROM users WHERE LOWER(email) = $1`,
      [cleanEmail]
    );

    let studentId: string;
    let studentRecord: any;

    if (existingRes.rowCount > 0) {
      studentRecord = existingRes.rows[0];
      studentId = studentRecord.id;

      // Update student code if provided and not already set
      if (cleanCode && !studentRecord.student_id_code) {
        await queryApp(
          `UPDATE users SET student_id_code = $1, updated_at = NOW() WHERE id = $2`,
          [cleanCode, studentId]
        );
        studentRecord.student_id_code = cleanCode;
      }
    } else {
      // Check if studentIdCode conflict
      if (cleanCode) {
        const codeCheck = await queryApp(
          `SELECT id FROM users WHERE student_id_code = $1`,
          [cleanCode]
        );
        if (codeCheck.rowCount > 0) {
          return NextResponse.json(
            { error: `Student ID code "${cleanCode}" is already assigned to another student` },
            { status: 409 }
          );
        }
      }

      const hashed = await hashPassword(studentPassword);
      const insertRes = await queryApp(
        `
        INSERT INTO users (student_id_code, email, password_hash, full_name, role)
        VALUES ($1, $2, $3, $4, 'student')
        RETURNING id, student_id_code, email, full_name, role, created_at;
      `,
        [cleanCode, cleanEmail, hashed, cleanName]
      );
      studentRecord = insertRes.rows[0];
      studentId = studentRecord.id;
    }

    // Enroll into cohort if provided
    if (cohortId) {
      await queryApp(
        `
        INSERT INTO cohort_enrollments (cohort_id, student_id)
        VALUES ($1, $2)
        ON CONFLICT (cohort_id, student_id) DO NOTHING;
      `,
        [cohortId, studentId]
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: existingRes.rowCount > 0 ? 'Student already existed; enrollment updated' : 'Student created successfully',
        student: studentRecord,
      },
      { status: existingRes.rowCount > 0 ? 200 : 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
