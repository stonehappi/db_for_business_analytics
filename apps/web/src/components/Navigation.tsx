'use client';

import React from 'react';
import {
  Database,
  User,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  TableProperties,
  Award,
  LogOut,
  Calendar,
  Plus,
} from 'lucide-react';

export interface UserProfile {
  id: string;
  student_id_code: string | null;
  email: string;
  full_name: string;
  role: 'teacher' | 'ta' | 'student';
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  teacher_id: string;
  class_count?: number;
  module_count?: number;
  student_count?: number;
}

export interface CohortClass {
  id: string;
  course_id: string;
  code: string;
  name: string;
  term: string;
  status: string;
  course_code?: string;
  course_title?: string;
  student_count?: number;
  assignment_count?: number;
}

interface NavigationProps {
  activeTab: 'workspace' | 'gradebook' | 'curriculum' | 'my-grades';
  setActiveTab: (tab: 'workspace' | 'gradebook' | 'curriculum' | 'my-grades') => void;
  currentUser: UserProfile;
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  courses: Course[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
  classes: CohortClass[];
  selectedCohortId: string;
  onSelectClass: (cohortId: string) => void;
  onOpenNewCourseModal: () => void;
  onOpenNewClassModal: () => void;
}

export default function Navigation({
  activeTab,
  setActiveTab,
  currentUser,
  users,
  onSelectUser,
  courses,
  selectedCourseId,
  onSelectCourse,
  classes,
  selectedCohortId,
  onSelectClass,
  onOpenNewCourseModal,
  onOpenNewClassModal,
}: NavigationProps) {
  const isTeacherOrTa = currentUser.role === 'teacher' || currentUser.role === 'ta';
  const isStudent = currentUser.role === 'student';

  const selectedClass = classes.find((c) => c.id === selectedCohortId) || classes[0];
  const cohortStatus = selectedClass?.status || 'active';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <header className="min-h-12 border-b border-border bg-surface px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 select-none shrink-0">
      {/* Left: Brand, Course & Class Selectors */}
      <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
        <div className="flex items-center space-x-1.5 shrink-0">
          <Database className="w-4 h-4 text-ink" />
          <span className="font-semibold text-xs tracking-tight text-ink">
            DB Analytics
          </span>
        </div>

        <div className="h-4 w-[1px] bg-border mx-0.5 hidden sm:block" />

        {/* Master Course Selector */}
        <div className="flex items-center space-x-1 bg-subtle border border-border rounded px-1.5 py-0.5">
          <BookOpen className="w-3.5 h-3.5 text-ink-secondary shrink-0" />
          <select
            data-testid="course-selector"
            value={selectedCourseId}
            onChange={(e) => onSelectCourse(e.target.value)}
            className="text-xs bg-transparent text-ink font-medium focus:outline-none cursor-pointer max-w-[180px] truncate"
            title="Select Master Course"
          >
            {courses.length === 0 ? (
              <option value="">No Courses</option>
            ) : (
              courses.map((course) => (
                <option key={course.id} value={course.id}>
                  [{course.code}] {course.title}
                </option>
              ))
            )}
          </select>
          {isTeacherOrTa && (
            <button
              onClick={onOpenNewCourseModal}
              data-testid="new-course-btn"
              title="Create New Master Course"
              className="p-0.5 hover:bg-surface rounded text-ink-secondary hover:text-ink transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Class / Semester Selector */}
        <div className="flex items-center space-x-1 bg-subtle border border-border rounded px-1.5 py-0.5">
          <Calendar className="w-3.5 h-3.5 text-ink-secondary shrink-0" />
          <select
            data-testid="class-selector"
            value={selectedCohortId}
            onChange={(e) => onSelectClass(e.target.value)}
            className="text-xs bg-transparent text-ink font-mono focus:outline-none cursor-pointer max-w-[210px] truncate"
            title="Select Class / Semester Cohort"
          >
            {classes.length === 0 ? (
              <option value="">No Classes in Course</option>
            ) : (
              classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.code} ({cls.term})
                </option>
              ))
            )}
          </select>
          {isTeacherOrTa && (
            <button
              onClick={onOpenNewClassModal}
              data-testid="new-class-btn"
              title="Add Class / Semester for this Course"
              className="p-0.5 hover:bg-surface rounded text-ink-secondary hover:text-ink transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Cohort Status Indicator */}
        <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-subtle rounded text-[11px] font-mono border border-border">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              cohortStatus === 'completed' ? 'bg-status-danger' : 'bg-status-success'
            }`}
          />
          <span className="text-ink-secondary capitalize">{cohortStatus}</span>
        </div>

        {/* Role badge */}
        <span
          data-testid="role-mode-badge"
          className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-medium border ${
            isTeacherOrTa
              ? 'bg-zinc-900 text-white border-zinc-900'
              : 'bg-zinc-100 text-zinc-800 border-border'
          }`}
        >
          {currentUser.role} Mode
        </span>
      </div>

      {/* Center: Navigation Tabs */}
      <nav className="flex items-center space-x-1">
        {/* STUDENT TABS */}
        {isStudent && (
          <>
            <button
              onClick={() => setActiveTab('workspace')}
              data-testid="tab-workspace"
              className={`px-2.5 py-1 text-xs rounded transition-colors flex items-center space-x-1.5 ${
                activeTab === 'workspace'
                  ? 'bg-subtle text-ink font-medium border border-border'
                  : 'text-ink-secondary hover:text-ink hover:bg-subtle/50'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Project Workspace</span>
            </button>

            <button
              onClick={() => setActiveTab('my-grades')}
              data-testid="tab-my-grades"
              className={`px-2.5 py-1 text-xs rounded transition-colors flex items-center space-x-1.5 ${
                activeTab === 'my-grades'
                  ? 'bg-subtle text-ink font-medium border border-border'
                  : 'text-ink-secondary hover:text-ink hover:bg-subtle/50'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>My Grades</span>
            </button>
          </>
        )}

        {/* TEACHER & TA TABS */}
        {isTeacherOrTa && (
          <>
            <button
              onClick={() => setActiveTab('gradebook')}
              data-testid="tab-gradebook"
              className={`px-2.5 py-1 text-xs rounded transition-colors flex items-center space-x-1.5 ${
                activeTab === 'gradebook'
                  ? 'bg-subtle text-ink font-medium border border-border'
                  : 'text-ink-secondary hover:text-ink hover:bg-subtle/50'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>Cohort Gradebook</span>
            </button>

            <button
              onClick={() => setActiveTab('curriculum')}
              data-testid="tab-curriculum"
              className={`px-2.5 py-1 text-xs rounded transition-colors flex items-center space-x-1.5 ${
                activeTab === 'curriculum'
                  ? 'bg-subtle text-ink font-medium border border-border'
                  : 'text-ink-secondary hover:text-ink hover:bg-subtle/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Master Curriculum</span>
            </button>

            <button
              onClick={() => setActiveTab('workspace')}
              data-testid="tab-workspace"
              className={`px-2.5 py-1 text-xs rounded transition-colors flex items-center space-x-1.5 ${
                activeTab === 'workspace'
                  ? 'bg-subtle text-ink font-medium border border-border'
                  : 'text-ink-secondary hover:text-ink hover:bg-subtle/50'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Workspace Preview</span>
            </button>
          </>
        )}
      </nav>

      {/* Right: Role / User Switcher & Logout */}
      <div className="flex items-center space-x-1.5 text-xs">
        {currentUser.role === 'teacher' && (
          <ShieldCheck className="w-3.5 h-3.5 text-ink shrink-0" />
        )}
        {currentUser.role === 'ta' && (
          <User className="w-3.5 h-3.5 text-ink-secondary shrink-0" />
        )}
        {currentUser.role === 'student' && (
          <GraduationCap className="w-3.5 h-3.5 text-ink-secondary shrink-0" />
        )}
        <select
          data-testid="user-switcher"
          value={currentUser.id}
          onChange={(e) => {
            const selected = users.find((u) => u.id === e.target.value);
            if (selected) onSelectUser(selected);
          }}
          className="text-xs bg-subtle border border-border rounded px-2 py-1 text-ink focus:outline-none focus:border-border-strong cursor-pointer font-sans max-w-[150px] truncate"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name} ({u.role.toUpperCase()})
            </option>
          ))}
        </select>

        <button
          onClick={handleLogout}
          data-testid="logout-btn"
          title="Sign Out of Session"
          className="px-2 py-1 text-xs border border-border bg-subtle hover:bg-active text-ink rounded transition-colors flex items-center space-x-1 shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
