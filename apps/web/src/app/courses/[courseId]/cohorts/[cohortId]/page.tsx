'use client';

import AppShell from '@/components/AppShell';

interface RouteProps {
  params: {
    courseId: string;
    cohortId: string;
  };
}

export default function CourseCohortPage({ params }: RouteProps) {
  return (
    <AppShell
      initialCourseId={params.courseId}
      initialCohortId={params.cohortId}
    />
  );
}
