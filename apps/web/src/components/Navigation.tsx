'use client';

import React from 'react';
import { Database, User, ShieldCheck, GraduationCap, BookOpen, TableProperties } from 'lucide-react';

export interface UserProfile {
  id: string;
  student_id_code: string | null;
  email: string;
  full_name: string;
  role: 'teacher' | 'ta' | 'student';
}

interface NavigationProps {
  activeTab: 'workspace' | 'gradebook' | 'curriculum';
  setActiveTab: (tab: 'workspace' | 'gradebook' | 'curriculum') => void;
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
  return (
    <header className="h-12 border-b border-border bg-surface px-4 flex items-center justify-between select-none">
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

        <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-subtle rounded text-[11px] font-mono border border-border">
          <span className="text-ink font-medium">{cohortCode}</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              cohortStatus === 'completed' ? 'bg-status-danger' : 'bg-status-success'
            }`}
          />
          <span className="text-ink-secondary capitalize">{cohortStatus}</span>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="flex items-center space-x-1">
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
          <span>Student Workspace</span>
        </button>

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
      </nav>

      {/* Role Switcher */}
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
        </div>
      </div>
    </header>
  );
}
