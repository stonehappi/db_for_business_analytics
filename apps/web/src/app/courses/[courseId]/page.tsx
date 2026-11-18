'use client';

import AppShell from '@/components/AppShell';

interface RouteProps {
  params: {
    courseId: string;
  };
}

export default function CoursePage({ params }: RouteProps) {
  return (
    <AppShell
      initialCourseId={params.courseId}
    />
  );
}
