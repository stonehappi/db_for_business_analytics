import { NextRequest, NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';
import { hashPassword, signToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, password, studentIdCode } = body;

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

    // Enroll into active cohort
    const cohortRes = await queryApp(
      `SELECT id FROM cohorts WHERE code = 'BA-2026-FALL-A' LIMIT 1;`
    );
    if (cohortRes.rowCount > 0) {
      await queryApp(
        `
        INSERT INTO cohort_enrollments (cohort_id, student_id)
        VALUES ($1, $2)
        ON CONFLICT (cohort_id, student_id) DO NOTHING;
      `,
        [cohortRes.rows[0].id, newUser.id]
      );
    }

    // Generate JWT
    const token = await signToken({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
      fullName: newUser.full_name,
    });

    const response = NextResponse.json(
      { success: true, user: newUser },
      { status: 201 }
    );

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
