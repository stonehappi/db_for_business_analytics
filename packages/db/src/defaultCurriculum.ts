import { queryApp } from './client';
import { weeklyCurriculum } from './curriculumContent';

export async function generate16WeeksForCourse(courseId: string, courseCode?: string) {
  // Resolve course code if not provided
  let code = courseCode;
  if (!code) {
    const courseRes = await queryApp(`SELECT code FROM master_courses WHERE id = $1`, [courseId]);
    if (courseRes.rowCount === 0) {
      throw new Error(`Course with id ${courseId} not found`);
    }
    code = courseRes.rows[0].code;
  }

  const prefix = String(code).trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
  const insertedModules: any[] = [];

  for (const m of weeklyCurriculum) {
    const moduleSlug = `${prefix}-w${m.num}-${m.slug.replace(/^w\d+-/, '')}`;

    // Insert or update module
    const modRes = await queryApp(
      `
      INSERT INTO master_modules (
        course_id, title, slug, description, week_number, sort_order, lecture_slides_html, quiz_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (slug) DO UPDATE SET
        course_id = EXCLUDED.course_id,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        week_number = EXCLUDED.week_number,
        sort_order = EXCLUDED.sort_order,
        lecture_slides_html = EXCLUDED.lecture_slides_html,
        quiz_data = EXCLUDED.quiz_data
      RETURNING *;
      `,
      [
        courseId,
        m.title,
        moduleSlug,
        m.desc,
        m.num,
        m.num,
        m.lectureSlidesHtml,
        JSON.stringify(m.quizData || []),
      ]
    );

    const moduleRow = modRes.rows[0];
    insertedModules.push(moduleRow);

    // If module has a project, insert project assignment
    if (m.project) {
      const p = m.project;
      const assignSlug = `${prefix}-w${m.num}-${p.slug.replace(/^w\d+-/, '')}`;

      await queryApp(
        `
        INSERT INTO master_assignments (
          module_id, title, slug, type, language,
          business_case_markdown, starter_sql, solution_sql, verification_sql,
          starter_python, solution_python, verification_python,
          max_score, weight_percentage, rubric_criteria, sort_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (slug) DO UPDATE SET
          module_id = EXCLUDED.module_id,
          title = EXCLUDED.title,
          business_case_markdown = EXCLUDED.business_case_markdown,
          starter_sql = EXCLUDED.starter_sql,
          solution_sql = EXCLUDED.solution_sql,
          verification_sql = EXCLUDED.verification_sql,
          starter_python = EXCLUDED.starter_python,
          solution_python = EXCLUDED.solution_python,
          verification_python = EXCLUDED.verification_python,
          max_score = EXCLUDED.max_score,
          weight_percentage = EXCLUDED.weight_percentage,
          rubric_criteria = EXCLUDED.rubric_criteria;
        `,
        [
          moduleRow.id,
          p.title,
          assignSlug,
          p.type || 'analytics_query',
          p.language || 'sql',
          p.businessCase || '',
          p.starterSql || null,
          p.solutionSql || null,
          p.verificationSql || '',
          p.starterPython || null,
          p.solutionPython || null,
          p.verificationPython || null,
          p.maxScore || 100,
          p.weightPercentage || 0,
          JSON.stringify(p.rubric || []),
          1,
        ]
      );
    }
  }

  return insertedModules;
}
