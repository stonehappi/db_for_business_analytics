import { NextRequest, NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const body = await req.json();
    const { moduleId, studentId, cohortId, answers } = body;

    const effectiveStudentId = studentId || user?.id;
    if (!moduleId || !effectiveStudentId) {
      return NextResponse.json(
        { error: 'moduleId and studentId are required' },
        { status: 400 }
      );
    }

    // Fetch quiz data from module
    const modRes = await queryApp(
      `SELECT id, title, week_number, quiz_data FROM master_modules WHERE id = $1`,
      [moduleId]
    );

    if (modRes.rowCount === 0) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const quizData = modRes.rows[0].quiz_data || [];
    if (!Array.isArray(quizData) || quizData.length === 0) {
      return NextResponse.json(
        { error: 'No quiz questions configured for this module' },
        { status: 400 }
      );
    }

    let correctCount = 0;
    const feedback = quizData.map((q: any) => {
      const selectedIndex = answers ? answers[q.id] : undefined;
      const isCorrect = selectedIndex !== undefined && Number(selectedIndex) === Number(q.correctIndex);
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        selectedIndex,
        correctIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const totalQuestions = quizData.length;
    const scorePct = Math.round((correctCount / totalQuestions) * 100);

    // Persist submission
    await queryApp(
      `
      INSERT INTO quiz_submissions (module_id, student_id, cohort_id, score, max_score, answers, submitted_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (module_id, student_id) DO UPDATE SET
        cohort_id = COALESCE(EXCLUDED.cohort_id, quiz_submissions.cohort_id),
        score = EXCLUDED.score,
        max_score = EXCLUDED.max_score,
        answers = EXCLUDED.answers,
        submitted_at = NOW();
      `,
      [
        moduleId,
        effectiveStudentId,
        cohortId || null,
        scorePct,
        100,
        JSON.stringify({ answers, feedback, correctCount, totalQuestions }),
      ]
    );

    return NextResponse.json({
      success: true,
      moduleId,
      score: scorePct,
      correctCount,
      totalCount: totalQuestions,
      passed: scorePct >= 70,
      feedback,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
