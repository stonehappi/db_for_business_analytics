import { NextRequest, NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      moduleId,
      title,
      slug,
      type,
      businessCaseMarkdown,
      starterSql,
      solutionSql,
      verificationSql,
      maxScore = 100,
      weightPercentage = 0,
      rubricCriteria = [],
      sortOrder = 1,
    } = body;

    if (!moduleId || !title || !slug || !type) {
      return NextResponse.json({ error: 'Missing required assignment fields' }, { status: 400 });
    }

    const res = await queryApp(
      `
      INSERT INTO master_assignments (
        module_id, title, slug, type, business_case_markdown, starter_sql, solution_sql,
        verification_sql, max_score, weight_percentage, rubric_criteria, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `,
      [
        moduleId,
        title,
        slug,
        type,
        businessCaseMarkdown || '',
        starterSql || '',
        solutionSql || '',
        verificationSql || '',
        maxScore,
        weightPercentage,
        JSON.stringify(rubricCriteria),
        sortOrder,
      ]
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
