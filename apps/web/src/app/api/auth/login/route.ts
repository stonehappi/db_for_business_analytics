import { NextRequest, NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';
import { comparePassword, signToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Query user with password_hash
    const userRes = await queryApp(
      `SELECT id, student_id_code, email, password_hash, full_name, role FROM users WHERE LOWER(email) = $1`,
      [cleanEmail]
    );

    if (userRes.rowCount === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = userRes.rows[0];

    // Check password
    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Account has no password set. Please contact administrator.' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    });

    const sanitizedUser = {
      id: user.id,
      student_id_code: user.student_id_code,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    };

    const response = NextResponse.json({
      success: true,
      user: sanitizedUser,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Authentication error' }, { status: 500 });
  }
}
