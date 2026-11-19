'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Check,
  Search,
  Users,
  Lock,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  X,
} from 'lucide-react';
import { CohortClass } from './Navigation';

interface ClassManagementViewProps {
  classes: CohortClass[];
  selectedCohortId: string;
  onSelectClass: (cohortId: string) => void;
  onOpenCreateClass: () => void;
  onOpenStudentManagement?: (cohortId?: string) => void;
  courseTitle?: string;
  onClose?: () => void;
}

export default function ClassManagementView({
  classes,
  selectedCohortId,
  onSelectClass,
  onOpenCreateClass,
  onOpenStudentManagement,
  courseTitle,
  onClose,
}: ClassManagementViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClasses = classes.filter((cls) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cls.code.toLowerCase().includes(q) ||
      cls.name.toLowerCase().includes(q) ||
      cls.term.toLowerCase().includes(q)
    );
  });

  const totalStudents = classes.reduce((acc, c) => acc + (c.student_count || 0), 0);
  const activeCount = classes.filter((c) => c.status !== 'completed').length;
  const completedCount = classes.filter((c) => c.status === 'completed').length;

  return (
    <div
      data-testid="class-management-modal"
      className="h-[calc(100vh-2.75rem)] overflow-y-auto bg-canvas font-sans select-none"
    >
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Header Banner */}
        <div className="bg-surface border border-border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-semibold text-ink">Class Sections & Semesters Management</h1>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-subtle text-ink-secondary border border-border">
                  Full Page
                </span>
              </div>
              <p className="text-xs text-ink-secondary mt-0.5">
                {courseTitle ? `Course: ${courseTitle} • ` : ''}Manage student rosters, semester terms, and grading lock status.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenCreateClass}
              data-testid="modal-create-class-btn"
              className="px-3 py-1.5 text-xs bg-ink text-white rounded hover:bg-ink-secondary transition-colors flex items-center space-x-1.5 font-medium shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Class Section</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                title="Close"
                className="p-1.5 text-ink-secondary hover:text-ink rounded hover:bg-subtle transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface border border-border rounded-lg p-3.5 space-y-1">
            <span className="text-[11px] text-ink-secondary font-medium uppercase tracking-wider block">
              Total Sections
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-ink">{classes.length}</span>
              <span className="text-[11px] text-ink-secondary">cohorts</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3.5 space-y-1">
            <span className="text-[11px] text-ink-secondary font-medium uppercase tracking-wider block">
              Active Classes
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-status-success">{activeCount}</span>
              <span className="text-[11px] text-ink-secondary">open for submissions</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3.5 space-y-1">
            <span className="text-[11px] text-ink-secondary font-medium uppercase tracking-wider block">
              Completed Classes
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-status-danger">{completedCount}</span>
              <span className="text-[11px] text-ink-secondary">locked & finalized</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3.5 space-y-1">
            <span className="text-[11px] text-ink-secondary font-medium uppercase tracking-wider block">
              Enrolled Students
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-ink">{totalStudents}</span>
              <span className="text-[11px] text-ink-secondary">across sections</span>
            </div>
          </div>
        </div>

        {/* Classes Table Container */}
        <div className="bg-surface border border-border rounded-lg shadow-2xs overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-3.5 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-subtle/30">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-ink-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search classes by code, name, semester..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong font-sans"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs text-ink-secondary">
              <span className="font-mono">{filteredClasses.length} of {classes.length} classes</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-subtle text-ink-secondary font-medium border-b border-border">
                  <th className="py-2.5 px-4 font-mono w-36">Section Code</th>
                  <th className="py-2.5 px-4">Class Section Name</th>
                  <th className="py-2.5 px-4 font-mono w-32">Semester / Term</th>
                  <th className="py-2.5 px-4 text-center w-28">Status</th>
                  <th className="py-2.5 px-4 text-center font-mono w-24">Students</th>
                  <th className="py-2.5 px-4 text-right w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {filteredClasses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-ink-secondary">
                      {classes.length === 0
                        ? 'No class sections added to this course yet. Click "Add Class Section" to start.'
                        : 'No class sections found matching your search.'}
                    </td>
                  </tr>
                ) : (
                  filteredClasses.map((cls) => {
                    const isSelected = cls.id === selectedCohortId;
                    const isCompleted = cls.status === 'completed';
                    return (
                      <tr
                        key={cls.id}
                        className={`hover:bg-subtle/50 transition-colors ${
                          isSelected ? 'bg-zinc-50' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-ink">
                          {cls.code}
                        </td>
                        <td className="py-3 px-4 font-medium text-ink">
                          <div className="flex items-center space-x-2">
                            <span>{cls.name}</span>
                            {isSelected && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-green-50 text-status-success border border-green-200">
                                Current
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-ink-secondary">
                          {cls.term}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded border ${
                              isCompleted
                                ? 'bg-red-50 text-status-danger border-red-200'
                                : 'bg-green-50 text-status-success border-green-200'
                            }`}
                          >
                            {isCompleted ? (
                              <Lock className="w-2.5 h-2.5" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                            )}
                            <span className="capitalize">{cls.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-ink">
                          {cls.student_count ?? 0}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          {onOpenStudentManagement && (
                            <button
                              onClick={() => onOpenStudentManagement(cls.id)}
                              data-testid={`modal-manage-class-students-${cls.id}`}
                              title="Manage Student Roster"
                              className="px-2.5 py-1 text-xs border border-border bg-white hover:bg-subtle text-ink rounded transition-colors inline-flex items-center space-x-1 font-medium"
                            >
                              <Users className="w-3 h-3" />
                              <span>Roster</span>
                            </button>
                          )}
                          {isSelected ? (
                            <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-status-success px-2.5 py-1 rounded bg-green-50 border border-green-200">
                              <Check className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => onSelectClass(cls.id)}
                              className="px-2.5 py-1 text-xs border border-border bg-white hover:bg-subtle text-ink rounded transition-colors font-medium"
                            >
                              Select
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border flex items-center justify-between text-xs text-ink-secondary bg-subtle/20">
            <span>{classes.length} total Class Sections</span>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1 text-xs border border-border bg-white hover:bg-subtle text-ink rounded transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
