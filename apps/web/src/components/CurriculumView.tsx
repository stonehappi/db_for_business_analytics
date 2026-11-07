'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Layers,
  Send,
  CheckCircle,
  FileCode,
  Shield,
  Clock,
  Plus,
} from 'lucide-react';

interface CurriculumViewProps {
  cohortId: string;
}

export default function CurriculumView({ cohortId }: CurriculumViewProps) {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [publishModalAssignment, setPublishModalAssignment] = useState<any>(null);
  const [dueDate, setDueDate] = useState<string>('2026-12-15T23:59');
  const [weightOverride, setWeightOverride] = useState<number | ''>('');
  const [publishSuccess, setPublishSuccess] = useState<boolean>(false);

  const fetchModules = async () => {
    try {
      const res = await fetch('/api/master/modules');
      const data = await res.json();
      setModules(data);
      if (data.length > 0 && data[0].assignments.length > 0) {
        setSelectedAssignment(data[0].assignments[0]);
      } else {
        // Find first module with assignment
        const firstWithAssign = data.find((m: any) => m.assignments?.length > 0);
        if (firstWithAssign) setSelectedAssignment(firstWithAssign.assignments[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handlePublish = async () => {
    if (!publishModalAssignment) return;
    try {
      await fetch(`/api/cohorts/${cohortId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterAssignmentId: publishModalAssignment.id,
          dueAt: new Date(dueDate).toISOString(),
          weightOverride: weightOverride !== '' ? Number(weightOverride) : null,
          isPublished: true,
        }),
      });
      setPublishSuccess(true);
      setTimeout(() => {
        setPublishSuccess(false);
        setPublishModalAssignment(null);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-3rem)] flex items-center justify-center text-xs text-ink-secondary">
        Loading master 16-week curriculum...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] flex bg-canvas overflow-hidden">
      {/* LEFT: 16-Week Syllabus Explorer (Width: 32%) */}
      <div className="w-[32%] min-w-[340px] max-w-[460px] h-full border-r border-border bg-surface flex flex-col">
        <div className="p-3 border-b border-border bg-subtle/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-ink" />
            <span className="text-xs font-semibold text-ink uppercase tracking-wider">
              16-Week Master Syllabus
            </span>
          </div>
          <span className="text-[11px] font-mono text-ink-secondary">
            {modules.length} Modules
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {modules.map((m: any) => (
            <div key={m.id} className="p-3 space-y-2 hover:bg-subtle/30 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-ink flex items-center space-x-1.5">
                    <span className="font-mono text-[11px] px-1 py-0.2 bg-subtle border border-border rounded">
                      W{m.weekNumber}
                    </span>
                    <span className="truncate max-w-[240px]">{m.title}</span>
                  </div>
                  <div className="text-[11px] text-ink-secondary mt-0.5 line-clamp-1">
                    {m.description}
                  </div>
                </div>
              </div>

              {/* Nested Assignments */}
              {m.assignments && m.assignments.length > 0 && (
                <div className="space-y-1.5 pl-3 border-l border-border mt-2">
                  {m.assignments.map((a: any) => (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAssignment(a)}
                      className={`p-2 rounded text-xs cursor-pointer border transition-colors flex items-center justify-between ${
                        selectedAssignment?.id === a.id
                          ? 'bg-subtle border-border-strong text-ink font-medium'
                          : 'bg-surface border-border text-ink-secondary hover:text-ink'
                      }`}
                    >
                      <div className="truncate max-w-[220px]">
                        <span>{a.title}</span>
                      </div>
                      <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-border shrink-0 ml-1">
                        {a.weightPercentage}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Master Assignment Detail Canvas */}
      <div className="flex-1 h-full flex flex-col bg-surface overflow-y-auto">
        {selectedAssignment ? (
          <div className="p-6 space-y-6 max-w-4xl">
            {/* Header Toolbar */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[11px] font-mono uppercase px-2 py-0.5 bg-subtle border border-border rounded text-ink font-medium">
                    {selectedAssignment.type.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-mono text-ink-secondary">
                    Slug: {selectedAssignment.slug}
                  </span>
                </div>
                <h2 className="text-base font-semibold text-ink">
                  {selectedAssignment.title}
                </h2>
              </div>

              <button
                onClick={() => {
                  setPublishModalAssignment(selectedAssignment);
                  setWeightOverride(selectedAssignment.weightPercentage);
                }}
                data-testid="publish-to-cohort-btn"
                className="px-3 py-1.5 text-xs bg-ink text-white rounded hover:bg-ink-secondary transition-colors flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish to Cohort</span>
              </button>
            </div>

            {/* Weights and Max Score */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-subtle border border-border rounded">
                <span className="text-[10px] text-ink-secondary uppercase block">
                  Course Grade Weight
                </span>
                <span className="text-sm font-mono font-semibold text-ink">
                  {selectedAssignment.weightPercentage}% of final grade
                </span>
              </div>
              <div className="p-3 bg-subtle border border-border rounded">
                <span className="text-[10px] text-ink-secondary uppercase block">Max Points</span>
                <span className="text-sm font-mono font-semibold text-ink">
                  {selectedAssignment.maxScore} pts
                </span>
              </div>
              <div className="p-3 bg-subtle border border-border rounded">
                <span className="text-[10px] text-ink-secondary uppercase block">
                  Rubric Criteria
                </span>
                <span className="text-sm font-mono font-semibold text-ink">
                  {selectedAssignment.rubricCriteria?.length || 0} checks
                </span>
              </div>
            </div>

            {/* Business Case Narrative */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-ink uppercase tracking-wider">
                Case Study Brief & Business Requirements
              </div>
              <div className="p-4 bg-subtle border border-border rounded text-xs whitespace-pre-wrap font-sans text-ink leading-relaxed">
                {selectedAssignment.businessCaseMarkdown}
              </div>
            </div>

            {/* Starter and Solution SQL */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  Starter SQL Provided to Students
                </span>
                <pre className="p-3 bg-subtle border border-border rounded text-xs font-mono text-ink overflow-x-auto">
                  {selectedAssignment.starterSql}
                </pre>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  Canonical Teacher Solution
                </span>
                <pre className="p-3 bg-zinc-900 text-zinc-100 border border-zinc-800 rounded text-xs font-mono overflow-x-auto">
                  {selectedAssignment.solutionSql}
                </pre>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  Automated Test Verification SQL
                </span>
                <pre className="p-3 bg-subtle border border-border rounded text-xs font-mono text-ink overflow-x-auto">
                  {selectedAssignment.verificationSql}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-ink-secondary">
            Select an assignment from the 16-week syllabus to inspect or publish.
          </div>
        )}
      </div>

      {/* Publish Assignment Modal */}
      {publishModalAssignment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded shadow-xl max-w-md w-full p-5 space-y-4 font-sans animate-in fade-in duration-100">
            <div className="flex items-center space-x-2">
              <Send className="w-4 h-4 text-ink" />
              <h3 className="text-sm font-semibold text-ink">
                Publish to Cohort {cohortId ? 'BA-2026-FALL-A' : ''}
              </h3>
            </div>

            <div className="text-xs text-ink-secondary">
              Deploying <span className="font-semibold text-ink">{publishModalAssignment.title}</span> to the active class section.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Submission Deadline (Due Date)
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-border rounded text-xs font-mono text-ink focus:outline-none focus:border-border-strong"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Cohort Weight Override (%):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={weightOverride}
                  onChange={(e) => setWeightOverride(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={`${publishModalAssignment.weightPercentage}`}
                  className="w-full px-2.5 py-1.5 bg-white border border-border rounded text-xs font-mono text-ink focus:outline-none focus:border-border-strong"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border">
              <button
                onClick={() => setPublishModalAssignment(null)}
                className="px-3 py-1.5 text-xs text-ink-secondary hover:text-ink rounded hover:bg-subtle transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handlePublish}
                disabled={publishSuccess}
                data-testid="confirm-publish-btn"
                className="px-3 py-1.5 text-xs bg-ink text-white rounded hover:bg-ink-secondary transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              >
                {publishSuccess ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-status-success" />
                    <span>Published!</span>
                  </>
                ) : (
                  <span>Publish Assignment</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
