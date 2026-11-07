'use client';

import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, Clock, FileText, MessageSquare, AlertCircle } from 'lucide-react';
import { UserProfile } from './Navigation';

interface StudentGradesViewProps {
  currentUser: UserProfile;
  cohortId: string;
}

export default function StudentGradesView({
  currentUser,
  cohortId,
}: StudentGradesViewProps) {
  const [gradebookData, setGradebookData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [studentSubmissions, setStudentSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch gradebook to get current student's calculated score
        const gbRes = await fetch(`/api/cohorts/${cohortId}/gradebook`);
        const gbData = await gbRes.json();
        setGradebookData(gbData);

        // Fetch submissions for this student
        const qRes = await fetch(`/api/cohorts/${cohortId}/grading-queue`);
        const qData = await qRes.json();
        const studentOnly = qData.filter((s: any) => s.student_id === currentUser.id);
        setStudentSubmissions(studentOnly);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [cohortId, currentUser.id]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-3rem)] flex items-center justify-center text-xs text-ink-secondary">
        Loading your grade report...
      </div>
    );
  }

  const studentGradeRow = gradebookData?.grades?.find(
    (g: any) => g.student_uuid === currentUser.id
  );
  const assignments: any[] = gradebookData?.assignments || [];
  const breakdown = studentGradeRow?.assignment_breakdown || {};

  return (
    <div className="h-[calc(100vh-3rem)] overflow-y-auto p-6 bg-canvas font-sans select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Student Profile & Summary Header */}
        <div className="bg-surface border border-border rounded-lg p-5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-ink">
                {currentUser.full_name}
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 bg-subtle border border-border rounded text-ink-secondary">
                {currentUser.student_id_code || 'Enrolled Student'}
              </span>
            </div>
            <p className="text-xs text-ink-secondary">
              Cohort: {gradebookData?.cohort?.name} ({gradebookData?.cohort?.code}) • Term: {gradebookData?.cohort?.term}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="text-[11px] text-ink-secondary uppercase block font-medium">
                Current Weighted Score
              </span>
              <span className="text-xl font-mono font-bold text-ink">
                {studentGradeRow?.total_weighted_score ? `${Number(studentGradeRow.total_weighted_score).toFixed(2)}%` : '--'}
              </span>
            </div>

            <div className="w-[1px] h-10 bg-border" />

            <div className="text-center min-w-[60px]">
              <span className="text-[11px] text-ink-secondary uppercase block font-medium">
                Grade
              </span>
              <span className="text-xl font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 text-white">
                {studentGradeRow?.letter_grade || 'In Progress'}
              </span>
            </div>
          </div>
        </div>

        {/* Assignment Scores Breakdown Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-ink uppercase tracking-wider flex items-center space-x-2">
              <Award className="w-4 h-4 text-ink" />
              <span>Assignment Scores & Grade Contributions</span>
            </h3>
            <span className="text-[11px] text-ink-secondary font-mono">
              100% Total Syllabus Weight
            </span>
          </div>

          <div className="border border-border rounded bg-surface overflow-hidden">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead className="bg-subtle text-ink font-medium border-b border-border">
                <tr>
                  <th className="p-3 border-r border-border">Assignment</th>
                  <th className="p-3 border-r border-border text-center">Type</th>
                  <th className="p-3 border-r border-border text-center">Weight</th>
                  <th className="p-3 border-r border-border text-center">Raw Score</th>
                  <th className="p-3 border-r border-border text-center">Weighted Pts</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => {
                  const item = breakdown[a.slug];
                  const hasSubmitted = item !== undefined && item.raw_score !== null;

                  return (
                    <tr
                      key={a.cohort_assignment_id}
                      className="border-b border-border last:border-b-0 hover:bg-subtle/30 tabular-nums transition-colors"
                    >
                      <td className="p-3 border-r border-border font-sans font-medium text-ink">
                        {a.title}
                      </td>
                      <td className="p-3 border-r border-border text-center uppercase text-[10px] text-ink-secondary">
                        {a.type.replace('_', ' ')}
                      </td>
                      <td className="p-3 border-r border-border text-center">
                        {Number(a.weight_percentage)}%
                      </td>
                      <td className="p-3 border-r border-border text-center font-medium">
                        {hasSubmitted ? `${Number(item.raw_score).toFixed(1)} / ${a.max_score}` : '--'}
                      </td>
                      <td className="p-3 border-r border-border text-center font-semibold text-ink">
                        {hasSubmitted ? `${Number(item.weighted_points).toFixed(2)} pts` : '0.00 pts'}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                            item?.execution_status === 'graded' || item?.execution_status === 'verified_pass'
                              ? 'bg-green-50 text-status-success border border-status-success/30'
                              : item?.execution_status === 'verified_fail'
                              ? 'bg-amber-50 text-amber-700 border border-amber-300'
                              : 'bg-subtle text-ink-secondary'
                          }`}
                        >
                          {item?.execution_status || 'Not Submitted'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instructor Feedback & Submissions Detail */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-ink uppercase tracking-wider flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-ink" />
            <span>Instructor Line-Item Feedback</span>
          </h3>

          <div className="space-y-3">
            {studentSubmissions.length > 0 ? (
              studentSubmissions.map((sub, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-surface border border-border rounded-lg space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="font-semibold text-ink">{sub.assignment_title}</span>
                    <div className="flex items-center space-x-2 text-[11px] font-mono text-ink-secondary">
                      <span>Score: {sub.final_score ?? sub.verification_score} / {sub.max_score}</span>
                      <span>•</span>
                      <span>Version {sub.version}</span>
                    </div>
                  </div>

                  {sub.teacher_feedback ? (
                    <div className="p-3 bg-subtle rounded border border-border text-ink font-sans leading-relaxed">
                      <span className="text-[10px] uppercase font-semibold text-ink-secondary block mb-1">
                        Instructor Comment:
                      </span>
                      {sub.teacher_feedback}
                    </div>
                  ) : (
                    <div className="text-ink-secondary italic font-sans">
                      Automated tests passed. No written feedback provided yet.
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 bg-surface border border-border rounded text-center text-xs text-ink-secondary">
                No submissions or instructor feedback recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
