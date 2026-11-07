import { NextRequest, NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';
import ExcelJS from 'exceljs';

export async function GET(
  req: NextRequest,
  { params }: { params: { cohortId: string } }
) {
  try {
    const { cohortId } = params;
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get('format') || 'csv').toLowerCase();

    // 1. Fetch cohort details
    const cohortRes = await queryApp(`SELECT * FROM cohorts WHERE id = $1`, [cohortId]);
    if (cohortRes.rowCount === 0) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }
    const cohort = cohortRes.rows[0];

    // 2. Fetch published assignments
    const assignmentsRes = await queryApp(
      `
      SELECT 
        ca.id AS cohort_assignment_id,
        ma.id AS master_assignment_id,
        ma.title,
        ma.slug,
        COALESCE(ca.weight_override, ma.weight_percentage) AS weight_percentage,
        ma.max_score
      FROM cohort_assignments ca
      JOIN master_assignments ma ON ca.master_assignment_id = ma.id
      WHERE ca.cohort_id = $1 AND ca.is_published = TRUE
      ORDER BY ma.sort_order ASC;
    `,
      [cohortId]
    );
    const assignments = assignmentsRes.rows;

    // 3. Fetch gradebook rows
    const gradebookRes = await queryApp(
      `
      SELECT *
      FROM vw_cohort_final_gradebook
      WHERE cohort_id = $1
      ORDER BY student_id_code ASC;
    `,
      [cohortId]
    );
    const students = gradebookRes.rows;

    // 4. Log export event
    // exported_by: default to teacher_id
    const teacherId = cohort.teacher_id;
    await queryApp(
      `
      INSERT INTO gradebook_export_logs (cohort_id, exported_by, export_format, student_count)
      VALUES ($1, $2, $3, $4);
    `,
      [cohortId, teacherId, ['csv', 'xlsx', 'json'].includes(format) ? format : 'csv', students.length]
    );

    const dateStr = new Date().toISOString().split('T')[0];
    const safeCode = cohort.code.replace(/[^a-zA-Z0-9_-]/g, '_');

    // JSON Format
    if (format === 'json') {
      return NextResponse.json({
        cohort,
        exportedAt: new Date().toISOString(),
        assignments,
        gradebook: students,
      });
    }

    // CSV Format
    if (format === 'csv') {
      // Header columns
      const headers = [
        'Student_ID',
        'Full_Name',
        'Email',
        'Cohort_Code',
        ...assignments.map(
          (a) => `${a.title.replace(/,/g, '')} (${Number(a.weight_percentage)}%)`
        ),
        'Weighted_Total (100%)',
        'Letter_Grade',
      ];

      const csvRows = [headers.join(',')];

      for (const s of students) {
        const breakdown = s.assignment_breakdown || {};
        const assignmentScores = assignments.map((a) => {
          const item = breakdown[a.slug];
          return item ? Number(item.raw_score).toFixed(2) : '0.00';
        });

        const row = [
          `"${s.student_id_code || ''}"`,
          `"${s.student_name.replace(/"/g, '""')}"`,
          `"${s.student_email}"`,
          `"${cohort.code}"`,
          ...assignmentScores,
          Number(s.total_weighted_score).toFixed(2),
          `"${s.letter_grade}"`,
        ];
        csvRows.push(row.join(','));
      }

      const csvContent = csvRows.join('\r\n');
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="Gradebook_${safeCode}_${dateStr}.csv"`,
        },
      });
    }

    // XLSX Format (3-tab Excel Gradebook)
    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Antigravity Business Analytics LMS';
      workbook.created = new Date();

      // Tab 1: Final Summary
      const summarySheet = workbook.addWorksheet('Final Summary', {
        views: [{ state: 'frozen', xSplit: 2, ySplit: 1 }],
      });

      const summaryCols = [
        { header: 'Student ID', key: 'student_id', width: 16 },
        { header: 'Full Name', key: 'full_name', width: 24 },
        { header: 'Email', key: 'email', width: 26 },
        { header: 'Cohort Code', key: 'cohort_code', width: 18 },
        ...assignments.map((a) => ({
          header: `${a.title} (${Number(a.weight_percentage)}%)`,
          key: a.slug,
          width: 22,
        })),
        { header: 'Weighted Total (100%)', key: 'total_score', width: 22 },
        { header: 'Letter Grade', key: 'letter_grade', width: 14 },
      ];
      summarySheet.columns = summaryCols;

      // Header styling
      const headerRow1 = summarySheet.getRow(1);
      headerRow1.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow1.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF18181B' },
      };

      for (const s of students) {
        const breakdown = s.assignment_breakdown || {};
        const rowData: Record<string, any> = {
          student_id: s.student_id_code,
          full_name: s.student_name,
          email: s.student_email,
          cohort_code: cohort.code,
          total_score: Number(s.total_weighted_score),
          letter_grade: s.letter_grade,
        };
        for (const a of assignments) {
          const item = breakdown[a.slug];
          rowData[a.slug] = item ? Number(item.raw_score) : 0;
        }
        summarySheet.addRow(rowData);
      }

      // Tab 2: Raw Scores & Timestamps
      const rawSheet = workbook.addWorksheet('Raw Scores & Feedback', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      rawSheet.columns = [
        { header: 'Student ID', key: 'student_id', width: 16 },
        { header: 'Student Name', key: 'student_name', width: 22 },
        { header: 'Assignment', key: 'assignment_title', width: 30 },
        { header: 'Raw Score (100)', key: 'raw_score', width: 16 },
        { header: 'Execution Status', key: 'status', width: 18 },
        { header: 'Submitted At', key: 'submitted_at', width: 22 },
        { header: 'Graded At', key: 'graded_at', width: 22 },
      ];

      const headerRow2 = rawSheet.getRow(1);
      headerRow2.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow2.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF27272A' },
      };

      for (const s of students) {
        const breakdown = s.assignment_breakdown || {};
        for (const a of assignments) {
          const item = breakdown[a.slug];
          rawSheet.addRow({
            student_id: s.student_id_code,
            student_name: s.student_name,
            assignment_title: a.title,
            raw_score: item ? Number(item.raw_score) : 0,
            status: item?.execution_status || 'graded',
            submitted_at: item?.submitted_at ? new Date(item.submitted_at).toLocaleString() : 'N/A',
            graded_at: item?.graded_at ? new Date(item.graded_at).toLocaleString() : 'N/A',
          });
        }
      }

      // Tab 3: Cohort Analytics
      const analyticsSheet = workbook.addWorksheet('Cohort Analytics');
      analyticsSheet.columns = [
        { header: 'Metric', key: 'metric', width: 26 },
        { header: 'Value', key: 'value', width: 18 },
      ];
      const headerRow3 = analyticsSheet.getRow(1);
      headerRow3.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow3.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF18181B' },
      };

      const scores = students.map((s) => Number(s.total_weighted_score)).filter((n) => !isNaN(n));
      const count = scores.length;
      const sum = scores.reduce((acc, v) => acc + v, 0);
      const mean = count > 0 ? sum / count : 0;

      const sorted = [...scores].sort((a, b) => a - b);
      const median =
        count > 0
          ? count % 2 === 0
            ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
            : sorted[Math.floor(count / 2)]
          : 0;

      const min = count > 0 ? Math.min(...scores) : 0;
      const max = count > 0 ? Math.max(...scores) : 0;

      const variance =
        count > 1 ? scores.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count : 0;
      const stdDev = Math.sqrt(variance);

      analyticsSheet.addRow({ metric: 'Total Enrolled Students', value: count });
      analyticsSheet.addRow({ metric: 'Cohort Mean Total %', value: mean.toFixed(2) });
      analyticsSheet.addRow({ metric: 'Cohort Median Total %', value: median.toFixed(2) });
      analyticsSheet.addRow({ metric: 'Minimum Total %', value: min.toFixed(2) });
      analyticsSheet.addRow({ metric: 'Maximum Total %', value: max.toFixed(2) });
      analyticsSheet.addRow({ metric: 'Standard Deviation', value: stdDev.toFixed(2) });

      // Grade breakdown counts
      analyticsSheet.addRow({ metric: '', value: '' });
      analyticsSheet.addRow({ metric: 'Grade Distribution (Letter)', value: 'Count' });
      const gradeCounts: Record<string, number> = { A: 0, 'B+': 0, B: 0, 'C+': 0, C: 0, D: 0, F: 0 };
      for (const s of students) {
        if (s.letter_grade in gradeCounts) {
          gradeCounts[s.letter_grade]++;
        }
      }
      for (const [grade, gCount] of Object.entries(gradeCounts)) {
        analyticsSheet.addRow({ metric: `Grade ${grade}`, value: gCount });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="Gradebook_${safeCode}_${dateStr}.xlsx"`,
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
