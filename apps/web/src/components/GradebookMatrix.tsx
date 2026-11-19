'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  BarChart3,
} from 'lucide-react';
import GradingDrawer from './GradingDrawer';
import { ConfirmDialog } from './Dialog';

interface GradebookMatrixProps {
  cohortId: string;
  onCohortStatusChange?: (status: string) => void;
}

export default function GradebookMatrix({
  cohortId,
  onCohortStatusChange,
}: GradebookMatrixProps) {
  const [gradebookData, setGradebookData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCellSubmission, setSelectedCellSubmission] = useState<any>(null);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState<boolean>(false);

  const fetchGradebook = async () => {
    try {
      const res = await fetch(`/api/cohorts/${cohortId}/gradebook`);
      const data = await res.json();
      setGradebookData(data);
      if (onCohortStatusChange && data.cohort?.status) {
        onCohortStatusChange(data.cohort.status);
      }
    } catch (err) {
      console.error('Failed to load gradebook:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGradebook();
  }, [cohortId]);

  // Handle cell click to open grading drawer
  const handleCellClick = async (student: any, assignment: any) => {
    try {
      // Fetch full submission data from grading queue
      const res = await fetch(
        `/api/cohorts/${cohortId}/grading-queue?assignmentId=${assignment.slug}`
      );
      const queue = await res.json();
      const submission = queue.find((s: any) => s.student_id === student.student_uuid);

      const breakdownItem = student.assignment_breakdown?.[assignment.slug];

      setSelectedCellSubmission({
        submission_id: submission?.submission_id,
        cohort_assignment_id: assignment.cohort_assignment_id,
        student_id: student.student_uuid,
        student_name: student.student_name,
        student_id_code: student.student_id_code,
        assignment_title: assignment.title,
        max_score: assignment.max_score,
        weight_percentage: assignment.weight_percentage,
        raw_score: breakdownItem?.raw_score ?? 0,
        verification_score: submission?.verification_score ?? breakdownItem?.raw_score ?? 0,
        version: submission?.version ?? 1,
        language: submission?.language || assignment.language || 'sql',
        submitted_sql: submission?.submitted_sql || '',
        submitted_python: submission?.submitted_python || '',
        solution_sql: submission?.solution_sql || '',
        solution_python: submission?.solution_python || '',
        execution_artifacts: submission?.execution_artifacts || null,
        execution_output: submission?.execution_output || null,
        execution_status: breakdownItem?.execution_status || 'graded',
        teacher_feedback: submission?.teacher_feedback || '',
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Save grade from drawer
  const handleSaveGrade = async (submissionId: string, finalScore: number, feedback: string) => {
    if (!submissionId) return;
    await fetch(`/api/submissions/${submissionId}/grade`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        finalScore,
        teacherFeedback: feedback,
        status: 'graded',
      }),
    });
    await fetchGradebook();
  };

  // Finalize Cohort & Lock Grades
  const handleFinalizeCohort = async () => {
    setIsFinalizing(true);
    try {
      const res = await fetch(`/api/cohorts/${cohortId}/finalize`, {
        method: 'POST',
      });
      const data = await res.json();
      setShowConfirmModal(false);
      await fetchGradebook();
    } catch (err) {
      console.error('Finalize error:', err);
    } finally {
      setIsFinalizing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-3rem)] flex items-center justify-center text-xs text-ink-secondary">
        Loading cohort gradebook matrix...
      </div>
    );
  }

  const cohort = gradebookData?.cohort;
  const assignments: any[] = gradebookData?.assignments || [];
  const students: any[] = gradebookData?.grades || [];
  const isCompleted = cohort?.status === 'completed';

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col bg-canvas overflow-hidden">
      {/* Top Action Toolbar */}
      <div className="min-h-[3.5rem] py-2 px-3 sm:px-4 border-b border-border bg-surface flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-ink flex items-center space-x-2 truncate">
              {cohort?.course_code && (
                <span className="px-1.5 py-0.5 rounded bg-subtle text-[10px] font-mono border border-border shrink-0">
                  [{cohort.course_code}]
                </span>
              )}
              <span className="truncate">{cohort?.name}</span>
              <span className="font-mono text-ink-secondary text-[11px] shrink-0">({cohort?.code})</span>
            </div>
            <div className="text-[11px] text-ink-secondary truncate">
              {cohort?.course_title ? `${cohort.course_title} • ` : ''}Semester: {cohort?.term} • {students.length} Enrolled Students
            </div>
          </div>

          <div
            className={`px-2 py-0.5 rounded text-[11px] font-mono border flex items-center space-x-1.5 shrink-0 ${
              isCompleted
                ? 'bg-red-50 border-status-danger/30 text-status-danger'
                : 'bg-green-50 border-status-success/30 text-status-success'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isCompleted ? 'bg-status-danger' : 'bg-status-success'
              }`}
            />
            <span className="capitalize">{isCompleted ? 'Grades Locked' : 'Active Class'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Complete Class & Lock Grades */}
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isCompleted || isFinalizing}
            data-testid="finalize-cohort-btn"
            className={`px-3 py-1.5 text-xs rounded border transition-colors flex items-center space-x-1.5 ${
              isCompleted
                ? 'bg-subtle text-ink-muted border-border cursor-not-allowed'
                : 'bg-white border-border text-ink hover:bg-subtle'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>
              <span className="hidden sm:inline">{isCompleted ? 'Class Completed & Locked' : 'Complete Class & Lock Grades'}</span>
              <span className="sm:hidden">{isCompleted ? 'Locked' : 'Lock Grades'}</span>
            </span>
          </button>

          {/* Export Final Scores Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              data-testid="export-dropdown-btn"
              className="px-3 py-1.5 text-xs bg-ink text-white rounded hover:bg-ink-secondary transition-colors flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Final Scores</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {exportDropdownOpen && (
              <div
                className="absolute right-0 mt-1 w-52 bg-surface border border-border rounded shadow-lg z-30 py-1 text-xs"
                onClick={() => setExportDropdownOpen(false)}
              >
                <a
                  href={`/api/cohorts/${cohortId}/scores/export?format=csv`}
                  download
                  data-testid="export-csv-btn"
                  className="px-3 py-2 flex items-center space-x-2 hover:bg-subtle text-ink transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-ink-secondary" />
                  <div>
                    <div className="font-medium">Export CSV (.csv)</div>
                    <div className="text-[10px] text-ink-secondary">
                      Registrar / Canvas format
                    </div>
                  </div>
                </a>

                <a
                  href={`/api/cohorts/${cohortId}/scores/export?format=xlsx`}
                  download
                  data-testid="export-xlsx-btn"
                  className="px-3 py-2 flex items-center space-x-2 hover:bg-subtle text-ink transition-colors border-t border-border"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-status-success" />
                  <div>
                    <div className="font-medium">Export Excel (.xlsx)</div>
                    <div className="text-[10px] text-ink-secondary">
                      3-Tab Gradebook Workbook
                    </div>
                  </div>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gradebook Matrix Table Container */}
      <div className="flex-1 overflow-auto p-4">
        <div className="border border-border rounded bg-surface shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs font-mono">
            {/* Table Header */}
            <thead className="bg-subtle text-ink font-medium border-b border-border select-none">
              <tr>
                {/* Sticky Left: Student Identification */}
                <th className="p-2.5 border-r border-border sticky left-0 bg-subtle z-20 min-w-[120px]">
                  Student ID
                </th>
                <th className="p-2.5 border-r border-border sticky left-[120px] bg-subtle z-20 min-w-[160px]">
                  Full Name
                </th>

                {/* Published Assignment Columns */}
                {assignments.map((a: any) => (
                  <th
                    key={a.cohort_assignment_id}
                    className="p-2.5 border-r border-border min-w-[130px] text-center"
                  >
                    <div className="truncate max-w-[140px]" title={a.title}>
                      {a.title}
                    </div>
                    <span className="text-[10px] text-ink-secondary font-sans font-normal">
                      Weight: {Number(a.weight_percentage)}%
                    </span>
                  </th>
                ))}

                {/* Sticky Right: Summary Columns */}
                <th className="p-2.5 border-l border-r border-border sticky right-[90px] bg-subtle z-20 min-w-[110px] text-center">
                  Weighted Total
                </th>
                <th className="p-2.5 sticky right-0 bg-subtle z-20 min-w-[90px] text-center">
                  Grade
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {students.map((s: any, sIdx: number) => {
                const breakdown = s.assignment_breakdown || {};
                const totalScore = Number(s.total_weighted_score) || 0;

                return (
                  <tr
                    key={s.student_uuid}
                    className="border-b border-border last:border-b-0 hover:bg-subtle/40 tabular-nums transition-colors"
                  >
                    {/* Sticky Left: Student ID */}
                    <td className="p-2.5 border-r border-border sticky left-0 bg-surface z-10 font-semibold text-ink">
                      {s.student_id_code || 'N/A'}
                    </td>

                    {/* Sticky Left: Full Name */}
                    <td className="p-2.5 border-r border-border sticky left-[120px] bg-surface z-10 truncate text-ink font-sans">
                      {s.student_name}
                    </td>

                    {/* Assignment Scores */}
                    {assignments.map((a: any) => {
                      const item = breakdown[a.slug];
                      const rawScore = item ? Number(item.raw_score) : null;
                      const weightedPts = item ? Number(item.weighted_points) : null;

                      return (
                        <td
                          key={a.cohort_assignment_id}
                          data-testid="score-cell"
                          data-student={s.student_name}
                          data-assignment-slug={a.slug}
                          onClick={() => handleCellClick(s, a)}
                          title="Click to view submission & adjust score in drawer"
                          className="p-2.5 border-r border-border text-center cursor-pointer hover:bg-subtle transition-colors group"
                        >
                          {rawScore !== null ? (
                            <div className="flex flex-col items-center">
                              <span className="text-ink font-medium">
                                {rawScore.toFixed(1)}
                              </span>
                              <span className="text-[10px] text-ink-secondary font-sans">
                                ({weightedPts?.toFixed(2)} pts)
                              </span>
                            </div>
                          ) : (
                            <span className="text-ink-muted italic">--</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Sticky Right: Weighted Total */}
                    <td className="p-2.5 border-l border-r border-border sticky right-[90px] bg-surface z-10 text-center font-bold text-ink">
                      {totalScore.toFixed(2)}%
                    </td>

                    {/* Sticky Right: Letter Grade Badge */}
                    <td className="p-2.5 sticky right-0 bg-surface z-10 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          s.letter_grade === 'A'
                            ? 'bg-zinc-900 text-white'
                            : s.letter_grade.startsWith('B')
                            ? 'bg-zinc-200 text-zinc-900'
                            : s.letter_grade.startsWith('C')
                            ? 'bg-zinc-100 text-zinc-700'
                            : 'bg-red-100 text-status-danger'
                        }`}
                      >
                        {s.letter_grade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-by-Side Grading Drawer */}
      {selectedCellSubmission && (
        <GradingDrawer
          submissionData={selectedCellSubmission}
          onClose={() => setSelectedCellSubmission(null)}
          onSaveGrade={handleSaveGrade}
        />
      )}

      {/* Confirmation Dialog for Finalizing Cohort */}
      <ConfirmDialog
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleFinalizeCohort}
        isLoading={isFinalizing}
        title="Finalize Class & Lock Cohort Grades?"
        variant="danger"
        confirmText={isFinalizing ? 'Locking...' : 'Yes, Lock & Finalize Grades'}
        confirmTestId="confirm-lock-grades-btn"
        cancelTestId="cancel-lock-grades-btn"
      >
        <p className="text-xs text-ink-secondary leading-relaxed">
          This will lock the cohort <span className="font-mono text-ink font-medium">{cohort?.code}</span>.
          All final student weighted scores and letter grades will be permanently snapshotted in the university database.
          Further student submissions will be closed.
        </p>
      </ConfirmDialog>
    </div>
  );
}
