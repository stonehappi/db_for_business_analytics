import { NextRequest, NextResponse } from 'next/server';
import { generate16WeeksForCourse } from '@db-platform/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Only teachers can auto-generate curriculum' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { courseId, courseCode } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    const modules = await generate16WeeksForCourse(courseId, courseCode);

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${modules.length} syllabus weeks for course`,
      moduleCount: modules.length,
      modules,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
