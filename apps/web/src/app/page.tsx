'use client';

import React, { useState, useEffect } from 'react';
import Navigation, { UserProfile } from '@/components/Navigation';
import StudentWorkspace from '@/components/StudentWorkspace';
import StudentGradesView from '@/components/StudentGradesView';
import GradebookMatrix from '@/components/GradebookMatrix';
import CurriculumView from '@/components/CurriculumView';

export default function Home() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'workspace' | 'gradebook' | 'curriculum' | 'my-grades'>('workspace');
  const [cohortId, setCohortId] = useState<string>('a1b2c3d4-0000-1111-2222-333333333333');
  const [cohortCode, setCohortCode] = useState<string>('BA-2026-FALL-A');
  const [cohortStatus, setCohortStatus] = useState<string>('active');

  // Load authenticated session, users, and cohorts
  useEffect(() => {
    // 1. Fetch current authenticated session
    fetch('/api/auth/me')
      .then(async (res) => {
        if (!res.ok) {
          window.location.href = '/login';
          return;
        }
        const data = await res.json();
        setCurrentUser(data.user);
        if (data.user.role === 'teacher' || data.user.role === 'ta') {
          setActiveTab('gradebook');
        } else {
          setActiveTab('workspace');
        }
      })
      .catch(() => {
        window.location.href = '/login';
      });

    // 2. Fetch all users for switcher
    fetch('/api/users')
      .then((res) => res.json())
      .then((data: UserProfile[]) => {
        setUsers(data);
      })
      .catch((err) => console.error('Error fetching users:', err));

    // 3. Fetch cohorts
    fetch('/api/cohorts')
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setCohortId(data[0].id);
          setCohortCode(data[0].code);
          setCohortStatus(data[0].status);
        }
      })
      .catch((err) => console.error('Error fetching cohorts:', err));
  }, []);

  // When user switches role, update backend session & select role-appropriate default view
  const handleSelectUser = async (user: UserProfile) => {
    try {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: 'Password123!' }),
      });
    } catch {}

    setCurrentUser(user);
    if ((user.role === 'teacher' || user.role === 'ta') && (activeTab === 'workspace' || activeTab === 'my-grades')) {
      setActiveTab('gradebook');
    } else if (user.role === 'student' && (activeTab === 'gradebook' || activeTab === 'curriculum')) {
      setActiveTab('workspace');
    }
  };

  if (!currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-canvas text-xs text-ink-secondary">
        Initializing Database Analytics Environment...
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-canvas">
      {/* Top Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        users={users}
        onSelectUser={handleSelectUser}
        cohortCode={cohortCode}
        cohortStatus={cohortStatus}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 w-full overflow-hidden">
        {activeTab === 'workspace' && (
          <StudentWorkspace currentUser={currentUser} cohortId={cohortId} />
        )}
        {activeTab === 'my-grades' && (
          <StudentGradesView currentUser={currentUser} cohortId={cohortId} />
        )}
        {activeTab === 'gradebook' && (
          <GradebookMatrix
            cohortId={cohortId}
            onCohortStatusChange={(status) => setCohortStatus(status)}
          />
        )}
        {activeTab === 'curriculum' && <CurriculumView cohortId={cohortId} />}
      </main>
    </div>
  );
}
