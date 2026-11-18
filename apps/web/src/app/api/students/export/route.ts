import { NextRequest, NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';
import { getSessionUser } from '@/lib/auth';

// GET /api/students/export: Export student roster to CSV or JSON
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'teacher' && user.role !== 'ta')) {
      return NextResponse.json(
        { error: 'Forbidden: Only teachers and TAs can export students' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const cohortId = searchParams.get('cohortId');
    const format = (searchParams.get('format') || 'csv').toLowerCase();

    let cohortInfo: any = null;
    let students: any[] = [];

    if (cohortId && cohortId !== 'all') {
      const cohortRes = await queryApp(`SELECT * FROM cohorts WHERE id = $1`, [cohortId]);
      if (cohortRes.rowCount > 0) {
        cohortInfo = cohortRes.rows[0];
      }

      const res = await queryApp(
        `
        SELECT 
          u.student_id_code,
          u.full_name,
          u.email,
          c.code AS cohort_code,
          c.name AS cohort_name,
          c.term AS cohort_term,
          to_char(ce.enrolled_at, 'YYYY-MM-DD HH24:MI:SS') AS enrolled_date,
          ce.final_weighted_score,
          ce.final_letter_grade
        FROM cohort_enrollments ce
        JOIN users u ON ce.student_id = u.id
        JOIN cohorts c ON ce.cohort_id = c.id
        WHERE ce.cohort_id = $1
        ORDER BY u.student_id_code ASC NULLS LAST, u.full_name ASC;
      `,
        [cohortId]
      );
      students = res.rows;
    } else {
      const res = await queryApp(`
        SELECT 
          u.student_id_code,
          u.full_name,
          u.email,
          COALESCE(string_agg(c.code, '; '), 'None') AS cohort_code,
          COALESCE(string_agg(c.name, '; '), 'None') AS cohort_name,
          COALESCE(string_agg(c.term, '; '), 'None') AS cohort_term,
          to_char(u.created_at, 'YYYY-MM-DD HH24:MI:SS') AS enrolled_date,
          NULL AS final_weighted_score,
          NULL AS final_letter_grade
        FROM users u
        LEFT JOIN cohort_enrollments ce ON u.id = ce.student_id
        LEFT JOIN cohorts c ON ce.cohort_id = c.id
        WHERE u.role = 'student'
        GROUP BY u.id, u.student_id_code, u.full_name, u.email, u.created_at
        ORDER BY u.student_id_code ASC NULLS LAST, u.full_name ASC;
      `);
      students = res.rows;
    }

    if (format === 'json') {
      return NextResponse.json({
        cohort: cohortInfo,
        exportedAt: new Date().toISOString(),
        totalStudents: students.length,
        students,
      });
    }

    // Generate CSV
    const csvEscape = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Student_ID',
      'Full_Name',
      'Email',
      'Class_Code',
      'Class_Name',
      'Term',
      'Enrolled_Date',
      'Final_Score',
      'Letter_Grade',
    ];

    const rows = [headers.join(',')];

    for (const s of students) {
      rows.push(
        [
          csvEscape(s.student_id_code || 'N/A'),
          csvEscape(s.full_name),
          csvEscape(s.email),
          csvEscape(s.cohort_code),
          csvEscape(s.cohort_name),
          csvEscape(s.cohort_term),
          csvEscape(s.enrolled_date),
          csvEscape(s.final_weighted_score ?? ''),
          csvEscape(s.final_letter_grade ?? ''),
        ].join(',')
      );
    }

    const csvContent = rows.join('\r\n');
    const dateStr = new Date().toISOString().split('T')[0];
    const filenameCode = cohortInfo ? cohortInfo.code.replace(/[^a-zA-Z0-9_-]/g, '_') : 'all_students';
    const filename = `students_${filenameCode}_${dateStr}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
