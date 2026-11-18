'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Play,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  Layers,
  FileText,
  AlertCircle,
  Table,
  CheckSquare,
  Tv,
  HelpCircle,
  Briefcase,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { UserProfile } from './Navigation';
import LectureSlideViewer from './LectureSlideViewer';
import QuizExerciseViewer from './QuizExerciseViewer';
import { useDialog } from './Dialog';

const MonacoSqlEditor = dynamic(() => import('./MonacoSqlEditor'), { ssr: false });

interface Assignment {
  cohort_assignment_id: string;
  master_assignment_id: string;
  title: string;
  slug: string;
  type: string;
  max_score: number;
  weight_percentage: number;
  due_at: string;
}

interface StudentWorkspaceProps {
  currentUser: UserProfile;
  cohortId: string;
  courseId?: string;
}

export default function StudentWorkspace({ currentUser, cohortId, courseId }: StudentWorkspaceProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(1);
  const [activeStudentTab, setActiveStudentTab] = useState<'project' | 'lecture' | 'quiz'>('project');
  const [mobilePanel, setMobilePanel] = useState<'brief' | 'editor' | 'results'>('editor');

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [assignmentDetail, setAssignmentDetail] = useState<any>(null);
  const [sqlCode, setSqlCode] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'results' | 'tests' | 'schema'>('results');
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<any>(null);
  const [schemaTables, setSchemaTables] = useState<any[]>([]);

  // 1. Fetch modules with lecture slides and quiz data
  useEffect(() => {
    const url = courseId ? `/api/master/modules?courseId=${courseId}` : '/api/master/modules';
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setModules(data);
        }
      })
      .catch((err) => console.error('Error fetching modules:', err));
  }, [courseId]);

  // 2. Load published assignments for the cohort
  useEffect(() => {
    fetch(`/api/cohorts/${cohortId}/gradebook`)
      .then((res) => res.json())
      .then((data) => {
        if (data.assignments && data.assignments.length > 0) {
          setAssignments(data.assignments);
          // Set initial assignment if not already set
          setSelectedAssignment((prev) => prev || data.assignments[0]);
        }
      })
      .catch((err) => console.error('Error fetching assignments:', err));
  }, [cohortId]);

  // 3. Load assignment details when selected & sync week
  useEffect(() => {
    if (!selectedAssignment || modules.length === 0) return;

    for (const m of modules) {
      const found = m.assignments?.find(
        (a: any) =>
          a.id === selectedAssignment.master_assignment_id ||
          a.slug === selectedAssignment.slug
      );
      if (found) {
        setAssignmentDetail(found);
        setSqlCode(found.starterSql || '-- Write your SQL query here\n');
        setSelectedWeekNum(m.weekNumber);
        break;
      }
    }
  }, [selectedAssignment, modules]);

  // Fetch sandbox schema inspection
  useEffect(() => {
    fetch('/api/schema/inspect')
      .then((res) => res.json())
      .then((data) => {
        if (data.tables) setSchemaTables(data.tables);
      })
      .catch((err) => console.error('Error inspecting schema:', err));
  }, []);

  // Handle week change from selector
  const handleSelectWeek = (weekNum: number) => {
    setSelectedWeekNum(weekNum);
    const targetMod = modules.find((m) => m.weekNumber === weekNum);
    if (targetMod && targetMod.assignments?.length > 0) {
      const firstAssign = targetMod.assignments[0];
      const matchingCohortAssign = assignments.find(
        (a) => a.master_assignment_id === firstAssign.id || a.slug === firstAssign.slug
      );
      if (matchingCohortAssign) {
        setSelectedAssignment(matchingCohortAssign);
      }
    }
  };

  // Execute Sandbox Query
  const handleRunSandbox = async () => {
    if (!selectedAssignment || isRunning) return;
    setIsRunning(true);
    setSubmissionFeedback(null);

    try {
      const res = await fetch('/api/sandbox/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohortAssignmentId: selectedAssignment.cohort_assignment_id,
          masterAssignmentId: selectedAssignment.master_assignment_id,
          sqlCode,
        }),
      });
      const data = await res.json();
      setExecutionResult(data);
      if (data.status === 'success') {
        setActiveBottomTab('results');
      } else {
        setActiveBottomTab('tests');
      }
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setMobilePanel('results');
      }
    } catch (err: any) {
      setExecutionResult({
        status: 'syntax_error',
        error: err.message,
        executionTimeMs: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Final Solution
  const handleSubmitSolution = async () => {
    if (!selectedAssignment || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohortAssignmentId: selectedAssignment.cohort_assignment_id,
          studentId: currentUser.id,
          submittedSql: sqlCode,
        }),
      });
      const data = await res.json();
      setSubmissionFeedback(data);
      if (data.execution) {
        setExecutionResult(data.execution);
        setActiveBottomTab('tests');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { confirm } = useDialog();

  // Reset Query to Starter Code
  const handleResetStarterCode = async () => {
    const starter = assignmentDetail?.starterSql || '-- Write your SQL query here\n';
    if (sqlCode === starter) return;

    const ok = await confirm({
      title: 'Reset to Starter Code?',
      message:
        'Are you sure you want to discard your current SQL query and restore the original template? All unsaved modifications in the editor will be lost.',
      confirmText: 'Reset Code',
      cancelText: 'Keep Current Code',
      variant: 'warning',
      confirmTestId: 'confirm-reset-code-btn',
    });

    if (ok) {
      setSqlCode(starter);
    }
  };

  const currentModule =
    modules.find((m) => m.weekNumber === selectedWeekNum) ||
    modules[0] || {
      id: '',
      title: `Week ${selectedWeekNum}`,
      weekNumber: selectedWeekNum,
      lectureSlidesHtml: '',
      quizData: [],
    };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] w-full overflow-hidden bg-canvas font-sans">
      {/* TOP BAR: Weekly Learning Hub Navigation & 3-Pillar Switcher */}
      <div className="min-h-[2.75rem] py-1.5 px-3 sm:px-4 bg-surface border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 select-none z-10">
        {/* Left: Week Selector & Topic Title */}
        <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
          <div className="flex items-center space-x-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-ink-secondary" />
            <select
              value={selectedWeekNum}
              onChange={(e) => handleSelectWeek(Number(e.target.value))}
              data-testid="student-week-selector"
              className="text-xs bg-subtle border border-border rounded px-2 py-1 font-mono font-medium text-ink focus:outline-none focus:border-border-strong cursor-pointer"
            >
              {modules.map((m) => (
                <option key={m.id} value={m.weekNumber}>
                  Week {m.weekNumber}: {m.title.replace(/^Week \d+:\s*/, '')}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-ink-secondary hidden md:inline truncate max-w-[320px]">
            {currentModule?.description}
          </span>
        </div>

        {/* Right: 3 Pillar Tabs for this Week */}
        <div className="flex items-center bg-subtle p-0.5 rounded border border-border overflow-x-auto max-w-full shrink-0">
          <button
            onClick={() => setActiveStudentTab('lecture')}
            data-testid="student-tab-lecture"
            className={`px-2.5 sm:px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1.5 shrink-0 ${
              activeStudentTab === 'lecture'
                ? 'bg-surface text-ink font-semibold shadow-2xs border border-border'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Lecture<span className="hidden sm:inline"> (Slide)</span></span>
          </button>

          <button
            onClick={() => setActiveStudentTab('quiz')}
            data-testid="student-tab-quiz"
            className={`px-2.5 sm:px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1.5 shrink-0 ${
              activeStudentTab === 'quiz'
                ? 'bg-surface text-ink font-semibold shadow-2xs border border-border'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Quiz<span className="hidden sm:inline"> / Exercise</span></span>
          </button>

          <button
            onClick={() => setActiveStudentTab('project')}
            data-testid="student-tab-project"
            className={`px-2.5 sm:px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1.5 shrink-0 ${
              activeStudentTab === 'project'
                ? 'bg-surface text-ink font-semibold shadow-2xs border border-border'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Project<span className="hidden sm:inline"> (Workspace)</span></span>
          </button>
        </div>
      </div>

      {/* MAIN VIEWPORT: Render active pillar */}
      <div className="flex-1 overflow-hidden">
        {/* PILLAR 1: LECTURE SLIDES (HTML) */}
        {activeStudentTab === 'lecture' && (
          <div className="h-full p-4 overflow-hidden">
            <LectureSlideViewer
              htmlContent={currentModule?.lectureSlidesHtml}
              moduleTitle={currentModule?.title}
              weekNumber={currentModule?.weekNumber}
              isTeacher={false}
            />
          </div>
        )}

        {/* PILLAR 2: EXERCISE / QUIZ */}
        {activeStudentTab === 'quiz' && (
          <div className="h-full p-4 overflow-y-auto">
            <QuizExerciseViewer
              moduleId={currentModule?.id}
              weekNumber={currentModule?.weekNumber}
              moduleTitle={currentModule?.title}
              quizData={currentModule?.quizData || []}
              studentId={currentUser.id}
              cohortId={cohortId}
              isTeacher={false}
            />
          </div>
        )}

        {/* PILLAR 3: PROJECT (EXISTING 3-PANEL CODE & SANDBOX WORKSPACE) */}
        {activeStudentTab === 'project' && (
          <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden">
            {/* Mobile View Panel Switcher (Only visible on screens < lg) */}
            <div className="lg:hidden flex items-center bg-subtle border-b border-border p-1 space-x-1 shrink-0 select-none">
              <button
                onClick={() => setMobilePanel('brief')}
                className={`flex-1 py-1 px-2 text-xs rounded font-medium flex items-center justify-center space-x-1 transition-colors ${
                  mobilePanel === 'brief'
                    ? 'bg-surface text-ink shadow-2xs border border-border'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Brief</span>
              </button>
              <button
                onClick={() => setMobilePanel('editor')}
                className={`flex-1 py-1 px-2 text-xs rounded font-medium flex items-center justify-center space-x-1 transition-colors ${
                  mobilePanel === 'editor'
                    ? 'bg-surface text-ink shadow-2xs border border-border'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>SQL Editor</span>
              </button>
              <button
                onClick={() => setMobilePanel('results')}
                className={`flex-1 py-1 px-2 text-xs rounded font-medium flex items-center justify-center space-x-1 transition-colors ${
                  mobilePanel === 'results'
                    ? 'bg-surface text-ink shadow-2xs border border-border'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Results</span>
              </button>
            </div>

            {/* LEFT PANEL: Business Case, Requirements & Rubric */}
            <div
              className={`${
                mobilePanel === 'brief' ? 'flex' : 'hidden'
              } lg:flex w-full lg:w-[32%] lg:min-w-[320px] lg:max-w-[480px] h-full border-r border-border bg-surface flex-col shrink-0`}
            >
              {/* Header & Assignment Selector */}
              <div className="p-3 border-b border-border bg-subtle/50 flex flex-col space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-secondary">
                    Assignment Scenario
                  </span>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 bg-subtle border border-border rounded text-ink font-medium">
                    Weight: {selectedAssignment?.weight_percentage}%
                  </span>
                </div>

                <select
                  data-testid="assignment-selector"
                  value={selectedAssignment?.cohort_assignment_id || ''}
                  onChange={(e) => {
                    const a = assignments.find((x) => x.cohort_assignment_id === e.target.value);
                    if (a) setSelectedAssignment(a);
                  }}
                  className="w-full text-xs bg-surface border border-border rounded p-1.5 text-ink font-medium focus:outline-none focus:border-border-strong cursor-pointer"
                >
                  {assignments.map((a) => (
                    <option key={a.cohort_assignment_id} value={a.cohort_assignment_id}>
                      {a.title} ({a.weight_percentage}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Narrative & Rubric Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed">
                {assignmentDetail ? (
                  <>
                    {/* Business Case Brief */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-1.5 text-ink font-medium border-b border-border pb-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Business Case Description</span>
                      </div>
                      <div className="text-ink-secondary whitespace-pre-wrap font-sans">
                        {assignmentDetail.businessCaseMarkdown}
                      </div>
                    </div>

                    {/* Rubric Criteria Checklist */}
                    {assignmentDetail.rubricCriteria && assignmentDetail.rubricCriteria.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border">
                        <div className="flex items-center space-x-1.5 text-ink font-medium">
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Evaluation Rubric Criteria</span>
                        </div>
                        <div className="space-y-1.5">
                          {assignmentDetail.rubricCriteria.map((r: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-2 bg-subtle border border-border rounded flex items-center justify-between"
                            >
                              <span className="text-ink font-normal">{r.criterion}</span>
                              <span className="font-mono text-[11px] text-ink-secondary font-medium ml-2">
                                {r.points} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-ink-secondary py-8 text-center">Loading case study details...</div>
                )}
              </div>
            </div>

            {/* RIGHT SPLIT VIEW: Top Editor (55%) & Bottom Output (45%) */}
            <div
              className={`${
                mobilePanel !== 'brief' ? 'flex' : 'hidden'
              } lg:flex flex-1 h-full flex-col overflow-hidden min-w-0`}
            >
              {/* TOP-RIGHT: Monaco SQL Editor & Execution Toolbar (Height: 55%) */}
              <div
                className={`${
                  mobilePanel === 'results' ? 'hidden lg:flex' : 'flex'
                } h-full lg:h-[55%] flex-col border-b border-border bg-surface`}
              >
                {/* Editor Action Toolbar */}
                <div className="h-10 px-3 bg-subtle/40 border-b border-border flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-medium text-ink">
                      solution_query.sql
                    </span>
                    <span className="text-[10px] text-ink-secondary font-mono px-1.5 py-0.2 bg-white border border-border rounded hidden xs:inline">
                      PostgreSQL 16
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <button
                      onClick={handleResetStarterCode}
                      data-testid="reset-query-btn"
                      title="Reset Query to Starter Code"
                      className="p-1 hover:bg-subtle text-ink-secondary hover:text-ink rounded transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={handleRunSandbox}
                      disabled={isRunning}
                      data-testid="run-sandbox-btn"
                      className="px-2 sm:px-2.5 py-1 text-xs bg-ink text-white rounded hover:bg-ink-secondary transition-colors flex items-center space-x-1 sm:space-x-1.5 disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isRunning ? 'Running...' : 'Run Sandbox'}</span>
                      <span className="text-[10px] text-zinc-400 font-mono ml-0.5 hidden sm:inline">Ctrl+↵</span>
                    </button>

                    <button
                      onClick={handleSubmitSolution}
                      disabled={isSubmitting}
                      data-testid="submit-solution-btn"
                      className="px-2 sm:px-2.5 py-1 text-xs border border-border bg-white text-ink rounded hover:bg-subtle transition-colors flex items-center space-x-1 sm:space-x-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>
                        <span className="hidden sm:inline">{isSubmitting ? 'Submitting...' : 'Submit Final Solution'}</span>
                        <span className="sm:hidden">{isSubmitting ? '...' : 'Submit'}</span>
                      </span>
                    </button>
                  </div>
                </div>

                {/* Monaco Editor Container */}
                <div className="flex-1 w-full overflow-hidden">
                  <MonacoSqlEditor
                    value={sqlCode}
                    onChange={setSqlCode}
                    onRun={handleRunSandbox}
                  />
                </div>
              </div>

              {/* BOTTOM-RIGHT: Query Results, Verification Tests & Schema Inspector (Height: 45%) */}
              <div
                className={`${
                  mobilePanel === 'editor' ? 'hidden lg:flex' : 'flex'
                } h-full lg:h-[45%] flex-col bg-surface overflow-hidden`}
              >
                {/* Bottom Tabs Header */}
                <div className="h-9 px-3 bg-subtle border-b border-border flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setActiveBottomTab('results')}
                      data-testid="tab-results"
                      className={`px-2.5 py-1 text-xs rounded transition-colors flex items-center space-x-1.5 ${
                        activeBottomTab === 'results'
                          ? 'bg-white text-ink font-medium border border-border'
                          : 'text-ink-secondary hover:text-ink'
                      }`}
                    >
                      <Table className="w-3 h-3" />
                      <span>Query Results</span>
                    </button>

                    <button
                      onClick={() => setActiveBottomTab('tests')}
                      data-testid="tab-tests"
                      className={`px-2.5 py-1 text-xs rounded transition-colors flex items-center space-x-1.5 ${
                        activeBottomTab === 'tests'
                          ? 'bg-white text-ink font-medium border border-border'
                          : 'text-ink-secondary hover:text-ink'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verification Tests</span>
                      {executionResult?.testResults && (
                        <span
                          className={`w-2 h-2 rounded-full ${
                            executionResult.testResults.passed
                              ? 'bg-status-success'
                              : 'bg-status-danger'
                          }`}
                        />
                      )}
                    </button>

                    <button
                      onClick={() => setActiveBottomTab('schema')}
                      data-testid="tab-schema"
                      className={`px-2.5 py-1 text-xs rounded transition-colors flex items-center space-x-1.5 ${
                        activeBottomTab === 'schema'
                          ? 'bg-white text-ink font-medium border border-border'
                          : 'text-ink-secondary hover:text-ink'
                      }`}
                    >
                      <Database className="w-3 h-3" />
                      <span>Schema Inspector</span>
                    </button>
                  </div>

                  {/* Execution timing stats */}
                  {executionResult && (
                    <div className="flex items-center space-x-2 text-[11px] font-mono text-ink-secondary">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{executionResult.executionTimeMs}ms</span>
                      </div>
                      {executionResult.rowCount !== undefined && (
                        <span>• {executionResult.rowCount} rows</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Submission Banner (if submitted) */}
                {submissionFeedback && (
                  <div className="bg-subtle px-3 py-1.5 border-b border-border flex items-center justify-between text-xs shrink-0">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                      <span className="font-medium text-ink">
                        Solution Version {submissionFeedback.submission.version} Submitted Successfully!
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-ink-secondary">
                      Score: {submissionFeedback.submission.final_score} / 100
                    </span>
                  </div>
                )}

                {/* Tab Content Panes */}
                <div className="flex-1 overflow-auto p-3">
                  {/* TAB 1: Query Results Table */}
                  {activeBottomTab === 'results' && (
                    <>
                      {executionResult?.status === 'success' && executionResult.rows ? (
                        <div className="border border-border rounded overflow-hidden">
                          <table className="w-full text-left border-collapse text-xs font-mono">
                            <thead className="bg-subtle text-ink font-medium border-b border-border">
                              <tr>
                                {executionResult.columns?.map((col: any, idx: number) => (
                                  <th key={idx} className="p-2 border-r border-border last:border-r-0">
                                    <div className="flex flex-col">
                                      <span>{col.name}</span>
                                      <span className="text-[10px] text-ink-secondary font-normal font-sans">
                                        {col.type}
                                      </span>
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {executionResult.rows.map((row: any, rIdx: number) => (
                                <tr
                                  key={rIdx}
                                  className="border-b border-border last:border-b-0 hover:bg-subtle/50 tabular-nums"
                                >
                                  {executionResult.columns?.map((col: any, cIdx: number) => (
                                    <td
                                      key={cIdx}
                                      className="p-2 border-r border-border last:border-r-0 truncate max-w-[200px]"
                                    >
                                      {row[col.name] !== null && row[col.name] !== undefined
                                        ? String(row[col.name])
                                        : <span className="text-ink-muted italic">NULL</span>}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : executionResult?.status === 'syntax_error' ||
                        executionResult?.status === 'security_violation' ||
                        executionResult?.status === 'timeout_error' ? (
                        <div className="p-3 bg-red-50 border border-status-danger/30 rounded text-xs space-y-1">
                          <div className="flex items-center space-x-1.5 text-status-danger font-medium">
                            <AlertCircle className="w-4 h-4" />
                            <span className="uppercase tracking-wider text-[11px]">
                              {executionResult.status.replace('_', ' ')}
                            </span>
                          </div>
                          <pre className="font-mono text-status-danger whitespace-pre-wrap">
                            {executionResult.error}
                          </pre>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-ink-secondary text-xs">
                          Write your analytical SQL above and press &ldquo;Run Sandbox&rdquo; or Ctrl+Enter to inspect query output.
                        </div>
                      )}
                    </>
                  )}

                  {/* TAB 2: Verification Tests */}
                  {activeBottomTab === 'tests' && (
                    <div className="space-y-3">
                      {executionResult?.testResults ? (
                        <div className="border border-border rounded p-3 bg-surface space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {executionResult.testResults.passed ? (
                                <div className="flex items-center space-x-1.5 text-status-success font-medium text-xs">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>TESTS PASSED (100%)</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1.5 text-status-danger font-medium text-xs">
                                  <XCircle className="w-4 h-4" />
                                  <span>ASSERTION MISMATCH DETECTED</span>
                                </div>
                              )}
                            </div>

                            <div className="font-mono text-xs text-ink font-medium">
                              Estimated Score: {executionResult.testResults.scoreEstimate} / 100
                            </div>
                          </div>

                          <div className="text-xs text-ink-secondary font-mono bg-subtle p-2 rounded border border-border">
                            {executionResult.testResults.details}
                          </div>
                        </div>
                      ) : executionResult?.error ? (
                        <div className="p-3 bg-red-50 border border-status-danger/30 rounded text-xs">
                          <div className="text-status-danger font-medium mb-1">Execution Failure:</div>
                          <pre className="font-mono text-status-danger whitespace-pre-wrap">
                            {executionResult.error}
                          </pre>
                        </div>
                      ) : (
                        <div className="text-ink-secondary text-xs text-center py-6">
                          Run query to execute automated test assertions against reference calculations.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: Schema Inspector */}
                  {activeBottomTab === 'schema' && (
                    <div className="space-y-3 text-xs">
                      <div className="text-ink-secondary text-[11px] font-sans">
                        Live Tables in Sandbox Database (`sandbox_db`):
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {schemaTables.map((t, idx) => (
                          <div
                            key={idx}
                            className="border border-border rounded bg-surface overflow-hidden"
                          >
                            <div className="bg-subtle px-2.5 py-1 border-b border-border font-mono font-medium text-ink flex items-center justify-between">
                              <span>{t.name}</span>
                              <span className="text-[10px] text-ink-secondary font-normal font-sans">
                                {t.columns.length} columns
                              </span>
                            </div>
                            <div className="p-2 space-y-1 font-mono text-[11px]">
                              {t.columns.map((c: any, cIdx: number) => (
                                <div key={cIdx} className="flex items-center justify-between">
                                  <span className="text-ink">{c.name}</span>
                                  <span className="text-ink-secondary">{c.type}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
