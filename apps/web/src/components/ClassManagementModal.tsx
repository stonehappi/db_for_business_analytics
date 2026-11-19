'use client';

import React from 'react';
import { Calendar, Plus, X, Check, Users, Lock, CheckCircle2, Trash2 } from 'lucide-react';
import { CohortClass } from './Navigation';

interface ClassManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: CohortClass[];
  selectedCohortId: string;
  onSelectClass: (cohortId: string) => void;
  onOpenCreateClass: () => void;
  onOpenStudentManagement?: (cohortId?: string) => void;
  onDeleteClass?: (cls: CohortClass) => void;
  courseTitle?: string;
}

export default function ClassManagementModal({
  isOpen,
  onClose,
  classes,
  selectedCohortId,
  onSelectClass,
  onOpenCreateClass,
  onOpenStudentManagement,
  onDeleteClass,
  courseTitle,
}: ClassManagementModalProps) {
  if (!isOpen) return null;

  return (
    <div
      data-testid="class-management-modal"
      className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
    >
      <div className="bg-surface border border-border rounded shadow-xl max-w-3xl w-full p-5 space-y-4 font-sans animate-in fade-in duration-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-subtle border border-border flex items-center justify-center text-ink">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">
                Class Sections & Semesters Management
              </h3>
              <p className="text-xs text-ink-secondary">
                {courseTitle ? `Course: ${courseTitle} • ` : ''}Manage student rosters, semester terms, and grading lock status.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onOpenCreateClass();
              }}
              data-testid="modal-create-class-btn"
              className="px-2.5 py-1.5 text-xs bg-ink text-white rounded hover:bg-ink-secondary transition-colors flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Class Section</span>
            </button>
            <button
              onClick={onClose}
              className="text-ink-secondary hover:text-ink p-1 rounded hover:bg-subtle"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Classes Table */}
        <div className="flex-1 overflow-auto border border-border rounded divide-y divide-border bg-white">
          <table className="w-full min-w-[500px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-subtle border-b border-border text-ink-secondary font-medium">
                <th className="py-2 px-3 font-mono">Section Code</th>
                <th className="py-2 px-3">Class Name</th>
                <th className="py-2 px-3">Semester / Term</th>
                <th className="py-2 px-3 text-center">Status</th>
                <th className="py-2 px-3 text-center">Students</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {classes.map((cls) => {
                const isSelected = cls.id === selectedCohortId;
                const isCompleted = cls.status === 'completed';
                return (
                  <tr
                    key={cls.id}
                    className={`hover:bg-subtle/40 transition-colors ${
                      isSelected ? 'bg-zinc-50' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-medium text-ink">
                      {cls.code}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-ink">
                      {cls.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-ink-secondary">
                      {cls.term}
                    </td>
                    <td className="py-2.5 px-3 text-center">
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
                    <td className="py-2.5 px-3 text-center font-mono">
                      {cls.student_count ?? 0}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                      {onOpenStudentManagement && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenStudentManagement(cls.id);
                          }}
                          data-testid={`modal-manage-class-students-${cls.id}`}
                          title="Manage Student Roster"
                          className="px-2 py-1 text-xs border border-border bg-white hover:bg-subtle text-ink rounded transition-colors inline-flex items-center space-x-1"
                        >
                          <Users className="w-3 h-3" />
                          <span>Roster</span>
                        </button>
                      )}
                      {isSelected ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-status-success px-2 py-0.5 rounded bg-green-50 border border-green-200">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            onSelectClass(cls.id);
                            onClose();
                          }}
                          className="px-2 py-1 text-xs border border-border bg-subtle hover:bg-active text-ink rounded transition-colors"
                        >
                          Select
                        </button>
                      )}
                      {onDeleteClass && (
                        <button
                          onClick={() => onDeleteClass(cls)}
                          title={`Delete Class ${cls.code}`}
                          data-testid={`btn-delete-class-${cls.id}`}
                          className="p-1 text-ink-secondary hover:text-red-600 hover:bg-red-50 rounded transition-colors inline-flex items-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
          <span>{classes.length} total Class Sections defined</span>
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
