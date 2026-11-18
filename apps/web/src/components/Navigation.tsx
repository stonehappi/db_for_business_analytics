'use client';

import React from 'react';
import { Database, User, ShieldCheck, GraduationCap, BookOpen, TableProperties, Award, LogOut } from 'lucide-react';

export interface UserProfile {
  id: string;
  student_id_code: string | null;
  email: string;
  full_name: string;
  role: 'teacher' | 'ta' | 'student';
}

interface NavigationProps {
  activeTab: 'workspace' | 'gradebook' | 'curriculum' | 'my-grades';
  setActiveTab: (tab: 'workspace' | 'gradebook' | 'curriculum' | 'my-grades') => void;
  currentUser: UserProfile;
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  cohortCode: string;
  cohortStatus: string;
}

export default function Navigation({
  activeTab,
  setActiveTab,
  currentUser,
  users,
  onSelectUser,
  cohortCode,
  cohortStatus,
}: NavigationProps) {
  const isTeacherOrTa = currentUser.role === 'teacher' || currentUser.role === 'ta';
  const isStudent = currentUser.role === 'student';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <header className="h-12 border-b border-border bg-surface px-4 flex items-center justify-between select-none shrink-0">
      {/* Brand & Cohort Badge */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-ink" />
          <span className="font-semibold text-xs tracking-tight text-ink">
            DB Analytics
          </span>
          <span className="text-[11px] text-ink-secondary">/ Business Analytics LMS</span>
        </div>

        <div className="h-4 w-[1px] bg-border mx-1" />

        {/* Cohort Code & Status */}
        <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-subtle rounded text-[11px] font-mono border border-border">
          <span className="text-ink font-medium">{cohortCode}</span>
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
          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-medium border ${
            isTeacherOrTa
              ? 'bg-zinc-900 text-white border-zinc-900'
              : 'bg-zinc-100 text-zinc-800 border-border'
          }`}
        >
          {currentUser.role} Mode
        </span>
      </div>

      {/* Role-Specific Navigation Tabs */}
      <nav className="flex items-center space-x-1">
        {/* STUDENT VIEW TABS */}
        {isStudent && (
          <>
            <button
              onClick={() => setActiveTab('workspace')}
              data-testid="tab-workspace"
              className={`px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1.5 ${
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
              className={`px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1.5 ${
                activeTab === 'my-grades'
                  ? 'bg-subtle text-ink font-medium border border-border'
                  : 'text-ink-secondary hover:text-ink hover:bg-subtle/50'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>My Grades & Feedback</span>
            </button>
          </>
        )}

        {/* TEACHER & TA VIEW TABS */}
        {isTeacherOrTa && (
          <>
            <button
              onClick={() => setActiveTab('gradebook')}
              data-testid="tab-gradebook"
              className={`px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1.5 ${
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
              className={`px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1.5 ${
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
              className={`px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1.5 ${
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

      {/* Role / User Switcher */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1.5 text-xs">
          {currentUser.role === 'teacher' && (
            <ShieldCheck className="w-3.5 h-3.5 text-ink" />
          )}
          {currentUser.role === 'ta' && (
            <User className="w-3.5 h-3.5 text-ink-secondary" />
          )}
          {currentUser.role === 'student' && (
            <GraduationCap className="w-3.5 h-3.5 text-ink-secondary" />
          )}
          <select
            data-testid="user-switcher"
            value={currentUser.id}
            onChange={(e) => {
              const selected = users.find((u) => u.id === e.target.value);
              if (selected) onSelectUser(selected);
            }}
            className="text-xs bg-subtle border border-border rounded px-2 py-1 text-ink focus:outline-none focus:border-border-strong cursor-pointer font-sans"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.role.toUpperCase()}
                {u.student_id_code ? ` - ${u.student_id_code}` : ''})
              </option>
            ))}
          </select>

          <button
            onClick={handleLogout}
            data-testid="logout-btn"
            title="Sign Out of Session"
            className="px-2 py-1 text-xs border border-border bg-subtle hover:bg-active text-ink rounded transition-colors flex items-center space-x-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
