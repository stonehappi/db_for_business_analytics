import { NextRequest, NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId');

    let modulesRes;
    if (courseId) {
      modulesRes = await queryApp(
        `
        SELECT id, course_id, title, slug, description, week_number, sort_order, lecture_slides_html, quiz_data
        FROM master_modules
        WHERE course_id = $1
        ORDER BY sort_order ASC;
        `,
        [courseId]
      );
    } else {
      modulesRes = await queryApp(`
        SELECT id, course_id, title, slug, description, week_number, sort_order, lecture_slides_html, quiz_data
        FROM master_modules
        ORDER BY sort_order ASC;
      `);
    }

    const assignmentsRes = await queryApp(`
      SELECT id, module_id, title, slug, type, language, business_case_markdown, starter_sql, solution_sql, verification_sql, starter_python, solution_python, verification_python, dataset_config, max_score, weight_percentage, rubric_criteria, sort_order
      FROM master_assignments
      ORDER BY sort_order ASC;
    `);

    const modules = modulesRes.rows.map((m: any) => ({
      id: m.id,
      courseId: m.course_id,
      title: m.title,
      slug: m.slug,
      description: m.description,
      weekNumber: m.week_number,
      sortOrder: m.sort_order,
      lectureSlidesHtml: m.lecture_slides_html || '',
      quizData: m.quiz_data || [],
      assignments: assignmentsRes.rows
        .filter((a: any) => a.module_id === m.id)
        .map((a: any) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          type: a.type,
          language: a.language || 'sql',
          businessCaseMarkdown: a.business_case_markdown,
          starterSql: a.starter_sql,
          solutionSql: a.solution_sql,
          verificationSql: a.verification_sql,
          starterPython: a.starter_python,
          solutionPython: a.solution_python,
          verificationPython: a.verification_python,
          datasetConfig: a.dataset_config,
          maxScore: Number(a.max_score),
          weightPercentage: Number(a.weight_percentage),
          rubricCriteria: a.rubric_criteria,
          sortOrder: a.sort_order,
        })),
    }));

    return NextResponse.json(modules);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Only teachers can create master modules' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { courseId, title, slug, description, weekNumber, sortOrder } = body;

    if (!courseId || !title || !slug) {
      return NextResponse.json(
        { error: 'courseId, title, and slug are required' },
        { status: 400 }
      );
    }

    const res = await queryApp(
      `
      INSERT INTO master_modules (course_id, title, slug, description, week_number, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
      `,
      [courseId, title, slug, description || '', weekNumber || 1, sortOrder || 1]
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Only teachers can update master modules' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, lectureSlidesHtml, quizData, title, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'Module id is required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (lectureSlidesHtml !== undefined) {
      updates.push(`lecture_slides_html = $${idx++}`);
      values.push(lectureSlidesHtml);
    }
    if (quizData !== undefined) {
      updates.push(`quiz_data = $${idx++}`);
      values.push(JSON.stringify(quizData));
    }
    if (title !== undefined) {
      updates.push(`title = $${idx++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(description);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const sql = `
      UPDATE master_modules
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING *;
    `;

    const res = await queryApp(sql, values);
    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
