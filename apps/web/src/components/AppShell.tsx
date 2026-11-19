'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import Sidebar, { TabType } from '@/components/Sidebar';
import CourseManagementView from '@/components/CourseManagementView';
import ClassManagementView from '@/components/ClassManagementView';
import StudentManagementView from '@/components/StudentManagementView';
import { UserProfile, Course, CohortClass } from '@/components/Navigation';
import StudentWorkspace from '@/components/StudentWorkspace';
import StudentGradesView from '@/components/StudentGradesView';
import GradebookMatrix from '@/components/GradebookMatrix';
import CurriculumView from '@/components/CurriculumView';
import McpConnectionModal from '@/components/McpConnectionModal';
import { useDialog } from '@/components/Dialog';
import {
  BookOpen,
  Calendar,
  X,
  Plus,
  PanelLeftOpen,
  ChevronRight,
  FolderKanban,
  Layers,
  Users,
  Sparkles,
  Trash2,
} from 'lucide-react';

export type { TabType } from '@/components/Sidebar';

interface AppShellProps {
  initialCourseId?: string;
  initialCohortId?: string;
  initialTab?: TabType;
}

export default function AppShell({
  initialCourseId,
  initialCohortId,
  initialTab,
}: AppShellProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'workspace');

  // Sidebar slide bar state
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Courses and Classes state
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId || '');
  const [classes, setClasses] = useState<CohortClass[]>([]);
  const [cohortId, setCohortId] = useState<string>(initialCohortId || '');


  // Create Course Modal state
  const [showNewCourseModal, setShowNewCourseModal] = useState<boolean>(false);
  const [newCourseCode, setNewCourseCode] = useState<string>('');
  const [newCourseTitle, setNewCourseTitle] = useState<string>('');
  const [newCourseDesc, setNewCourseDesc] = useState<string>('');
  const [courseError, setCourseError] = useState<string>('');
  const [isSubmittingCourse, setIsSubmittingCourse] = useState<boolean>(false);

  // Create Class Modal state
  const [showNewClassModal, setShowNewClassModal] = useState<boolean>(false);
  const [newClassCode, setNewClassCode] = useState<string>('');
  const [newClassName, setNewClassName] = useState<string>('');
  const [newClassTerm, setNewClassTerm] = useState<string>('Fall 2026');
  const [classError, setClassError] = useState<string>('');
  const [isSubmittingClass, setIsSubmittingClass] = useState<boolean>(false);

  // MCP AI Connection Modal state
  const [showMcpModal, setShowMcpModal] = useState<boolean>(false);

  const { confirm, alert } = useDialog();

  // Sync state with URL params when navigating or using browser Back/Forward
  useEffect(() => {
    const routeCourseId = params?.courseId as string | undefined;
    const routeCohortId = params?.cohortId as string | undefined;
    const routeTab = params?.tab as TabType | undefined;

    if (routeCourseId && routeCourseId !== selectedCourseId) {
      setSelectedCourseId(routeCourseId);
      fetchClassesForCourse(routeCourseId, routeCohortId);
    } else if (routeCohortId && routeCohortId !== cohortId) {
      setCohortId(routeCohortId);
    }

    if (routeTab && routeTab !== activeTab) {
      setActiveTab(routeTab);
    }
  }, [params]);

  const navigateToView = useCallback(
    (cId: string, coId: string, tab: TabType) => {
      if (cId && coId && tab) {
        router.push(`/courses/${cId}/cohorts/${coId}/${tab}`);
      } else if (tab === 'courses') {
        router.push('/manage/courses');
      } else if (tab === 'classes') {
        router.push('/manage/classes');
      } else if (tab === 'students') {
        router.push('/manage/students');
      }
    },
    [router]
  );

  const fetchClassesForCourse = async (courseId: string, preferredCohortId?: string) => {
    try {
      const res = await fetch(`/api/cohorts?courseId=${courseId}`);
      const data: CohortClass[] = await res.json();
      setClasses(data);
      if (data.length > 0) {
        const match = preferredCohortId && data.find((c) => c.id === preferredCohortId);
        const resolvedCohortId = match ? match.id : data[0].id;
        setCohortId(resolvedCohortId);
        return resolvedCohortId;
      } else {
        setCohortId('');
        return '';
      }
    } catch (err) {
      console.error('Error fetching cohorts for course:', err);
      return '';
    }
  };

  const fetchCoursesAndData = async (preferredCourseId?: string, preferredCohortId?: string) => {
    try {
      const res = await fetch('/api/courses');
      const courseList: Course[] = await res.json();
      setCourses(courseList);
      if (courseList.length > 0) {
        const activeCourse = preferredCourseId
          ? courseList.find((c) => c.id === preferredCourseId) || courseList[0]
          : courseList[0];
        setSelectedCourseId(activeCourse.id);
        const activeCohortId = await fetchClassesForCourse(activeCourse.id, preferredCohortId);
        return { courseId: activeCourse.id, cohortId: activeCohortId };
      } else {
        setSelectedCourseId('');
        setClasses([]);
        setCohortId('');
        return { courseId: '', cohortId: '' };
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      return { courseId: '', cohortId: '' };
    }
  };

  // Initial load
  useEffect(() => {
    // 1. Fetch current authenticated session
    fetch('/api/auth/me')
      .then(async (res) => {
        if (!res.ok) {
          window.location.href = '/login';
          return;
        }
        const data = await res.json();
        setCurrentUser(data.user);

        // If tab was not specified in initial route, choose role default
        if (!initialTab && !params?.tab) {
          const defaultTab: TabType =
            data.user.role === 'teacher' || data.user.role === 'ta'
              ? 'gradebook'
              : 'workspace';
          setActiveTab((currentTab) => {
            if (currentTab === 'workspace' && defaultTab === 'gradebook') {
              return 'gradebook';
            }
            return currentTab;
          });
        }
      })
      .catch(() => {
        window.location.href = '/login';
      });

    // 2. Fetch users for persona switcher
    fetch('/api/users')
      .then((res) => res.json())
      .then((data: UserProfile[]) => {
        setUsers(data);
      })
      .catch((err) => console.error('Error fetching users:', err));

    // 3. Fetch courses and initial class
    fetchCoursesAndData(initialCourseId, initialCohortId);
  }, []);

  // Keyboard shortcut: Ctrl+B / Cmd+B to toggle sidebar navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // When user switches tab
  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    if (selectedCourseId && cohortId) {
      navigateToView(selectedCourseId, cohortId, newTab);
    } else {
      if (newTab === 'courses') router.push('/manage/courses');
      else if (newTab === 'classes') router.push('/manage/classes');
      else if (newTab === 'students') router.push('/manage/students');
    }
  };

  // When user switches course from navigation or management
  const handleSelectCourse = async (cId: string) => {
    setSelectedCourseId(cId);
    const nextCohortId = await fetchClassesForCourse(cId);
    if (cId && nextCohortId) {
      navigateToView(cId, nextCohortId, activeTab);
    }
  };

  // When user switches class/cohort
  const handleSelectClass = (cId: string) => {
    setCohortId(cId);
    if (selectedCourseId && cId) {
      navigateToView(selectedCourseId, cId, activeTab);
    }
  };

  // When user switches role / login
  const handleSelectUser = async (user: UserProfile) => {
    try {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: 'Password123!' }),
      });
    } catch {}

    setCurrentUser(user);
    let nextTab = activeTab;
    if ((user.role === 'teacher' || user.role === 'ta') && (activeTab === 'workspace' || activeTab === 'my-grades')) {
      nextTab = 'gradebook';
      setActiveTab('gradebook');
    } else if (user.role === 'student' && (activeTab === 'gradebook' || activeTab === 'curriculum')) {
      nextTab = 'workspace';
      setActiveTab('workspace');
    }
    // Reload courses according to new user role
    const result = await fetchCoursesAndData();
    if (result.courseId && result.cohortId) {
      navigateToView(result.courseId, result.cohortId, nextTab);
    }
  };

  // Create Master Course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourseError('');
    setIsSubmittingCourse(true);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCourseCode,
          title: newCourseTitle,
          description: newCourseDesc,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCourseError(data.error || 'Failed to create course');
        return;
      }
      setShowNewCourseModal(false);
      setNewCourseCode('');
      setNewCourseTitle('');
      setNewCourseDesc('');
      const result = await fetchCoursesAndData(data.id);
      if (result.courseId && result.cohortId) {
        navigateToView(result.courseId, result.cohortId, activeTab);
      }
    } catch (err: any) {
      setCourseError(err.message || 'Error creating course');
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  // Create Class for active course
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassError('');
    setIsSubmittingClass(true);
    try {
      const res = await fetch('/api/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourseId,
          code: newClassCode,
          name: newClassName,
          term: newClassTerm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setClassError(data.error || 'Failed to create class');
        return;
      }
      setShowNewClassModal(false);
      setNewClassCode('');
      setNewClassName('');
      const newCohortId = await fetchClassesForCourse(selectedCourseId, data.id);
      if (selectedCourseId && newCohortId) {
        navigateToView(selectedCourseId, newCohortId, activeTab);
      }
    } catch (err: any) {
      setClassError(err.message || 'Error creating class');
    } finally {
      setIsSubmittingClass(false);
    }
  };

  // Delete Master Course
  const handleDeleteCourse = async (course: Course) => {
    const ok = await confirm({
      title: `Delete Master Course ${course.code}?`,
      message: `Are you sure you want to permanently delete "${course.code} - ${course.title}"? This will delete all 16 syllabus modules, project assignments, and all attached class cohorts. This action cannot be undone.`,
      confirmText: 'Delete Course',
      confirmTestId: 'confirm-delete-course-btn',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/courses?id=${course.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        await alert({ title: 'Error', message: data.error || 'Failed to delete course' });
        return;
      }
      const result = await fetchCoursesAndData();
      if (result.courseId && result.cohortId) {
        navigateToView(result.courseId, result.cohortId, activeTab);
      }
    } catch (err: any) {
      await alert({ title: 'Error', message: err.message || 'Error deleting course' });
    }
  };

  // Delete Class Section
  const handleDeleteClass = async (cls: CohortClass) => {
    const ok = await confirm({
      title: `Delete Class Section ${cls.code}?`,
      message: `Are you sure you want to delete Class Section "${cls.code}" (${cls.name})? All student enrollments, submissions, and grades in this section will be permanently deleted.`,
      confirmText: 'Delete Class',
      confirmTestId: 'confirm-delete-class-btn',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/cohorts?id=${cls.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        await alert({ title: 'Error', message: data.error || 'Failed to delete class' });
        return;
      }
      const nextCohortId = await fetchClassesForCourse(selectedCourseId);
      if (selectedCourseId && nextCohortId) {
        navigateToView(selectedCourseId, nextCohortId, activeTab);
      }
    } catch (err: any) {
      await alert({ title: 'Error', message: err.message || 'Error deleting class' });
    }
  };

  if (!currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-canvas text-xs text-ink-secondary">
        Initializing Database Analytics Environment...
      </div>
    );
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedClass = classes.find((c) => c.id === cohortId) || classes[0];
  const isTeacherOrTa = currentUser.role === 'teacher' || currentUser.role === 'ta';

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-canvas font-sans">
      {/* 1. Slide Bar Navigation for Menu Items & Management */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentUser={currentUser}
        users={users}
        onSelectUser={handleSelectUser}
        courses={courses}
        selectedCourseId={selectedCourseId}
        onSelectCourse={handleSelectCourse}
        classes={classes}
        selectedCohortId={cohortId}
        onSelectClass={handleSelectClass}
        onOpenNewCourseModal={() => {
          setCourseError('');
          setShowNewCourseModal(true);
        }}
        onOpenNewClassModal={() => {
          setClassError('');
          setShowNewClassModal(true);
        }}
        onOpenCourseManagement={() => handleTabChange('courses')}
        onOpenClassManagement={() => handleTabChange('classes')}
        onOpenStudentManagement={() => handleTabChange('students')}
        onOpenMcpModal={() => setShowMcpModal(true)}
      />

      {/* 2. Main Content & Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Slim Context Header */}
        <header className="h-11 border-b border-border bg-surface px-3 flex items-center justify-between shrink-0 select-none">
          {/* Breadcrumb Context */}
          <div className="flex items-center space-x-2 text-xs overflow-hidden min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="open-sidebar-btn"
              className="p-1 hover:bg-subtle text-ink-secondary hover:text-ink rounded transition-colors mr-0.5 sm:mr-1 shrink-0 flex md:hidden"
              title="Toggle Navigation Slide Bar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1.5 font-medium text-ink truncate min-w-0">
              {selectedCourse && (
                <span className="truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[240px] md:max-w-none">
                  [{selectedCourse.code}] {selectedCourse.title}
                </span>
              )}
            </div>

            {selectedClass && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-ink-muted shrink-0 hidden sm:inline" />
                <span className="font-mono text-ink-secondary shrink-0 hidden sm:inline">
                  {selectedClass.code} ({selectedClass.term})
                </span>
              </>
            )}

            <ChevronRight className="w-3.5 h-3.5 text-ink-muted shrink-0" />
            <span className="capitalize font-semibold text-ink px-1.5 py-0.5 rounded bg-subtle text-[11px] shrink-0 border border-border">
              {activeTab === 'workspace'
                ? isTeacherOrTa
                  ? 'Workspace Preview'
                  : 'Project Workspace'
                : activeTab === 'gradebook'
                ? 'Cohort Gradebook'
                : activeTab === 'curriculum'
                ? 'Master Curriculum'
                : activeTab === 'courses'
                ? 'Master Course Management'
                : activeTab === 'classes'
                ? 'Class Sections Management'
                : activeTab === 'students'
                ? 'Student Roster Management'
                : 'My Grades'}
            </span>
          </div>

          {/* Quick Management Shortcuts */}
          {isTeacherOrTa && (
            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => handleTabChange('courses')}
                className={`px-2 py-1 text-[11px] rounded transition-colors flex items-center space-x-1 ${
                  activeTab === 'courses'
                    ? 'bg-subtle text-ink font-medium border border-border'
                    : 'text-ink-secondary hover:text-ink hover:bg-subtle'
                }`}
                title="Manage Master Courses"
              >
                <FolderKanban className="w-3 h-3" />
                <span className="hidden sm:inline">Courses</span>
              </button>

              <button
                onClick={() => handleTabChange('classes')}
                className={`px-2 py-1 text-[11px] rounded transition-colors flex items-center space-x-1 ${
                  activeTab === 'classes'
                    ? 'bg-subtle text-ink font-medium border border-border'
                    : 'text-ink-secondary hover:text-ink hover:bg-subtle'
                }`}
                title="Manage Class Sections"
              >
                <Layers className="w-3 h-3" />
                <span className="hidden sm:inline">Classes</span>
              </button>

              <button
                onClick={() => handleTabChange('students')}
                data-testid="header-manage-students-btn"
                className={`px-2 py-1 text-[11px] rounded transition-colors flex items-center space-x-1 ${
                  activeTab === 'students'
                    ? 'bg-subtle text-ink font-medium border border-border'
                    : 'text-ink-secondary hover:text-ink hover:bg-subtle'
                }`}
                title="Manage Student Rosters"
              >
                <Users className="w-3 h-3" />
                <span className="hidden sm:inline">Students</span>
              </button>

              <button
                onClick={() => setShowMcpModal(true)}
                data-testid="header-open-mcp-btn"
                className="px-2 py-1 text-[11px] rounded transition-colors flex items-center space-x-1 text-amber-800 hover:bg-amber-50 border border-amber-200"
                title="AI & MCP Connection with Key"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span className="hidden sm:inline">AI / MCP</span>
              </button>
            </div>
          )}
        </header>

        {/* View Content Area */}
        <main className="flex-1 w-full overflow-hidden">
          {activeTab === 'courses' && (
            <CourseManagementView
              courses={courses}
              selectedCourseId={selectedCourseId}
              onSelectCourse={handleSelectCourse}
              onOpenCreateCourse={() => {
                setCourseError('');
                setShowNewCourseModal(true);
              }}
              onOpenCreateClass={() => {
                setClassError('');
                setShowNewClassModal(true);
              }}
              onDeleteCourse={handleDeleteCourse}
              onOpenMcpModal={() => setShowMcpModal(true)}
              onClose={() => handleTabChange(isTeacherOrTa ? 'gradebook' : 'workspace')}
            />
          )}

          {activeTab === 'classes' && (
            <ClassManagementView
              classes={classes}
              selectedCohortId={cohortId}
              courseTitle={selectedCourse?.title}
              onSelectClass={handleSelectClass}
              onOpenCreateClass={() => {
                setClassError('');
                setShowNewClassModal(true);
              }}
              onOpenStudentManagement={(cId) => {
                if (cId) handleSelectClass(cId);
                handleTabChange('students');
              }}
              onDeleteClass={handleDeleteClass}
              onClose={() => handleTabChange(isTeacherOrTa ? 'gradebook' : 'workspace')}
            />
          )}

          {activeTab === 'students' && (
            <StudentManagementView
              classes={classes}
              selectedCohortId={cohortId}
              onSelectClass={handleSelectClass}
              onStudentsChanged={() => {
                if (selectedCourseId) {
                  fetchClassesForCourse(selectedCourseId, cohortId);
                }
              }}
              onClose={() => handleTabChange(isTeacherOrTa ? 'gradebook' : 'workspace')}
            />
          )}

          {cohortId ? (
            <>
              {activeTab === 'workspace' && (
                <StudentWorkspace
                  currentUser={currentUser}
                  cohortId={cohortId}
                  courseId={selectedCourseId}
                />
              )}
              {activeTab === 'my-grades' && (
                <StudentGradesView currentUser={currentUser} cohortId={cohortId} />
              )}
              {activeTab === 'gradebook' && (
                <GradebookMatrix
                  cohortId={cohortId}
                  onCohortStatusChange={() => {
                    if (selectedCourseId) fetchClassesForCourse(selectedCourseId, cohortId);
                  }}
                />
              )}
              {activeTab === 'curriculum' && (
                <CurriculumView
                  cohortId={cohortId}
                  courseId={selectedCourseId}
                  classes={classes}
                />
              )}
            </>
          ) : (
            activeTab !== 'courses' &&
            activeTab !== 'classes' &&
            activeTab !== 'students' && (
              <div className="h-full flex flex-col items-center justify-center space-y-3 p-6 text-center">
                <BookOpen className="w-8 h-8 text-ink-secondary" />
                <div className="text-sm font-semibold text-ink">
                  {courses.length === 0 ? 'No Master Courses Available' : 'No Classes in this Course'}
                </div>
                <p className="text-xs text-ink-secondary max-w-sm">
                  {isTeacherOrTa
                    ? 'Create a new course or add a semester class section to begin authoring and grading.'
                    : 'You are not currently enrolled in any active classes for this course.'}
                </p>
                {isTeacherOrTa && (
                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={() => setShowNewCourseModal(true)}
                      className="px-3 py-1.5 text-xs bg-ink text-white rounded hover:bg-ink-secondary transition-colors flex items-center space-x-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Course</span>
                    </button>
                    {selectedCourseId && (
                      <button
                        onClick={() => setShowNewClassModal(true)}
                        className="px-3 py-1.5 text-xs border border-border bg-subtle text-ink rounded hover:bg-active transition-colors flex items-center space-x-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Add Class</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </main>
      </div>

      {/* 4. Modal: Create Master Course */}
      {showNewCourseModal && (
        <div
          data-testid="create-course-modal"
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        >
          <div className="bg-surface border border-border rounded shadow-xl max-w-md w-full p-5 space-y-4 font-sans animate-in fade-in duration-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-ink" />
                <h3 className="text-sm font-semibold text-ink">Create Master Course</h3>
              </div>
              <button
                onClick={() => setShowNewCourseModal(false)}
                className="text-ink-secondary hover:text-ink p-1 rounded hover:bg-subtle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {courseError && (
              <div className="p-2 bg-red-50 border border-red-200 text-status-danger text-xs rounded">
                {courseError}
              </div>
            )}

            <form onSubmit={handleCreateCourse} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Course Code</label>
                <input
                  type="text"
                  required
                  data-testid="course-code-input"
                  placeholder="e.g. BA-401"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-border rounded text-xs font-mono text-ink focus:outline-none focus:border-border-strong uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  data-testid="course-title-input"
                  placeholder="e.g. Big Data Engineering & Lakehouses"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  data-testid="course-desc-input"
                  placeholder="Overview of curriculum and business objectives..."
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowNewCourseModal(false)}
                  className="px-3 py-1.5 text-xs text-ink-secondary hover:text-ink rounded hover:bg-subtle transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCourse}
                  data-testid="submit-course-btn"
                  className="px-3 py-1.5 text-xs bg-ink text-white rounded hover:bg-ink-secondary transition-colors disabled:opacity-50"
                >
                  {isSubmittingCourse ? 'Creating...' : 'Create Master Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Create Class / Semester Section */}
      {showNewClassModal && (
        <div
          data-testid="create-class-modal"
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        >
          <div className="bg-surface border border-border rounded shadow-xl max-w-md w-full p-5 space-y-4 font-sans animate-in fade-in duration-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-ink" />
                <h3 className="text-sm font-semibold text-ink">
                  Add Class for {selectedCourse ? `[${selectedCourse.code}] ${selectedCourse.title}` : 'Course'}
                </h3>
              </div>
              <button
                onClick={() => setShowNewClassModal(false)}
                className="text-ink-secondary hover:text-ink p-1 rounded hover:bg-subtle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {classError && (
              <div className="p-2 bg-red-50 border border-red-200 text-status-danger text-xs rounded">
                {classError}
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Academic Semester / Term</label>
                <select
                  data-testid="class-term-input"
                  value={newClassTerm}
                  onChange={(e) => setNewClassTerm(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-border rounded text-xs font-mono text-ink focus:outline-none focus:border-border-strong cursor-pointer"
                >
                  <option value="Fall 2026">Fall 2026</option>
                  <option value="Spring 2027">Spring 2027</option>
                  <option value="Summer 2027">Summer 2027</option>
                  <option value="Fall 2027">Fall 2027</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Class Section Code</label>
                <input
                  type="text"
                  required
                  data-testid="class-code-input"
                  placeholder="e.g. BA-2027-SPRING-B"
                  value={newClassCode}
                  onChange={(e) => setNewClassCode(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-border rounded text-xs font-mono text-ink focus:outline-none focus:border-border-strong uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Class Section Name</label>
                <input
                  type="text"
                  required
                  data-testid="class-name-input"
                  placeholder="e.g. Spring 2027 Cohort - Section B"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowNewClassModal(false)}
                  className="px-3 py-1.5 text-xs text-ink-secondary hover:text-ink rounded hover:bg-subtle transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClass}
                  data-testid="submit-class-btn"
                  className="px-3 py-1.5 text-xs bg-ink text-white rounded hover:bg-ink-secondary transition-colors disabled:opacity-50"
                >
                  {isSubmittingClass ? 'Creating...' : 'Add Class Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: AI & MCP Connection with Key */}
      <McpConnectionModal
        isOpen={showMcpModal}
        onClose={() => setShowMcpModal(false)}
      />
    </div>
  );
}
