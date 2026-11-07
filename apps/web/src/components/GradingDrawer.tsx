'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Save, FileCode, CheckCircle, AlertTriangle } from 'lucide-react';

interface GradingDrawerProps {
  submissionData: any;
  onClose: () => void;
  onSaveGrade: (submissionId: string, finalScore: number, feedback: string) => Promise<void>;
}

export default function GradingDrawer({
  submissionData,
  onClose,
  onSaveGrade,
}: GradingDrawerProps) {
  const [score, setScore] = useState<number>(submissionData?.raw_score || 0);
  const [feedback, setFeedback] = useState<string>(submissionData?.teacher_feedback || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (submissionData) {
      setScore(submissionData.raw_score ?? 0);
      setFeedback(submissionData.teacher_feedback || '');
    }
  }, [submissionData]);

  if (!submissionData) return null;

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSaveGrade(submissionData.submission_id, score, feedback);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[580px] bg-surface border-l border-border shadow-xl z-50 flex flex-col font-sans select-none animate-in slide-in-from-right duration-150">
      {/* Drawer Header */}
      <div className="h-14 px-4 border-b border-border bg-subtle/50 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-ink flex items-center space-x-2">
            <span>Grade Submission:</span>
            <span className="font-mono">{submissionData.student_name}</span>
            <span className="text-ink-secondary text-[11px] font-mono">
              ({submissionData.student_id_code})
            </span>
          </div>
          <div className="text-[11px] text-ink-secondary truncate max-w-[420px]">
            {submissionData.assignment_title}
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-subtle text-ink-secondary hover:text-ink transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Score & Status Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 bg-subtle border border-border rounded">
            <span className="text-[10px] text-ink-secondary uppercase block">
              Automated Score
            </span>
            <span className="text-sm font-mono font-semibold text-ink">
              {submissionData.verification_score ?? submissionData.raw_score} /{' '}
              {submissionData.max_score}
            </span>
          </div>

          <div className="p-2.5 bg-subtle border border-border rounded">
            <span className="text-[10px] text-ink-secondary uppercase block">Status</span>
            <span className="text-xs font-mono font-medium text-ink capitalize">
              {submissionData.execution_status || 'Graded'}
            </span>
          </div>

          <div className="p-2.5 bg-subtle border border-border rounded">
            <span className="text-[10px] text-ink-secondary uppercase block">Version</span>
            <span className="text-sm font-mono font-semibold text-ink">
              v{submissionData.version || 1}
            </span>
          </div>
        </div>

        {/* SQL Diff / View */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 font-medium text-ink">
              <FileCode className="w-3.5 h-3.5" />
              <span>Student Submitted SQL</span>
            </div>
          </div>

          <div className="border border-border rounded bg-subtle p-3 overflow-x-auto">
            <pre className="font-mono text-xs text-ink whitespace-pre-wrap">
              {submissionData.submitted_sql || '-- No SQL submission found'}
            </pre>
          </div>
        </div>

        {/* Canonical Reference Solution */}
        {submissionData.solution_sql && (
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-ink-secondary">
              Canonical Teacher Solution:
            </span>
            <div className="border border-border rounded bg-white p-2.5 overflow-x-auto opacity-80">
              <pre className="font-mono text-[11px] text-ink-secondary whitespace-pre-wrap">
                {submissionData.solution_sql}
              </pre>
            </div>
          </div>
        )}

        {/* Grading Controls */}
        <div className="space-y-3 pt-3 border-t border-border">
          <div>
            <label className="block text-xs font-medium text-ink mb-1">
              Adjust Final Score (out of {submissionData.max_score || 100})
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max={submissionData.max_score || 100}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-32 px-2.5 py-1.5 bg-white border border-border rounded text-xs font-mono text-ink focus:outline-none focus:border-border-strong"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1">
              Instructor Line-Item Feedback
            </label>
            <textarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide constructive feedback regarding normalization, indices, or analytical logic..."
              className="w-full p-2.5 bg-white border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong font-sans"
            />
          </div>
        </div>
      </div>

      {/* Drawer Footer */}
      <div className="h-14 px-4 border-t border-border bg-subtle/50 flex items-center justify-between">
        <span className="text-[11px] text-ink-secondary font-mono">
          Shortcut: Ctrl+Enter to save
        </span>

        <div className="flex items-center space-x-2">
          {saveSuccess && (
            <span className="text-xs text-status-success font-medium flex items-center space-x-1">
              <Check className="w-3.5 h-3.5" />
              <span>Saved!</span>
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            data-testid="save-grade-btn"
            className="px-3 py-1.5 text-xs bg-ink text-white rounded hover:bg-ink-secondary transition-colors flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Grade'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
