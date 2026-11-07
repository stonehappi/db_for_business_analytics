'use client';

import React, { useState, useEffect } from 'react';
import Navigation, { UserProfile } from '@/components/Navigation';
import StudentWorkspace from '@/components/StudentWorkspace';
import GradebookMatrix from '@/components/GradebookMatrix';
import CurriculumView from '@/components/CurriculumView';

export default function Home() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'workspace' | 'gradebook' | 'curriculum'>('workspace');
  const [cohortId, setCohortId] = useState<string>('a1b2c3d4-0000-1111-2222-333333333333');
  const [cohortCode, setCohortCode] = useState<string>('BA-2026-FALL-A');
  const [cohortStatus, setCohortStatus] = useState<string>('active');

  // Load users and cohorts
  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data: UserProfile[]) => {
        setUsers(data);
        if (data.length > 0) {
          // Default to student (Sokha Chan) or teacher
          const defaultUser = data.find((u) => u.role === 'student') || data[0];
          setCurrentUser(defaultUser);
        }
      })
      .catch((err) => console.error('Error fetching users:', err));

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

  // When user switches, adjust default tab appropriately
  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'teacher' && activeTab === 'workspace') {
      setActiveTab('gradebook');
    } else if (user.role === 'student' && activeTab !== 'workspace') {
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
