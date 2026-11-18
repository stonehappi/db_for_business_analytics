'use client';

import AppShell, { TabType } from '@/components/AppShell';

interface RouteProps {
  params: {
    courseId: string;
    cohortId: string;
    tab: string;
  };
}

const VALID_TABS: TabType[] = ['workspace', 'gradebook', 'curriculum', 'my-grades'];

export default function CourseCohortTabPage({ params }: RouteProps) {
  const tab: TabType = VALID_TABS.includes(params.tab as TabType)
    ? (params.tab as TabType)
    : 'workspace';

  return (
    <AppShell
      initialCourseId={params.courseId}
      initialCohortId={params.cohortId}
      initialTab={tab}
    />
  );
}
