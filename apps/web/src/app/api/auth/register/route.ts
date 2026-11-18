import { NextRequest, NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';
import { hashPassword, getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Check authentication: self-registration for students is disabled
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || (sessionUser.role !== 'teacher' && sessionUser.role !== 'ta')) {
      return NextResponse.json(
        {
          error:
            'Student self-registration is disabled. Student accounts are managed and provisioned directly by course instructors.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { fullName, email, password, studentIdCode, cohortId } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'Full name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(fullName).trim();
    const code = studentIdCode ? String(studentIdCode).trim() : null;

    // Check if email already registered
    const existing = await queryApp(
      `SELECT id FROM users WHERE LOWER(email) = $1`,
      [cleanEmail]
    );

    if (existing.rowCount > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const hashed = await hashPassword(password);

    // Insert user
    const insertUserRes = await queryApp(
      `
      INSERT INTO users (student_id_code, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, 'student')
      RETURNING id, student_id_code, email, full_name, role;
    `,
      [code, cleanEmail, hashed, cleanName]
    );

    const newUser = insertUserRes.rows[0];

    // Enroll into cohort if specified or default
    const targetCohortId = cohortId;
    if (targetCohortId) {
      await queryApp(
        `
        INSERT INTO cohort_enrollments (cohort_id, student_id)
        VALUES ($1, $2)
        ON CONFLICT (cohort_id, student_id) DO NOTHING;
      `,
        [targetCohortId, newUser.id]
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Student account created by instructor',
        user: newUser,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
