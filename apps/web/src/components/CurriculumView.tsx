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
  Tv,
  HelpCircle,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  Edit2,
  Sparkles,
  Trash2,
  X,
  Check,
} from 'lucide-react';

import { CohortClass } from './Navigation';
import LectureSlideViewer from './LectureSlideViewer';
import QuizExerciseViewer from './QuizExerciseViewer';
import { Dialog, useDialog } from './Dialog';

interface CurriculumViewProps {
  cohortId: string;
  courseId?: string;
  classes?: CohortClass[];
}

export default function CurriculumView({ cohortId, courseId, classes = [] }: CurriculumViewProps) {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [activeContentTab, setActiveContentTab] = useState<'lecture' | 'quiz' | 'project'>('project');
  const [showMobileDetail, setShowMobileDetail] = useState<boolean>(false);
  const [publishModalAssignment, setPublishModalAssignment] = useState<any>(null);
  const [targetCohortId, setTargetCohortId] = useState<string>(cohortId);
  const [dueDate, setDueDate] = useState<string>('2026-12-15T23:59');
  const [weightOverride, setWeightOverride] = useState<number | ''>('');
  const [publishSuccess, setPublishSuccess] = useState<boolean>(false);

  // Edit Week Metadata state
  const [showEditWeekModal, setShowEditWeekModal] = useState<boolean>(false);
  const [editWeekTitle, setEditWeekTitle] = useState<string>('');
  const [editWeekDesc, setEditWeekDesc] = useState<string>('');
  const [isSavingWeek, setIsSavingWeek] = useState<boolean>(false);

  // Auto-generate 16 weeks state
  const [isGeneratingWeeks, setIsGeneratingWeeks] = useState<boolean>(false);
  const [generateMsg, setGenerateMsg] = useState<string | null>(null);

  const { confirm, alert } = useDialog();

  useEffect(() => {
    if (cohortId) {
      setTargetCohortId(cohortId);
    }
  }, [cohortId]);

  const fetchModules = async () => {
    try {
      const url = courseId ? `/api/master/modules?courseId=${courseId}` : '/api/master/modules';
      const res = await fetch(url);
      const data = await res.json();
      setModules(data);

      if (data.length > 0) {
        setSelectedModuleId(data[0].id);
        if (data[0].assignments?.length > 0) {
          setSelectedAssignment(data[0].assignments[0]);
        } else {
          const firstWithAssign = data.find((m: any) => m.assignments?.length > 0);
          setSelectedAssignment(firstWithAssign ? firstWithAssign.assignments[0] : null);
        }
      } else {
        setSelectedModuleId('');
        setSelectedAssignment(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [courseId]);

  const handlePublish = async () => {
    if (!publishModalAssignment) return;
    const destCohortId = targetCohortId || cohortId;
    try {
      await fetch(`/api/cohorts/${destCohortId}/publish`, {
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

  const handleSaveLectureHtml = async (newHtml: string) => {
    if (!selectedModuleId) return;
    const res = await fetch('/api/master/modules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedModuleId,
        lectureSlidesHtml: newHtml,
      }),
    });
    if (res.ok) {
      setModules((prev) =>
        prev.map((m) => (m.id === selectedModuleId ? { ...m, lectureSlidesHtml: newHtml } : m))
      );
    }
  };

  // Open Edit Week Modal
  const handleOpenEditWeek = () => {
    if (!selectedModule) return;
    setEditWeekTitle(selectedModule.title);
    setEditWeekDesc(selectedModule.description || '');
    setShowEditWeekModal(true);
  };

  // Save Week Metadata
  const handleSaveWeekInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleId) return;
    setIsSavingWeek(true);
    try {
      const res = await fetch('/api/master/modules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedModuleId,
          title: editWeekTitle,
          description: editWeekDesc,
        }),
      });
      if (res.ok) {
        setModules((prev) =>
          prev.map((m) =>
            m.id === selectedModuleId
              ? { ...m, title: editWeekTitle, description: editWeekDesc }
              : m
          )
        );
        setShowEditWeekModal(false);
      }
    } catch (err) {
      console.error('Error saving week info:', err);
    } finally {
      setIsSavingWeek(false);
    }
  };

  // Auto-generate 16 Weeks
  const handleAutoGenerate16Weeks = async () => {
    if (!courseId) {
      await alert({
        title: 'Select a Course',
        message: 'Please select a Master Course first before generating the 16-week syllabus.',
      });
      return;
    }

    const confirmed = await confirm({
      title: 'Auto-Generate 16-Week Syllabus?',
      message:
        'This will populate all 16 weeks of structured curriculum, interactive lecture slides, quizzes, and project milestones for this course.',
      confirmText: 'Generate 16 Weeks',
      confirmTestId: 'confirm-auto-generate-btn',
    });

    if (!confirmed) return;

    setIsGeneratingWeeks(true);
    setGenerateMsg(null);
    try {
      const res = await fetch('/api/master/modules/generate-16-weeks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (res.ok) {
        setGenerateMsg(`Generated ${data.moduleCount} weeks!`);
        await fetchModules();
        setTimeout(() => setGenerateMsg(null), 3000);
      } else {
        await alert({ title: 'Error', message: data.error || 'Failed to generate weeks' });
      }
    } catch (err: any) {
      await alert({ title: 'Error', message: err.message || 'Error generating weeks' });
    } finally {
      setIsGeneratingWeeks(false);
    }
  };

  const selectedModule = modules.find((m) => m.id === selectedModuleId) || modules[0];

  if (loading) {
    return (
      <div className="h-[calc(100vh-3rem)] flex items-center justify-center text-xs text-ink-secondary">
        Loading master 16-week curriculum...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col lg:flex-row bg-canvas overflow-hidden font-sans">
      {/* LEFT: 16-Week Syllabus Explorer (Width: 32%) */}
      <div
        className={`${
          showMobileDetail ? 'hidden' : 'flex'
        } lg:flex w-full lg:w-[32%] lg:min-w-[320px] lg:max-w-[460px] h-full border-r border-border bg-surface flex-col shrink-0`}
      >
        <div className="p-3 border-b border-border bg-subtle/50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-ink" />
            <span className="text-xs font-semibold text-ink uppercase tracking-wider">
              16-Week Master Syllabus
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-ink-secondary">
              {modules.length} Weeks
            </span>
            <button
              onClick={handleAutoGenerate16Weeks}
              disabled={isGeneratingWeeks}
              data-testid="btn-auto-generate-16-weeks"
              title="Auto-Generate 16 Weeks of Syllabus Content"
              className="px-2 py-0.5 text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded font-medium flex items-center space-x-1 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>{isGeneratingWeeks ? 'Generating...' : 'Auto 16-Wks'}</span>
            </button>
          </div>
        </div>

        {generateMsg && (
          <div className="px-3 py-1.5 bg-green-50 border-b border-green-200 text-status-success text-xs flex items-center space-x-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{generateMsg}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {modules.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-xs text-ink-secondary">
                No syllabus modules found for this course yet.
              </p>
              <button
                onClick={handleAutoGenerate16Weeks}
                disabled={isGeneratingWeeks}
                className="px-3 py-1.5 text-xs bg-ink text-white rounded hover:bg-ink-secondary transition-colors font-medium inline-flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Auto-Generate 16 Weeks</span>
              </button>
            </div>
          ) : (
            modules.map((m: any) => {
              const isSelected = selectedModule?.id === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedModuleId(m.id);
                    if (m.assignments && m.assignments.length > 0) {
                      setSelectedAssignment(m.assignments[0]);
                    }
                    setShowMobileDetail(true);
                  }}
                  className={`p-3 space-y-2 cursor-pointer transition-colors ${
                    isSelected ? 'bg-subtle/60 border-l-2 border-l-zinc-900' : 'hover:bg-subtle/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="text-xs font-semibold text-ink flex items-center space-x-1.5">
                        <span className="font-mono text-[11px] px-1 py-0.2 bg-subtle border border-border rounded shrink-0">
                          W{m.weekNumber}
                        </span>
                        <span className="truncate">{m.title}</span>
                      </div>
                      <div className="text-[11px] text-ink-secondary mt-0.5 line-clamp-1">
                        {m.description}
                      </div>
                    </div>
                  </div>

                  {/* 3 Pillars Quick Badges: Lecture, Quiz, Project */}
                  <div className="flex items-center space-x-1.5 pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModuleId(m.id);
                        setActiveContentTab('lecture');
                        setShowMobileDetail(true);
                      }}
                      data-testid={`badge-lecture-${m.weekNumber}`}
                      title="View HTML Lecture Slides"
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors flex items-center space-x-1 ${
                        isSelected && activeContentTab === 'lecture'
                          ? 'bg-zinc-900 text-white border-zinc-900 font-medium'
                          : 'bg-white border-border text-ink-secondary hover:text-ink hover:border-zinc-400'
                      }`}
                    >
                      <Tv className="w-2.5 h-2.5" />
                      <span>Slide</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModuleId(m.id);
                        setActiveContentTab('quiz');
                        setShowMobileDetail(true);
                      }}
                      data-testid={`badge-quiz-${m.weekNumber}`}
                      title="View Interactive Quiz & Exercises"
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors flex items-center space-x-1 ${
                        isSelected && activeContentTab === 'quiz'
                          ? 'bg-zinc-900 text-white border-zinc-900 font-medium'
                          : 'bg-white border-border text-ink-secondary hover:text-ink hover:border-zinc-400'
                      }`}
                    >
                      <HelpCircle className="w-2.5 h-2.5" />
                      <span>Quiz ({m.quizData?.length || 0})</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModuleId(m.id);
                        if (m.assignments && m.assignments.length > 0) {
                          setSelectedAssignment(m.assignments[0]);
                        }
                        setActiveContentTab('project');
                        setShowMobileDetail(true);
                      }}
                      data-testid={`badge-project-${m.weekNumber}`}
                      title="View Hands-on Project & Case Study"
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors flex items-center space-x-1 ${
                        isSelected && activeContentTab === 'project'
                          ? 'bg-zinc-900 text-white border-zinc-900 font-medium'
                          : 'bg-white border-border text-ink-secondary hover:text-ink hover:border-zinc-400'
                      }`}
                    >
                      <Briefcase className="w-2.5 h-2.5" />
                      <span>Project</span>
                    </button>
                  </div>

                  {/* Nested Assignments (Projects) */}
                  {m.assignments && m.assignments.length > 0 && (
                    <div className="space-y-1 pl-3 border-l border-border mt-2">
                      {m.assignments.map((a: any) => (
                        <div
                          key={a.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedModuleId(m.id);
                            setSelectedAssignment(a);
                            setActiveContentTab('project');
                            setShowMobileDetail(true);
                          }}
                          className={`p-2 rounded text-xs cursor-pointer border transition-colors flex items-center justify-between ${
                            selectedAssignment?.id === a.id && activeContentTab === 'project'
                              ? 'bg-subtle border-border-strong text-ink font-medium'
                              : 'bg-surface border-border text-ink-secondary hover:text-ink'
                          }`}
                        >
                          <div className="truncate max-w-[210px]">
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
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Master Detail Canvas with Weekly Lecture / Quiz / Project Switcher */}
      <div
        className={`${
          showMobileDetail ? 'flex' : 'hidden'
        } lg:flex flex-1 h-full flex-col bg-surface overflow-hidden min-w-0`}
      >
        {selectedModule ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Week Control Header & 3 Pillar Tabs */}
            <div className="p-2.5 sm:p-3 border-b border-border bg-subtle/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
              <div className="flex items-center space-x-2 truncate pr-2 min-w-0">
                <button
                  onClick={() => setShowMobileDetail(false)}
                  className="lg:hidden p-1 hover:bg-subtle text-ink-secondary hover:text-ink rounded flex items-center space-x-0.5 text-xs shrink-0 border border-border bg-white"
                  title="Back to Syllabus List"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium pr-1">Syllabus</span>
                </button>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-subtle border border-border rounded text-ink font-medium shrink-0">
                  Week {selectedModule.weekNumber}
                </span>
                <h2 className="text-sm font-semibold text-ink truncate">
                  Topic: {selectedModule.title.replace(/^Week \d+:\s*/, '')}
                </h2>
                <button
                  onClick={handleOpenEditWeek}
                  title="Edit Week Title & Description"
                  data-testid="btn-edit-week-info"
                  className="p-1 text-ink-secondary hover:text-ink rounded hover:bg-subtle transition-colors shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 3 Pillar Tabs */}
              <div className="flex items-center bg-subtle p-0.5 rounded border border-border shrink-0 overflow-x-auto">
                <button
                  onClick={() => setActiveContentTab('lecture')}
                  data-testid="curriculum-tab-lecture"
                  className={`px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1.5 ${
                    activeContentTab === 'lecture'
                      ? 'bg-surface text-ink font-semibold shadow-2xs border border-border'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Lecture (Slides)</span>
                </button>

                <button
                  onClick={() => setActiveContentTab('quiz')}
                  data-testid="curriculum-tab-quiz"
                  className={`px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1.5 ${
                    activeContentTab === 'quiz'
                      ? 'bg-surface text-ink font-semibold shadow-2xs border border-border'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Exercise / Quiz</span>
                </button>

                <button
                  onClick={() => setActiveContentTab('project')}
                  data-testid="curriculum-tab-project"
                  className={`px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1.5 ${
                    activeContentTab === 'project'
                      ? 'bg-surface text-ink font-semibold shadow-2xs border border-border'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Project (Lab)</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT PANELS */}
            <div className="flex-1 overflow-hidden p-4">
              {activeContentTab === 'lecture' && (
                <div className="h-full">
                  <LectureSlideViewer
                    htmlContent={selectedModule.lectureSlidesHtml}
                    moduleTitle={selectedModule.title}
                    weekNumber={selectedModule.weekNumber}
                    isTeacher={true}
                    onSaveHtml={handleSaveLectureHtml}
                  />
                </div>
              )}

              {activeContentTab === 'quiz' && (
                <div className="h-full overflow-y-auto">
                  <QuizExerciseViewer
                    moduleId={selectedModule.id}
                    weekNumber={selectedModule.weekNumber}
                    moduleTitle={selectedModule.title}
                    quizData={selectedModule.quizData || []}
                    isTeacher={true}
                  />
                </div>
              )}

              {activeContentTab === 'project' && (
                <div className="h-full overflow-y-auto">
                  {selectedAssignment ? (
                    <div className="space-y-6 w-full pb-10">
                      {/* Header Toolbar */}
                      <div className="flex items-start justify-between border-b border-border pb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-[11px] font-mono uppercase px-2 py-0.5 bg-subtle border border-border rounded text-ink font-medium">
                              {selectedAssignment.type?.replace('_', ' ')}
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
                          <pre className="p-3 bg-subtle border border-border rounded text-xs font-mono text-ink overflow-x-auto">
                            {selectedAssignment.solutionSql}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-ink-secondary">
                      <Briefcase className="w-6 h-6 mb-2 opacity-50" />
                      <span>No project assignments configured for Week {selectedModule.weekNumber}.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-ink-secondary">
            Select a week module from the syllabus to view its lecture slides, quiz, or project.
          </div>
        )}
      </div>

      {/* EDIT WEEK INFO MODAL */}
      {showEditWeekModal && selectedModule && (
        <Dialog
          isOpen={showEditWeekModal}
          onClose={() => setShowEditWeekModal(false)}
          title={`Edit Week ${selectedModule.weekNumber} Content`}
          footer={
            <>
              <button
                onClick={() => setShowEditWeekModal(false)}
                className="px-3 py-1.5 text-xs text-ink-secondary hover:text-ink rounded hover:bg-subtle transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWeekInfo}
                disabled={isSavingWeek}
                data-testid="save-week-info-btn"
                className="px-3 py-1.5 text-xs bg-ink text-white rounded hover:bg-ink-secondary transition-colors font-medium"
              >
                {isSavingWeek ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          }
        >
          <div className="space-y-3 font-sans">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Week Title
              </label>
              <input
                type="text"
                value={editWeekTitle}
                onChange={(e) => setEditWeekTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Week Description & Learning Objectives
              </label>
              <textarea
                rows={4}
                value={editWeekDesc}
                onChange={(e) => setEditWeekDesc(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong font-sans"
              />
            </div>
          </div>
        </Dialog>
      )}

      {/* PUBLISH TO COHORT MODAL */}
      {publishModalAssignment && (
        <Dialog
          isOpen={true}
          onClose={() => setPublishModalAssignment(null)}
          title="Publish Assignment to Class Cohort"
          footer={
            <>
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
                className="px-3 py-1.5 text-xs bg-ink text-white rounded hover:bg-ink-secondary transition-colors flex items-center space-x-1.5 disabled:opacity-50 font-medium shadow-2xs"
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
            </>
          }
        >
          <div className="space-y-3 font-sans">
            <div className="text-xs text-ink-secondary">
              Deploying <span className="font-semibold text-ink">{publishModalAssignment.title}</span> to the selected cohort.
            </div>

            <div className="space-y-3">
              {classes.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Target Class / Semester Cohort
                  </label>
                  <select
                    value={targetCohortId}
                    onChange={(e) => setTargetCohortId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-border rounded text-xs font-mono text-ink focus:outline-none focus:border-border-strong cursor-pointer"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.code} - {cls.name} ({cls.term})
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
          </div>
        </Dialog>
      )}
    </div>
  );
}
