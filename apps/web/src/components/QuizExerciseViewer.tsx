'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  RotateCcw,
  Send,
  Eye,
  Check,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizExerciseViewerProps {
  moduleId: string;
  weekNumber?: number;
  moduleTitle?: string;
  quizData: QuizQuestion[];
  studentId?: string;
  cohortId?: string;
  isTeacher?: boolean;
}

export default function QuizExerciseViewer({
  moduleId,
  weekNumber = 1,
  moduleTitle = 'Weekly Quiz',
  quizData = [],
  studentId,
  cohortId,
  isTeacher = false,
}: QuizExerciseViewerProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(isTeacher);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);

  // Fetch previous submission if studentId provided
  useEffect(() => {
    if (!moduleId || !studentId) {
      return;
    }

    setLoadingHistory(true);
    fetch(`/api/quiz/submissions?studentId=${studentId}&moduleId=${moduleId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.answers) {
          const parsedAnswers =
            typeof data.answers === 'string'
              ? JSON.parse(data.answers)
              : data.answers;
          if (parsedAnswers.answers) {
            setAnswers(parsedAnswers.answers);
          }
          setSubmissionResult({
            score: Number(data.score),
            correctCount: parsedAnswers.correctCount ?? Math.round((Number(data.score) / 100) * quizData.length),
            totalCount: parsedAnswers.totalQuestions ?? quizData.length,
            passed: Number(data.score) >= 70,
            feedback: parsedAnswers.feedback || [],
          });
          setSubmitted(true);
        } else {
          setSubmitted(false);
          setAnswers({});
          setSubmissionResult(null);
        }
      })
      .catch((err) => console.error('Error fetching quiz history:', err))
      .finally(() => setLoadingHistory(false));
  }, [moduleId, studentId, quizData.length]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (submitted && !isTeacher) return; // Prevent changing after submit unless retaking
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (isSubmitting || quizData.length === 0) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          studentId,
          cohortId,
          answers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit quiz');
      }

      setSubmissionResult(data);
      setSubmitted(true);
    } catch (err) {
      console.error('Quiz submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetakeQuiz = () => {
    setAnswers({});
    setSubmitted(false);
    setSubmissionResult(null);
  };

  if (loadingHistory && studentId) {
    return (
      <div className="p-8 text-center text-xs text-ink-secondary bg-surface border border-border rounded-lg">
        Loading quiz status...
      </div>
    );
  }

  if (!quizData || quizData.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-ink-secondary bg-surface border border-border rounded-lg">
        No quiz questions configured for this week yet.
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === quizData.length;

  return (
    <div
      data-testid="quiz-exercise-viewer"
      className="flex flex-col h-full bg-surface border border-border rounded-lg overflow-hidden font-sans"
    >
      {/* Top Header Toolbar */}
      <div className="p-3 sm:p-4 border-b border-border bg-subtle/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div>
          <div className="flex items-center space-x-2 mb-0.5">
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-subtle border border-border rounded text-ink font-medium">
              Week {weekNumber} Practice
            </span>
            <span className="text-xs font-semibold text-ink">
              Knowledge Verification & Quiz
            </span>
          </div>
          <p className="text-[11px] text-ink-secondary">
            {quizData.length} interactive questions covering fundamental modeling, rules, and PostgreSQL concepts.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {isTeacher && (
            <button
              onClick={() => setShowAnswerKey(!showAnswerKey)}
              data-testid="toggle-answer-key-btn"
              className={`px-2.5 py-1 text-xs rounded border transition-colors flex items-center space-x-1 ${
                showAnswerKey
                  ? 'bg-zinc-900 text-white border-zinc-900 font-medium'
                  : 'bg-surface border-border text-ink hover:bg-subtle'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showAnswerKey ? 'Hide Answer Key' : 'Reveal Answer Key'}</span>
            </button>
          )}

          {submitted && (
            <button
              onClick={handleRetakeQuiz}
              data-testid="retake-quiz-btn"
              className="px-2.5 py-1 text-xs bg-surface border border-border rounded text-ink hover:bg-subtle transition-colors flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </button>
          )}
        </div>
      </div>

      {/* Quiz Score Summary Banner (Shown after submit) */}
      {submitted && submissionResult && (
        <div
          data-testid="quiz-score-banner"
          className={`p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none ${
            submissionResult.passed
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-amber-50/70 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                submissionResult.passed
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 text-white'
              }`}
            >
              {submissionResult.score}%
            </div>
            <div>
              <div className="text-xs font-semibold">
                {submissionResult.passed
                  ? 'Passed! Conceptual Mastery Verified'
                  : 'Review Needed: Revisit Lecture Slides'}
              </div>
              <div className="text-[11px] opacity-80">
                You answered {submissionResult.correctCount} of {submissionResult.totalCount} questions correctly.
              </div>
            </div>
          </div>

          <span
            data-testid="quiz-status-badge"
            className={`text-xs font-mono font-medium px-2 py-0.5 rounded border uppercase ${
              submissionResult.passed
                ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                : 'bg-amber-100 border-amber-300 text-amber-800'
            }`}
          >
            {submissionResult.passed ? 'Verified Pass' : 'Try Again'}
          </span>
        </div>
      )}

      {/* Main Questions List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {quizData.map((q, qIndex) => {
          const selectedOption = answers[q.id];
          const isAnswered = selectedOption !== undefined;
          const isCorrect = isAnswered && Number(selectedOption) === Number(q.correctIndex);
          const feedbackItem = submissionResult?.feedback?.find((f: any) => f.questionId === q.id);

          return (
            <div
              key={q.id || qIndex}
              data-testid={`quiz-question-card-${qIndex + 1}`}
              className={`p-4 sm:p-5 rounded-lg border transition-all ${
                submitted
                  ? isCorrect
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-red-300 bg-red-50/20'
                  : 'border-border bg-surface'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-2">
                  <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-subtle border border-border text-ink shrink-0 mt-0.5">
                    Q{qIndex + 1}
                  </span>
                  <h3 className="text-xs sm:text-sm font-semibold text-ink leading-snug">
                    {q.question}
                  </h3>
                </div>

                {/* Status Indicator Badge */}
                {submitted && (
                  <span
                    data-testid={`q-status-${qIndex + 1}`}
                    className={`shrink-0 ml-2 text-[11px] font-medium flex items-center space-x-1 ${
                      isCorrect ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 fill-emerald-100 text-emerald-600" />
                        <span>Correct</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 fill-red-100 text-red-600" />
                        <span>Incorrect</span>
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Multiple Choice Options */}
              <div className="space-y-2 mt-3">
                {q.options.map((opt, optIndex) => {
                  const isSelected = selectedOption === optIndex;
                  const isThisCorrect = Number(q.correctIndex) === optIndex;
                  const shouldHighlightCorrect = (submitted || showAnswerKey) && isThisCorrect;
                  const shouldHighlightWrong = submitted && isSelected && !isThisCorrect;

                  let optionStyle = 'border-border bg-surface text-ink hover:bg-subtle/50';

                  if (shouldHighlightCorrect) {
                    optionStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-medium ring-1 ring-emerald-500';
                  } else if (shouldHighlightWrong) {
                    optionStyle = 'border-red-500 bg-red-50/70 text-red-950 font-medium';
                  } else if (isSelected) {
                    optionStyle = 'border-ink bg-subtle text-ink font-medium';
                  }

                  return (
                    <div
                      key={optIndex}
                      onClick={() => handleSelectOption(q.id, optIndex)}
                      data-testid={`option-${qIndex + 1}-${optIndex}`}
                      className={`p-2.5 sm:p-3 rounded border text-xs cursor-pointer flex items-center justify-between transition-colors ${optionStyle}`}
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className={`w-5 h-5 rounded-full border text-[11px] font-mono flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-ink text-white border-ink'
                              : shouldHighlightCorrect
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'border-border bg-white text-ink-secondary'
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span className="leading-relaxed">{opt}</span>
                      </div>

                      {shouldHighlightCorrect && (
                        <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold shrink-0 ml-2">
                          Correct Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Callout (Shown when submitted or teacher view) */}
              {(submitted || showAnswerKey) && (
                <div
                  data-testid={`explanation-${qIndex + 1}`}
                  className="mt-3 p-3 bg-zinc-50 border border-border rounded text-xs text-ink leading-relaxed space-y-1"
                >
                  <div className="flex items-center space-x-1.5 font-semibold text-ink-secondary text-[11px] uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5 text-ink" />
                    <span>Pedagogical Explanation:</span>
                  </div>
                  <p className="text-zinc-700 pl-5">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky Action Footer */}
      {!submitted && (
        <div className="p-3 border-t border-border bg-subtle/50 flex items-center justify-between shrink-0">
          <div className="text-xs text-ink-secondary">
            <span>
              {answeredCount} of {quizData.length} answered
            </span>
            {!isComplete && (
              <span className="text-amber-700 ml-2">• Answer all questions to submit</span>
            )}
          </div>

          <button
            onClick={handleSubmitQuiz}
            disabled={!isComplete || isSubmitting}
            data-testid="submit-quiz-btn"
            className="px-4 py-2 text-xs bg-ink text-white rounded font-medium hover:bg-ink-secondary transition-colors flex items-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Verifying...' : 'Submit Quiz & Check Answers'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
