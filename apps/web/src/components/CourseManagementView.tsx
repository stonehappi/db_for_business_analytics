'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Check,
  Search,
  Layers,
  Users,
  Calendar,
  ArrowRight,
  GraduationCap,
  Sparkles,
  X,
  Trash2,
  Key,
} from 'lucide-react';
import { Course } from './Navigation';

interface CourseManagementViewProps {
  courses: Course[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
  onOpenCreateCourse: () => void;
  onOpenCreateClass?: () => void;
  onDeleteCourse?: (course: Course) => void;
  onOpenMcpModal?: () => void;
  onClose?: () => void;
}

export default function CourseManagementView({
  courses,
  selectedCourseId,
  onSelectCourse,
  onOpenCreateCourse,
  onOpenCreateClass,
  onDeleteCourse,
  onOpenMcpModal,
  onClose,
}: CourseManagementViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = courses.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  const totalClasses = courses.reduce((acc, c) => acc + (c.class_count || 0), 0);
  const totalStudents = courses.reduce((acc, c) => acc + (c.student_count || 0), 0);
  const totalModules = courses.reduce((acc, c) => acc + (c.module_count || 16), 0);

  return (
    <div
      data-testid="course-management-modal"
      className="h-[calc(100vh-2.75rem)] overflow-y-auto bg-canvas font-sans select-none"
    >
      <div className="w-full p-4 sm:p-6 space-y-5">
        {/* Header Banner */}
        <div className="bg-surface border border-border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-semibold text-ink">Master Course Management</h1>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-subtle text-ink-secondary border border-border">
                  Full Page
                </span>
              </div>
              <p className="text-xs text-ink-secondary mt-0.5">
                Author and organize master course curricula, 16-week syllabus modules, and semester sections.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenMcpModal && (
              <button
                onClick={onOpenMcpModal}
                data-testid="btn-open-mcp-modal"
                className="px-2.5 py-1.5 text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded transition-colors flex items-center space-x-1.5 font-medium shadow-2xs"
                title="Configure AI & MCP Connection with API Key"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>AI & MCP Key</span>
              </button>
            )}

            <button
              onClick={onOpenCreateCourse}
              data-testid="modal-create-course-btn"
              className="px-3 py-1.5 text-xs bg-ink text-white rounded hover:bg-ink-secondary transition-colors flex items-center space-x-1.5 font-medium shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Master Course</span>
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
              Master Courses
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-ink">{courses.length}</span>
              <span className="text-[11px] text-ink-secondary">curricula</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3.5 space-y-1">
            <span className="text-[11px] text-ink-secondary font-medium uppercase tracking-wider block">
              Active Classes
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-ink">{totalClasses}</span>
              <span className="text-[11px] text-ink-secondary">sections</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3.5 space-y-1">
            <span className="text-[11px] text-ink-secondary font-medium uppercase tracking-wider block">
              Total Students
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-ink">{totalStudents}</span>
              <span className="text-[11px] text-ink-secondary">enrolled</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3.5 space-y-1">
            <span className="text-[11px] text-ink-secondary font-medium uppercase tracking-wider block">
              Total Modules
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-ink">{totalModules}</span>
              <span className="text-[11px] text-ink-secondary">across courses</span>
            </div>
          </div>
        </div>

        {/* Courses Table Container */}
        <div className="bg-surface border border-border rounded-lg shadow-2xs overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-3.5 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-subtle/30">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-ink-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses by code, title, description..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong font-sans"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs text-ink-secondary">
              <span className="font-mono">{filteredCourses.length} of {courses.length} courses</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-subtle text-ink-secondary font-medium border-b border-border">
                  <th className="py-2.5 px-4 font-mono w-28">Code</th>
                  <th className="py-2.5 px-4">Master Course Title</th>
                  <th className="py-2.5 px-4 text-center font-mono w-24">Modules</th>
                  <th className="py-2.5 px-4 text-center font-mono w-24">Classes</th>
                  <th className="py-2.5 px-4 text-center font-mono w-24">Students</th>
                  <th className="py-2.5 px-4 text-right w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-ink-secondary">
                      {courses.length === 0
                        ? 'No Master Courses created yet. Click "New Master Course" to create your first curriculum.'
                        : 'No courses found matching your search.'}
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((c) => {
                    const isSelected = c.id === selectedCourseId;
                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-subtle/50 transition-colors ${
                          isSelected ? 'bg-zinc-50' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-ink">
                          {c.code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-ink flex items-center space-x-2">
                            <span>{c.title}</span>
                            {isSelected && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-green-50 text-status-success border border-green-200">
                                Current
                              </span>
                            )}
                          </div>
                          {c.description && (
                            <div className="text-[11px] text-ink-secondary line-clamp-1 mt-0.5">
                              {c.description}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-ink">
                          {c.module_count ?? 16}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-ink">
                          {c.class_count ?? 0}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-ink">
                          {c.student_count ?? 0}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {isSelected ? (
                            <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-status-success px-2 py-0.5 rounded bg-green-50 border border-green-200">
                              <Check className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => onSelectCourse(c.id)}
                              className="px-2 py-0.5 text-xs border border-border bg-white hover:bg-subtle text-ink rounded transition-colors font-medium"
                            >
                              Select
                            </button>
                          )}

                          {onDeleteCourse && (
                            <button
                              onClick={() => onDeleteCourse(c)}
                              title={`Delete Course ${c.code}`}
                              data-testid={`btn-delete-course-${c.id}`}
                              className="p-1 text-ink-secondary hover:text-red-600 hover:bg-red-50 rounded transition-colors inline-flex items-center"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
            <span>{courses.length} total Master Courses defined in platform</span>
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
