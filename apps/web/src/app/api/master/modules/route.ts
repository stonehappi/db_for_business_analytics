import { NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';

export async function GET() {
  try {
    const modulesRes = await queryApp(`
      SELECT id, title, slug, description, week_number, sort_order
      FROM master_modules
      ORDER BY sort_order ASC;
    `);

    const assignmentsRes = await queryApp(`
      SELECT id, module_id, title, slug, type, business_case_markdown, starter_sql, solution_sql, verification_sql, max_score, weight_percentage, rubric_criteria, sort_order
      FROM master_assignments
      ORDER BY sort_order ASC;
    `);

    const modules = modulesRes.rows.map((m: any) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      description: m.description,
      weekNumber: m.week_number,
      sortOrder: m.sort_order,
      assignments: assignmentsRes.rows
        .filter((a: any) => a.module_id === m.id)
        .map((a: any) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          type: a.type,
          businessCaseMarkdown: a.business_case_markdown,
          starterSql: a.starter_sql,
          solutionSql: a.solution_sql,
          verificationSql: a.verification_sql,
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
