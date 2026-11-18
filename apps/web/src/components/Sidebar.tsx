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
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  FolderKanban,
  CheckCircle2,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { UserProfile, Course, CohortClass } from './Navigation';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
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
  onOpenCourseManagement: () => void;
  onOpenClassManagement: () => void;
}

export default function Sidebar({
  isOpen,
  onToggle,
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
  onOpenCourseManagement,
  onOpenClassManagement,
}: SidebarProps) {
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
    <aside
      data-testid="sidebar-navigation"
      className={`${
        isOpen ? 'w-64 min-w-[256px]' : 'w-16 min-w-[64px]'
      } h-screen bg-surface border-r border-border flex flex-col justify-between transition-all duration-200 ease-in-out select-none z-30 shrink-0 font-sans`}
    >
      {/* Top Header & Context */}
      <div className="flex flex-col">
        {/* Brand Bar */}
        <div className="h-12 border-b border-border px-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded bg-zinc-900 text-white flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            {isOpen && (
              <div className="flex flex-col leading-none overflow-hidden">
                <span className="font-semibold text-xs text-ink tracking-tight truncate">
                  DB Analytics
                </span>
                <span className="text-[10px] text-ink-secondary truncate mt-0.5">
                  Business LMS
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggle}
            data-testid="toggle-sidebar-btn"
            title={isOpen ? 'Collapse Navigation (Ctrl+B)' : 'Expand Navigation'}
            className="p-1 hover:bg-subtle text-ink-secondary hover:text-ink rounded transition-colors"
          >
            {isOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Active Master Course & Class Context */}
        {isOpen ? (
          <div className="p-3 border-b border-border bg-subtle/30 space-y-2.5">
            {/* Course Selector */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-ink-secondary">
                <span className="flex items-center space-x-1">
                  <BookOpen className="w-3 h-3" />
                  <span>Master Course</span>
                </span>
                {isTeacherOrTa && (
                  <button
                    onClick={onOpenNewCourseModal}
                    data-testid="new-course-btn"
                    title="Create New Master Course"
                    className="p-0.5 hover:bg-surface rounded text-ink-secondary hover:text-ink transition-colors flex items-center space-x-0.5 text-[10px]"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  data-testid="course-selector"
                  value={selectedCourseId}
                  onChange={(e) => onSelectCourse(e.target.value)}
                  className="w-full text-xs bg-white border border-border rounded px-2 py-1.5 text-ink font-medium focus:outline-none focus:border-border-strong cursor-pointer truncate pr-6"
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
              </div>
            </div>

            {/* Class / Semester Selector */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-ink-secondary">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Class Section</span>
                </span>
                {isTeacherOrTa && (
                  <button
                    onClick={onOpenNewClassModal}
                    data-testid="new-class-btn"
                    title="Add Class / Semester Section"
                    className="p-0.5 hover:bg-surface rounded text-ink-secondary hover:text-ink transition-colors flex items-center space-x-0.5 text-[10px]"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  data-testid="class-selector"
                  value={selectedCohortId}
                  onChange={(e) => onSelectClass(e.target.value)}
                  className="w-full text-xs bg-white border border-border rounded px-2 py-1.5 text-ink font-mono focus:outline-none focus:border-border-strong cursor-pointer truncate pr-6"
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
              </div>
            </div>

            {/* Status indicator badge */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-white rounded text-[11px] font-mono border border-border">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    cohortStatus === 'completed' ? 'bg-status-danger' : 'bg-status-success'
                  }`}
                />
                <span className="text-ink-secondary capitalize">{cohortStatus}</span>
              </div>

              <span
                data-testid="role-mode-badge"
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-medium border ${
                  isTeacherOrTa
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-zinc-100 text-zinc-800 border-border'
                }`}
              >
                {currentUser.role} Mode
              </span>
            </div>
          </div>
        ) : (
          /* Collapsed view context icons */
          <div className="py-2.5 flex flex-col items-center space-y-2 border-b border-border bg-subtle/30">
            <div
              title={`Course: ${courses.find((c) => c.id === selectedCourseId)?.code || 'None'}`}
              className="w-8 h-8 rounded border border-border bg-white flex items-center justify-center text-ink cursor-pointer hover:bg-subtle"
              onClick={onToggle}
            >
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div
              title={`Class: ${selectedClass?.code || 'None'} (${selectedClass?.term || ''})`}
              className="w-8 h-8 rounded border border-border bg-white flex items-center justify-center text-ink cursor-pointer hover:bg-subtle"
              onClick={onToggle}
            >
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span
              data-testid="role-mode-badge"
              className="text-[9px] font-mono uppercase px-1 py-0.5 rounded bg-zinc-900 text-white"
            >
              {currentUser.role.slice(0, 3)} Mode
            </span>
          </div>
        )}

        {/* Navigation Items Menu */}
        <nav className="p-2 space-y-4">
          {/* Group 1: Workspace & Views */}
          <div className="space-y-1">
            {isOpen && (
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-secondary">
                {isStudent ? 'Student Views' : 'Instructional Views'}
              </div>
            )}

            {/* Student Navigation Items */}
            {isStudent && (
              <>
                <button
                  onClick={() => setActiveTab('workspace')}
                  data-testid="tab-workspace"
                  title="Project Workspace"
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded transition-colors text-left ${
                    activeTab === 'workspace'
                      ? 'bg-subtle text-ink font-medium border border-border shadow-2xs'
                      : 'text-ink-secondary hover:text-ink hover:bg-subtle/50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  {isOpen && <span>Project Workspace</span>}
                </button>

                <button
                  onClick={() => setActiveTab('my-grades')}
                  data-testid="tab-my-grades"
                  title="My Grades & Feedback"
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded transition-colors text-left ${
                    activeTab === 'my-grades'
                      ? 'bg-subtle text-ink font-medium border border-border shadow-2xs'
                      : 'text-ink-secondary hover:text-ink hover:bg-subtle/50'
                  }`}
                >
                  <Award className="w-4 h-4 shrink-0" />
                  {isOpen && <span>My Grades & Feedback</span>}
                </button>
              </>
            )}

            {/* Teacher & TA Navigation Items */}
            {isTeacherOrTa && (
              <>
                <button
                  onClick={() => setActiveTab('gradebook')}
                  data-testid="tab-gradebook"
                  title="Cohort Gradebook"
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded transition-colors text-left ${
                    activeTab === 'gradebook'
                      ? 'bg-subtle text-ink font-medium border border-border shadow-2xs'
                      : 'text-ink-secondary hover:text-ink hover:bg-subtle/50'
                  }`}
                >
                  <TableProperties className="w-4 h-4 shrink-0" />
                  {isOpen && <span>Cohort Gradebook</span>}
                </button>

                <button
                  onClick={() => setActiveTab('curriculum')}
                  data-testid="tab-curriculum"
                  title="Master Curriculum"
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded transition-colors text-left ${
                    activeTab === 'curriculum'
                      ? 'bg-subtle text-ink font-medium border border-border shadow-2xs'
                      : 'text-ink-secondary hover:text-ink hover:bg-subtle/50'
                  }`}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  {isOpen && <span>Master Curriculum</span>}
                </button>

                <button
                  onClick={() => setActiveTab('workspace')}
                  data-testid="tab-workspace"
                  title="Student Workspace Preview"
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded transition-colors text-left ${
                    activeTab === 'workspace'
                      ? 'bg-subtle text-ink font-medium border border-border shadow-2xs'
                      : 'text-ink-secondary hover:text-ink hover:bg-subtle/50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  {isOpen && <span>Workspace Preview</span>}
                </button>
              </>
            )}
          </div>

          {/* Group 2: Academic Management (Teacher / TA Only) */}
          {isTeacherOrTa && (
            <div className="space-y-1">
              {isOpen && (
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-secondary">
                  Management
                </div>
              )}

              <button
                onClick={onOpenCourseManagement}
                data-testid="btn-manage-courses"
                title="Manage All Master Courses"
                className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded transition-colors text-left text-ink-secondary hover:text-ink hover:bg-subtle/50"
              >
                <FolderKanban className="w-4 h-4 shrink-0" />
                {isOpen && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>Manage Courses</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-subtle rounded border border-border">
                      {courses.length}
                    </span>
                  </div>
                )}
              </button>

              <button
                onClick={onOpenClassManagement}
                data-testid="btn-manage-classes"
                title="Manage All Semester Classes"
                className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded transition-colors text-left text-ink-secondary hover:text-ink hover:bg-subtle/50"
              >
                <Layers className="w-4 h-4 shrink-0" />
                {isOpen && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>Manage Classes</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-subtle rounded border border-border">
                      {classes.length}
                    </span>
                  </div>
                )}
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Bottom User Profile, Switcher & Logout */}
      <div className="p-2.5 border-t border-border bg-subtle/20 space-y-2">
        {isOpen ? (
          <>
            {/* User Info Card */}
            <div className="flex items-center space-x-2 px-1">
              <div className="w-7 h-7 rounded bg-zinc-200 text-ink flex items-center justify-center shrink-0 text-xs font-semibold">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="flex flex-col leading-tight min-w-0 flex-1">
                <span className="text-xs font-medium text-ink truncate">
                  {currentUser.full_name}
                </span>
                <span className="text-[10px] text-ink-secondary truncate">
                  {currentUser.student_id_code ? currentUser.student_id_code : currentUser.email}
                </span>
              </div>
            </div>

            {/* User Switcher Dropdown */}
            <div>
              <label className="block text-[10px] font-medium text-ink-secondary mb-1">
                Switch Active Persona:
              </label>
              <select
                data-testid="user-switcher"
                value={currentUser.id}
                onChange={(e) => {
                  const selected = users.find((u) => u.id === e.target.value);
                  if (selected) onSelectUser(selected);
                }}
                className="w-full text-xs bg-white border border-border rounded px-2 py-1 text-ink focus:outline-none focus:border-border-strong cursor-pointer font-sans truncate"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              data-testid="logout-btn"
              title="Sign Out of Session"
              className="w-full px-2 py-1.5 text-xs border border-border bg-white hover:bg-subtle text-ink rounded transition-colors flex items-center justify-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </>
        ) : (
          /* Collapsed View User Icon & Logout */
          <div className="flex flex-col items-center space-y-2">
            <div
              title={`${currentUser.full_name} (${currentUser.role})`}
              className="w-8 h-8 rounded bg-zinc-200 text-ink flex items-center justify-center text-xs font-semibold cursor-pointer"
              onClick={onToggle}
            >
              {currentUser.full_name.charAt(0)}
            </div>

            {/* Hidden user-switcher for test compatibility when collapsed */}
            <select
              data-testid="user-switcher"
              value={currentUser.id}
              onChange={(e) => {
                const selected = users.find((u) => u.id === e.target.value);
                if (selected) onSelectUser(selected);
              }}
              className="sr-only"
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
              title="Sign Out"
              className="p-1.5 hover:bg-subtle text-ink-secondary hover:text-ink rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
