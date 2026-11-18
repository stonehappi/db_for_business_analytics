'use client';

import React, { useState, useEffect } from 'react';
import Navigation, { UserProfile, Course, CohortClass } from '@/components/Navigation';
import StudentWorkspace from '@/components/StudentWorkspace';
import StudentGradesView from '@/components/StudentGradesView';
import GradebookMatrix from '@/components/GradebookMatrix';
import CurriculumView from '@/components/CurriculumView';
import { BookOpen, Calendar, X, Plus } from 'lucide-react';

export default function Home() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'workspace' | 'gradebook' | 'curriculum' | 'my-grades'>('workspace');

  // Courses and Classes
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [classes, setClasses] = useState<CohortClass[]>([]);
  const [cohortId, setCohortId] = useState<string>('');

  // Course Modal state
  const [showNewCourseModal, setShowNewCourseModal] = useState<boolean>(false);
  const [newCourseCode, setNewCourseCode] = useState<string>('');
  const [newCourseTitle, setNewCourseTitle] = useState<string>('');
  const [newCourseDesc, setNewCourseDesc] = useState<string>('');
  const [courseError, setCourseError] = useState<string>('');
  const [isSubmittingCourse, setIsSubmittingCourse] = useState<boolean>(false);

  // Class Modal state
  const [showNewClassModal, setShowNewClassModal] = useState<boolean>(false);
  const [newClassCode, setNewClassCode] = useState<string>('');
  const [newClassName, setNewClassName] = useState<string>('');
  const [newClassTerm, setNewClassTerm] = useState<string>('Fall 2026');
  const [classError, setClassError] = useState<string>('');
  const [isSubmittingClass, setIsSubmittingClass] = useState<boolean>(false);

  const fetchClassesForCourse = async (courseId: string, preferredCohortId?: string) => {
    try {
      const res = await fetch(`/api/cohorts?courseId=${courseId}`);
      const data: CohortClass[] = await res.json();
      setClasses(data);
      if (data.length > 0) {
        const match = preferredCohortId && data.find((c) => c.id === preferredCohortId);
        setCohortId(match ? match.id : data[0].id);
      } else {
        setCohortId('');
      }
    } catch (err) {
      console.error('Error fetching cohorts for course:', err);
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
        await fetchClassesForCourse(activeCourse.id, preferredCohortId);
      } else {
        setSelectedCourseId('');
        setClasses([]);
        setCohortId('');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
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
        if (data.user.role === 'teacher' || data.user.role === 'ta') {
          setActiveTab('gradebook');
        } else {
          setActiveTab('workspace');
        }
      })
      .catch(() => {
        window.location.href = '/login';
      });

    // 2. Fetch users for testing switcher
    fetch('/api/users')
      .then((res) => res.json())
      .then((data: UserProfile[]) => {
        setUsers(data);
      })
      .catch((err) => console.error('Error fetching users:', err));

    // 3. Fetch courses and initial class
    fetchCoursesAndData();
  }, []);

  // When user switches course from navigation
  const handleSelectCourse = async (cId: string) => {
    setSelectedCourseId(cId);
    await fetchClassesForCourse(cId);
  };

  // When user switches class/cohort from navigation
  const handleSelectClass = (cId: string) => {
    setCohortId(cId);
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
    if ((user.role === 'teacher' || user.role === 'ta') && (activeTab === 'workspace' || activeTab === 'my-grades')) {
      setActiveTab('gradebook');
    } else if (user.role === 'student' && (activeTab === 'gradebook' || activeTab === 'curriculum')) {
      setActiveTab('workspace');
    }
    // Reload courses according to new user role
    await fetchCoursesAndData();
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
      await fetchCoursesAndData(data.id);
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
      await fetchClassesForCourse(selectedCourseId, data.id);
    } catch (err: any) {
      setClassError(err.message || 'Error creating class');
    } finally {
      setIsSubmittingClass(false);
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

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-canvas">
      {/* Top Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
      />

      {/* Main Workspace Area */}
      <main className="flex-1 w-full overflow-hidden">
        {cohortId ? (
          <>
            {activeTab === 'workspace' && (
              <StudentWorkspace currentUser={currentUser} cohortId={cohortId} />
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
          <div className="h-full flex flex-col items-center justify-center space-y-3 p-6 text-center">
            <BookOpen className="w-8 h-8 text-ink-secondary" />
            <div className="text-sm font-semibold text-ink">
              {courses.length === 0 ? 'No Master Courses Available' : 'No Classes in this Course'}
            </div>
            <p className="text-xs text-ink-secondary max-w-sm">
              {currentUser.role === 'teacher' || currentUser.role === 'ta'
                ? 'Create a new course or add a semester class section to begin authoring and grading.'
                : 'You are not currently enrolled in any active classes for this course.'}
            </p>
            {(currentUser.role === 'teacher' || currentUser.role === 'ta') && (
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
        )}
      </main>

      {/* Modal: Create Master Course */}
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

      {/* Modal: Create Class / Semester Section */}
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
    </div>
  );
}
