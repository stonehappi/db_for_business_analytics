'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  X,
  Check,
  Download,
  Upload,
  Search,
  Trash2,
  Edit2,
  FileText,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Calendar,
  Lock,
} from 'lucide-react';
import { CohortClass } from './Navigation';
import { useDialog } from './Dialog';

export interface StudentRecord {
  id: string;
  student_id_code: string | null;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  enrolled_at?: string;
  cohort_id?: string;
  cohort_code?: string;
  cohort_name?: string;
  cohort_term?: string;
  enrollments?: Array<{
    cohort_id: string;
    cohort_code: string;
    cohort_name: string;
    term: string;
    enrolled_at: string;
  }>;
}

interface StudentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: CohortClass[];
  selectedCohortId: string;
  onSelectClass?: (cohortId: string) => void;
  onStudentsChanged?: () => void;
}

export default function StudentManagementModal({
  isOpen,
  onClose,
  classes,
  selectedCohortId,
  onSelectClass,
  onStudentsChanged,
}: StudentManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'roster' | 'add' | 'import'>('roster');
  const [currentCohortFilter, setCurrentCohortFilter] = useState<string>(selectedCohortId || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Student state
  const [addFullName, setAddFullName] = useState('');
  const [addStudentIdCode, setAddStudentIdCode] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('Password123!');
  const [addClassId, setAddClassId] = useState(selectedCohortId || (classes[0]?.id || ''));
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Import CSV state
  const [importClassId, setImportClassId] = useState(selectedCohortId || (classes[0]?.id || ''));
  const [importCsvText, setImportCsvText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    createdCount: number;
    updatedCount: number;
    enrolledCount: number;
    errors: string[];
  } | null>(null);

  // Edit Student state
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editStudentIdCode, setEditStudentIdCode] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const { confirm, alert: alertDialog } = useDialog();

  useEffect(() => {
    if (selectedCohortId) {
      setCurrentCohortFilter(selectedCohortId);
      setAddClassId(selectedCohortId);
      setImportClassId(selectedCohortId);
    }
  }, [selectedCohortId]);

  const fetchStudents = async () => {
    if (!isOpen) return;
    setIsLoading(true);
    setError(null);
    try {
      const cohortParam = currentCohortFilter ? currentCohortFilter : 'all';
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const res = await fetch(`/api/students?cohortId=${cohortParam}${searchParam}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch students');
      }
      const data = await res.json();
      setStudents(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching student roster');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen, currentCohortFilter, searchQuery]);

  // Handle Add Student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAdd(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: addFullName,
          studentIdCode: addStudentIdCode || undefined,
          email: addEmail,
          password: addPassword || 'Password123!',
          cohortId: addClassId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create student');
      }

      setSuccessMsg(`Student "${addFullName}" created and enrolled successfully!`);
      setAddFullName('');
      setAddStudentIdCode('');
      setAddEmail('');
      setAddPassword('Password123!');
      setActiveTab('roster');
      await fetchStudents();
      if (onStudentsChanged) onStudentsChanged();
    } catch (err: any) {
      setError(err.message || 'Error creating student');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Handle Edit Student
  const handleStartEdit = (student: StudentRecord) => {
    setEditingStudent(student);
    setEditFullName(student.full_name);
    setEditStudentIdCode(student.student_id_code || '');
    setEditEmail(student.email);
    setEditPassword('');
    setError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsSavingEdit(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editFullName,
          studentIdCode: editStudentIdCode || undefined,
          email: editEmail,
          password: editPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update student');
      }

      setEditingStudent(null);
      setSuccessMsg(`Student profile updated successfully.`);
      await fetchStudents();
      if (onStudentsChanged) onStudentsChanged();
    } catch (err: any) {
      setError(err.message || 'Error updating student');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Delete / Unenroll
  const handleDeleteStudent = async (student: StudentRecord) => {
    const isSpecificCohort = currentCohortFilter && currentCohortFilter !== 'all';
    const confirmTitle = isSpecificCohort
      ? 'Unenroll Student from Class Section'
      : 'Delete Student Account';
    const confirmMessage = isSpecificCohort
      ? `Are you sure you want to remove "${student.full_name}" from this class section? The student will remain registered in the system but will no longer appear in this cohort roster.`
      : `Are you sure you want to completely delete "${student.full_name}" (${student.student_id_code || student.email})? This action will permanently remove the student account and cannot be undone.`;

    const ok = await confirm({
      title: confirmTitle,
      message: confirmMessage,
      confirmText: isSpecificCohort ? 'Unenroll Student' : 'Delete Student',
      cancelText: 'Cancel',
      variant: 'danger',
      confirmTestId: 'confirm-delete-student-btn',
    });

    if (!ok) return;

    setError(null);
    try {
      const url = isSpecificCohort
        ? `/api/students/${student.id}?cohortId=${currentCohortFilter}`
        : `/api/students/${student.id}`;

      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove student');
      }

      setSuccessMsg(data.message || 'Student removed successfully');
      await fetchStudents();
      if (onStudentsChanged) onStudentsChanged();
    } catch (err: any) {
      setError(err.message || 'Error removing student');
      await alertDialog({
        title: 'Removal Failed',
        message: err.message || 'Error removing student',
        variant: 'danger',
      });
    }
  };

  // Handle CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  // Handle Import Submit
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importCsvText.trim()) {
      setError('Please select a CSV file or paste CSV text to import.');
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportResult(null);
    try {
      const res = await fetch('/api/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohortId: importClassId || undefined,
          csvText: importCsvText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import student roster');
      }

      setImportResult({
        createdCount: data.createdCount,
        updatedCount: data.updatedCount,
        enrolledCount: data.enrolledCount,
        errors: data.errors || [],
      });
      setSuccessMsg(data.message);
      setImportCsvText('');
      await fetchStudents();
      if (onStudentsChanged) onStudentsChanged();
    } catch (err: any) {
      setError(err.message || 'Error during roster import');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle Export Roster
  const handleExportRoster = () => {
    const cohortParam = currentCohortFilter ? currentCohortFilter : 'all';
    window.open(`/api/students/export?cohortId=${cohortParam}&format=csv`, '_blank');
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const templateContent =
      'student_id_code,full_name,email,password\r\n' +
      'STU-101,Johnathan Doe,john.doe@uni.edu,Password123!\r\n' +
      'STU-102,Jane Smith,jane.smith@uni.edu,Password123!\r\n' +
      'STU-103,Bopha Keo,bopha.k@uni.edu,Password123!\r\n';

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'student_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div
      data-testid="student-management-modal"
      className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans"
    >
      <div className="bg-surface border border-border rounded shadow-xl max-w-4xl w-full p-5 space-y-4 animate-in fade-in duration-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-subtle border border-border flex items-center justify-center text-ink">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">
                Student Roster & Cohort Management
              </h3>
              <p className="text-xs text-ink-secondary">
                Add students, manage class section enrollments, bulk import CSV rosters, and export student records.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="text-ink-secondary hover:text-ink p-1 rounded hover:bg-subtle"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action & Tab Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => {
                setActiveTab('roster');
                setEditingStudent(null);
              }}
              data-testid="tab-roster-view"
              className={`px-3 py-1.5 text-xs rounded font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'roster'
                  ? 'bg-ink text-white'
                  : 'bg-subtle hover:bg-active text-ink border border-border'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Student Roster</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('add');
                setEditingStudent(null);
                setError(null);
              }}
              data-testid="tab-add-student"
              className={`px-3 py-1.5 text-xs rounded font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'add'
                  ? 'bg-ink text-white'
                  : 'bg-subtle hover:bg-active text-ink border border-border'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Student</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('import');
                setEditingStudent(null);
                setError(null);
              }}
              data-testid="tab-import-students"
              className={`px-3 py-1.5 text-xs rounded font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'import'
                  ? 'bg-ink text-white'
                  : 'bg-subtle hover:bg-active text-ink border border-border'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportRoster}
              data-testid="btn-export-students"
              title="Export students to CSV"
              className="px-2.5 py-1.5 text-xs border border-border bg-white hover:bg-subtle text-ink rounded transition-colors flex items-center space-x-1 font-medium shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Alerts & Toasts */}
        {error && (
          <div
            data-testid="student-error-banner"
            className="p-3 bg-red-50 border border-status-danger/30 rounded text-xs text-status-danger flex items-start space-x-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            data-testid="student-success-banner"
            className="p-3 bg-green-50 border border-status-success/30 rounded text-xs text-status-success flex items-start space-x-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: Student Roster View */}
        {activeTab === 'roster' && !editingStudent && (
          <div className="flex-1 flex flex-col space-y-3 min-h-0 overflow-hidden">
            {/* Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2 flex-1 max-w-sm">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-ink-secondary" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, ID, or email..."
                    data-testid="search-students-input"
                    className="w-full pl-8 pr-3 py-1.5 bg-canvas border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-ink-secondary text-xs">Class Section:</span>
                <select
                  value={currentCohortFilter}
                  onChange={(e) => setCurrentCohortFilter(e.target.value)}
                  data-testid="filter-cohort-select"
                  className="bg-white border border-border rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-border-strong cursor-pointer font-mono"
                >
                  <option value="all">All Class Sections</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.code} ({cls.term})
                    </option>
                  ))}
                </select>
                <span className="px-2 py-1 bg-subtle border border-border rounded text-ink font-mono text-[11px]">
                  {students.length} students
                </span>
              </div>
            </div>

            {/* Students Table */}
            <div className="flex-1 overflow-auto border border-border rounded divide-y divide-border bg-white min-h-[260px]">
              <table className="w-full min-w-[640px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-subtle border-b border-border text-ink-secondary font-medium sticky top-0 z-10">
                    <th className="py-2 px-3 font-mono">Student ID</th>
                    <th className="py-2 px-3">Full Name</th>
                    <th className="py-2 px-3">University Email</th>
                    <th className="py-2 px-3">Enrolled Class Section</th>
                    <th className="py-2 px-3">Enrolled Date</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-ink-secondary">
                        Loading student records...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-ink-secondary">
                        No students found matching current filter or search criteria.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => {
                      const displayCohort = student.cohort_code
                        ? `${student.cohort_code} (${student.cohort_term})`
                        : student.enrollments && student.enrollments.length > 0
                        ? student.enrollments.map((e) => e.cohort_code).join(', ')
                        : 'Not Enrolled';

                      const dateStr = student.enrolled_at || student.created_at;
                      const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString() : '—';

                      return (
                        <tr
                          key={student.id}
                          data-testid={`student-row-${student.student_id_code || student.id}`}
                          className="hover:bg-subtle/40 transition-colors"
                        >
                          <td className="py-2 px-3 font-mono font-medium text-ink">
                            {student.student_id_code || '—'}
                          </td>
                          <td className="py-2 px-3 font-medium text-ink">
                            {student.full_name}
                          </td>
                          <td className="py-2 px-3 text-ink-secondary font-sans">
                            {student.email}
                          </td>
                          <td className="py-2 px-3">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-subtle border border-border text-[11px] font-mono text-ink">
                              {displayCohort}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-ink-secondary font-mono text-[11px]">
                            {formattedDate}
                          </td>
                          <td className="py-2 px-3 text-right space-x-1">
                            <button
                              onClick={() => handleStartEdit(student)}
                              data-testid={`btn-edit-student-${student.id}`}
                              className="p-1 hover:bg-subtle text-ink-secondary hover:text-ink rounded transition-colors"
                              title="Edit Student Profile"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student)}
                              data-testid={`btn-delete-student-${student.id}`}
                              className="p-1 hover:bg-red-50 text-ink-secondary hover:text-status-danger rounded transition-colors"
                              title={
                                currentCohortFilter !== 'all'
                                  ? 'Unenroll from this Class Section'
                                  : 'Delete Student Account'
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Add Student Form */}
        {activeTab === 'add' && !editingStudent && (
          <form
            onSubmit={handleAddStudent}
            data-testid="form-add-student"
            className="flex-1 overflow-y-auto space-y-4 max-w-xl mx-auto w-full p-2"
          >
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">
                Create & Enroll New Student
              </h4>
              <p className="text-xs text-ink-secondary">
                Enter student university credentials. The student will be granted access immediately with the initial password.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Full Name <span className="text-status-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  placeholder="e.g. Sokha Vong"
                  data-testid="input-student-name"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Student ID Code (University ID)
                </label>
                <input
                  type="text"
                  value={addStudentIdCode}
                  onChange={(e) => setAddStudentIdCode(e.target.value)}
                  placeholder="e.g. STU-2026-009"
                  data-testid="input-student-id-code"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  University Email <span className="text-status-danger">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="sokha.v@uni.edu"
                  data-testid="input-student-email"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Initial Password (min. 6 characters)
                </label>
                <input
                  type="text"
                  required
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  data-testid="input-student-password"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong font-mono"
                />
                <span className="text-[11px] text-ink-secondary mt-1 block">
                  Students will use this password to sign into their workspace.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Enroll Into Class Section
                </label>
                <select
                  value={addClassId}
                  onChange={(e) => setAddClassId(e.target.value)}
                  data-testid="select-student-class"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong font-mono cursor-pointer"
                >
                  <option value="">Do not enroll in a class yet</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.code} - {cls.name} ({cls.term})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setActiveTab('roster')}
                className="px-3 py-1.5 text-xs border border-border bg-white hover:bg-subtle text-ink rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingAdd}
                data-testid="btn-submit-add-student"
                className="px-4 py-1.5 text-xs bg-ink text-white rounded hover:bg-ink-secondary transition-colors font-medium flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmittingAdd ? 'Creating...' : 'Create Student'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Import CSV View */}
        {activeTab === 'import' && !editingStudent && (
          <form
            onSubmit={handleImportSubmit}
            data-testid="form-import-students"
            className="flex-1 overflow-y-auto space-y-4 max-w-xl mx-auto w-full p-2"
          >
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">
                Bulk Import Students via CSV
              </h4>
              <p className="text-xs text-ink-secondary">
                Upload a CSV file or paste CSV text containing student roster rows. Existing students will be enrolled in the chosen class.
              </p>
            </div>

            <div className="p-3 bg-subtle border border-border rounded space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">CSV Format & Guidelines:</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  data-testid="btn-download-csv-template"
                  className="text-xs text-ink hover:underline flex items-center space-x-1 font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample Template</span>
                </button>
              </div>
              <p className="text-[11px] font-mono text-ink-secondary bg-white p-2 border border-border rounded">
                student_id_code,full_name,email,password
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Target Class Section
                </label>
                <select
                  value={importClassId}
                  onChange={(e) => setImportClassId(e.target.value)}
                  data-testid="select-import-class"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong font-mono cursor-pointer"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.code} - {cls.name} ({cls.term})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={handleFileUpload}
                  data-testid="input-csv-file"
                  className="w-full text-xs text-ink-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-border file:text-xs file:font-medium file:bg-subtle file:text-ink hover:file:bg-active cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Or Paste CSV Text Directly
                </label>
                <textarea
                  rows={6}
                  value={importCsvText}
                  onChange={(e) => setImportCsvText(e.target.value)}
                  placeholder="student_id_code,full_name,email,password&#10;STU-021,Alice Smith,alice.s@uni.edu,Password123!&#10;STU-022,Bob Jones,bob.j@uni.edu,Password123!"
                  data-testid="textarea-csv-import"
                  className="w-full p-2.5 bg-canvas border border-border rounded text-xs text-ink font-mono focus:outline-none focus:border-border-strong"
                />
              </div>
            </div>

            {importResult && (
              <div
                data-testid="import-results-box"
                className="p-3 bg-green-50 border border-green-200 rounded text-xs space-y-1"
              >
                <div className="font-semibold text-status-success flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Import Completed Successfully</span>
                </div>
                <div className="text-ink text-[11px] space-y-0.5">
                  <p>• Created new student accounts: <strong>{importResult.createdCount}</strong></p>
                  <p>• Updated existing accounts: <strong>{importResult.updatedCount}</strong></p>
                  <p>• Enrolled into class section: <strong>{importResult.enrolledCount}</strong></p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setActiveTab('roster')}
                className="px-3 py-1.5 text-xs border border-border bg-white hover:bg-subtle text-ink rounded transition-colors"
              >
                Back to Roster
              </button>
              <button
                type="submit"
                disabled={isImporting || !importCsvText.trim()}
                data-testid="btn-submit-import-csv"
                className="px-4 py-1.5 text-xs bg-ink text-white rounded hover:bg-ink-secondary transition-colors font-medium flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isImporting ? 'Importing Roster...' : 'Import Students'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Modal Sub-view: Edit Student */}
        {editingStudent && (
          <form
            onSubmit={handleSaveEdit}
            data-testid="form-edit-student"
            className="flex-1 overflow-y-auto space-y-4 max-w-xl mx-auto w-full p-2"
          >
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">
                Edit Student Profile
              </h4>
              <p className="text-xs text-ink-secondary">
                Update account details or reset student password.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  data-testid="edit-student-name"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Student ID Code
                </label>
                <input
                  type="text"
                  value={editStudentIdCode}
                  onChange={(e) => setEditStudentIdCode(e.target.value)}
                  data-testid="edit-student-id-code"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  University Email
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  data-testid="edit-student-email"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Reset Password (optional, leave blank to keep existing)
                </label>
                <input
                  type="password"
                  placeholder="New password (min. 6 chars)"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  data-testid="edit-student-password"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-3 py-1.5 text-xs border border-border bg-white hover:bg-subtle text-ink rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                data-testid="btn-save-edit-student"
                className="px-4 py-1.5 text-xs bg-ink text-white rounded hover:bg-ink-secondary transition-colors font-medium flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-ink-secondary">
          <span>Teacher Administration & Student Provisioning</span>
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
