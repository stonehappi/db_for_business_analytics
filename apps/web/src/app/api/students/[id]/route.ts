import { NextRequest, NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';
import { getSessionUser, hashPassword } from '@/lib/auth';

// PUT /api/students/[id]: Update student details or reset password
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'teacher' && user.role !== 'ta')) {
      return NextResponse.json(
        { error: 'Forbidden: Only teachers and TAs can update students' },
        { status: 403 }
      );
    }

    const studentId = params.id;
    const body = await req.json();
    const { fullName, email, studentIdCode, password, cohortId, enrollAction } = body;

    const existingRes = await queryApp(
      `SELECT id, student_id_code, email, full_name, role FROM users WHERE id = $1 AND role = 'student'`,
      [studentId]
    );

    if (existingRes.rowCount === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check email uniqueness if email changed
    if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      const conflictRes = await queryApp(
        `SELECT id FROM users WHERE LOWER(email) = $1 AND id != $2`,
        [cleanEmail, studentId]
      );
      if (conflictRes.rowCount > 0) {
        return NextResponse.json({ error: 'Email already used by another account' }, { status: 409 });
      }
    }

    // Check studentIdCode uniqueness if changed
    if (studentIdCode) {
      const cleanCode = String(studentIdCode).trim();
      const conflictRes = await queryApp(
        `SELECT id FROM users WHERE student_id_code = $1 AND id != $2`,
        [cleanCode, studentId]
      );
      if (conflictRes.rowCount > 0) {
        return NextResponse.json({ error: 'Student ID code already used by another student' }, { status: 409 });
      }
    }

    let passwordHashUpdate = '';
    const updateParams: any[] = [];
    let paramIndex = 1;

    let updateFields: string[] = ['updated_at = NOW()'];

    if (fullName) {
      updateFields.push(`full_name = $${paramIndex++}`);
      updateParams.push(String(fullName).trim());
    }

    if (email) {
      updateFields.push(`email = $${paramIndex++}`);
      updateParams.push(String(email).trim().toLowerCase());
    }

    if (studentIdCode !== undefined) {
      updateFields.push(`student_id_code = $${paramIndex++}`);
      updateParams.push(studentIdCode ? String(studentIdCode).trim() : null);
    }

    if (password && String(password).trim().length >= 6) {
      const hashed = await hashPassword(String(password).trim());
      updateFields.push(`password_hash = $${paramIndex++}`);
      updateParams.push(hashed);
    }

    updateParams.push(studentId);

    const updateQuery = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, student_id_code, email, full_name, role, updated_at;
    `;

    const res = await queryApp(updateQuery, updateParams);

    // If cohort enrollment change requested
    if (cohortId && enrollAction === 'enroll') {
      await queryApp(
        `
        INSERT INTO cohort_enrollments (cohort_id, student_id)
        VALUES ($1, $2)
        ON CONFLICT (cohort_id, student_id) DO NOTHING;
      `,
        [cohortId, studentId]
      );
    } else if (cohortId && enrollAction === 'unenroll') {
      await queryApp(
        `DELETE FROM cohort_enrollments WHERE cohort_id = $1 AND student_id = $2;`,
        [cohortId, studentId]
      );
    }

    return NextResponse.json({ success: true, student: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/students/[id]: Unenroll student from cohort or delete student user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'teacher' && user.role !== 'ta')) {
      return NextResponse.json(
        { error: 'Forbidden: Only teachers and TAs can delete/unenroll students' },
        { status: 403 }
      );
    }

    const studentId = params.id;
    const { searchParams } = new URL(req.url);
    const cohortId = searchParams.get('cohortId');

    if (cohortId) {
      // Unenroll from specific cohort
      await queryApp(
        `DELETE FROM cohort_enrollments WHERE cohort_id = $1 AND student_id = $2;`,
        [cohortId, studentId]
      );
      return NextResponse.json({ success: true, message: 'Student successfully unenrolled from class section' });
    }

    // Delete student account entirely
    await queryApp(
      `DELETE FROM users WHERE id = $1 AND role = 'student';`,
      [studentId]
    );

    return NextResponse.json({ success: true, message: 'Student account deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
