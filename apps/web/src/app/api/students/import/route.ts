import { NextRequest, NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';
import { getSessionUser, hashPassword } from '@/lib/auth';

interface RawStudentInput {
  studentIdCode?: string;
  fullName: string;
  email: string;
  password?: string;
}

// Simple CSV parser supporting quotes and commas
function parseCsv(text: string): RawStudentInput[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Parse CSV line into columns
  const parseLine = (line: string): string[] => {
    const cols: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cols.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    cols.push(cur.trim());
    return cols;
  };

  const headerLine = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[\s_-]/g, ''));
  const hasHeader = headerLine.some((h) => ['email', 'fullname', 'name', 'studentid', 'studentidcode'].includes(h));

  const startIndex = hasHeader ? 1 : 0;
  let codeIdx = hasHeader ? headerLine.findIndex((h) => h.includes('id') || h.includes('code')) : 0;
  let nameIdx = hasHeader ? headerLine.findIndex((h) => h.includes('name')) : 1;
  let emailIdx = hasHeader ? headerLine.findIndex((h) => h.includes('email') || h.includes('mail')) : 2;
  let passIdx = hasHeader ? headerLine.findIndex((h) => h.includes('pass')) : 3;

  // Fallbacks if not recognized
  if (codeIdx === -1) codeIdx = 0;
  if (nameIdx === -1) nameIdx = 1;
  if (emailIdx === -1) emailIdx = 2;

  const results: RawStudentInput[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (cols.length === 0 || cols.every((c) => !c)) continue;

    const email = (cols[emailIdx] || '').trim();
    const fullName = (cols[nameIdx] || '').trim();
    const studentIdCode = (cols[codeIdx] || '').trim();
    const password = passIdx !== -1 && cols[passIdx] ? cols[passIdx].trim() : undefined;

    if (email && fullName) {
      results.push({
        studentIdCode: studentIdCode || undefined,
        fullName,
        email,
        password,
      });
    }
  }

  return results;
}

// POST /api/students/import: Bulk import students from JSON array or CSV text
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'teacher' && user.role !== 'ta')) {
      return NextResponse.json(
        { error: 'Forbidden: Only teachers and TAs can import students' },
        { status: 403 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    let cohortId: string | undefined;
    let studentsToImport: RawStudentInput[] = [];

    if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
      const csvText = await req.text();
      const url = new URL(req.url);
      cohortId = url.searchParams.get('cohortId') || undefined;
      studentsToImport = parseCsv(csvText);
    } else {
      const body = await req.json();
      cohortId = body.cohortId;

      if (body.csvText) {
        studentsToImport = parseCsv(body.csvText);
      } else if (Array.isArray(body.students)) {
        studentsToImport = body.students;
      }
    }

    if (!studentsToImport || studentsToImport.length === 0) {
      return NextResponse.json(
        { error: 'No valid student records provided. Please provide valid CSV or students array.' },
        { status: 400 }
      );
    }

    let createdCount = 0;
    let updatedCount = 0;
    let enrolledCount = 0;
    const errors: string[] = [];
    const processedStudents: any[] = [];

    // Process each student
    for (let i = 0; i < studentsToImport.length; i++) {
      const item = studentsToImport[i];
      const email = String(item.email || '').trim().toLowerCase();
      const fullName = String(item.fullName || '').trim();
      const studentIdCode = item.studentIdCode ? String(item.studentIdCode).trim() : null;
      const rawPassword = item.password && String(item.password).trim().length >= 6
        ? String(item.password).trim()
        : 'Password123!';

      if (!email || !fullName) {
        errors.push(`Row ${i + 1}: Email and Full Name are required`);
        continue;
      }

      try {
        // Check existing user by email
        const existing = await queryApp(
          `SELECT id, student_id_code, email, full_name, role FROM users WHERE LOWER(email) = $1`,
          [email]
        );

        let studentId: string;

        if (existing.rowCount > 0) {
          studentId = existing.rows[0].id;
          // Update student code or name if needed
          if (studentIdCode && !existing.rows[0].student_id_code) {
            await queryApp(
              `UPDATE users SET student_id_code = $1, updated_at = NOW() WHERE id = $2`,
              [studentIdCode, studentId]
            );
          }
          updatedCount++;
          processedStudents.push({ ...existing.rows[0], status: 'updated' });
        } else {
          // Create new student
          const hash = await hashPassword(rawPassword);
          const insertRes = await queryApp(
            `
            INSERT INTO users (student_id_code, email, password_hash, full_name, role)
            VALUES ($1, $2, $3, $4, 'student')
            ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
            RETURNING id, student_id_code, email, full_name, role;
          `,
            [studentIdCode, email, hash, fullName]
          );
          studentId = insertRes.rows[0].id;
          createdCount++;
          processedStudents.push({ ...insertRes.rows[0], status: 'created' });
        }

        // Enroll in cohort if specified
        if (cohortId) {
          const enrollRes = await queryApp(
            `
            INSERT INTO cohort_enrollments (cohort_id, student_id)
            VALUES ($1, $2)
            ON CONFLICT (cohort_id, student_id) DO NOTHING
            RETURNING cohort_id, student_id;
          `,
            [cohortId, studentId]
          );
          if (enrollRes.rowCount > 0) {
            enrolledCount++;
          }
        }
      } catch (err: any) {
        errors.push(`Row ${i + 1} (${email}): ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import complete: ${createdCount} created, ${updatedCount} existing, ${enrolledCount} enrolled in class.`,
      totalProcessed: studentsToImport.length,
      createdCount,
      updatedCount,
      enrolledCount,
      errors,
      students: processedStudents,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
