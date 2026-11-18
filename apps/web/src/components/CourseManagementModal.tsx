'use client';

import React from 'react';
import { BookOpen, Plus, X, Check, Users, Layers, ExternalLink } from 'lucide-react';
import { Course } from './Navigation';

interface CourseManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
  onOpenCreateCourse: () => void;
  onOpenCreateClass: () => void;
}

export default function CourseManagementModal({
  isOpen,
  onClose,
  courses,
  selectedCourseId,
  onSelectCourse,
  onOpenCreateCourse,
  onOpenCreateClass,
}: CourseManagementModalProps) {
  if (!isOpen) return null;

  return (
    <div
      data-testid="course-management-modal"
      className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
    >
      <div className="bg-surface border border-border rounded shadow-xl max-w-3xl w-full p-5 space-y-4 font-sans animate-in fade-in duration-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-subtle border border-border flex items-center justify-center text-ink">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">Master Course Management</h3>
              <p className="text-xs text-ink-secondary">
                Author and organize master course curricula, syllabus modules, and semester sections.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onOpenCreateCourse();
              }}
              data-testid="modal-create-course-btn"
              className="px-2.5 py-1.5 text-xs bg-ink text-white rounded hover:bg-ink-secondary transition-colors flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Master Course</span>
            </button>
            <button
              onClick={onClose}
              className="text-ink-secondary hover:text-ink p-1 rounded hover:bg-subtle"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Courses Table */}
        <div className="flex-1 overflow-auto border border-border rounded divide-y divide-border bg-white">
          <table className="w-full min-w-[500px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-subtle border-b border-border text-ink-secondary font-medium">
                <th className="py-2 px-3 font-mono">Code</th>
                <th className="py-2 px-3">Course Title</th>
                <th className="py-2 px-3 text-center">Modules</th>
                <th className="py-2 px-3 text-center">Classes</th>
                <th className="py-2 px-3 text-center">Students</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {courses.map((c) => {
                const isSelected = c.id === selectedCourseId;
                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-subtle/40 transition-colors ${
                      isSelected ? 'bg-zinc-50' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-medium text-ink">
                      {c.code}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-ink">{c.title}</div>
                      {c.description && (
                        <div className="text-[11px] text-ink-secondary line-clamp-1">
                          {c.description}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {c.module_count ?? 16}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {c.class_count ?? 1}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {c.student_count ?? 0}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1">
                      {isSelected ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-status-success px-2 py-0.5 rounded bg-green-50 border border-green-200">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            onSelectCourse(c.id);
                            onClose();
                          }}
                          className="px-2 py-1 text-xs border border-border bg-subtle hover:bg-active text-ink rounded transition-colors"
                        >
                          Select
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-ink-secondary">
          <span>{courses.length} total Master Courses defined</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs border border-border bg-white hover:bg-subtle text-ink rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
