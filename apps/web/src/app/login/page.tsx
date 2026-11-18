'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database, ShieldCheck, GraduationCap, ArrowRight, AlertCircle, UserPlus, LogIn, Check } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentIdCode, setStudentIdCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Quick Demo Accounts
  const demoAccounts = [
    { label: 'Lead Teacher', name: 'Prof. Alan Smith', email: 'prof.smith@uni.edu', role: 'teacher' },
    { label: 'Teaching Assistant', name: 'Sarah Jenkins (TA)', email: 'ta.sarah@uni.edu', role: 'ta' },
    { label: 'Student A', name: 'Sokha Chan (STU-001)', email: 'sokha.c@uni.edu', role: 'student' },
    { label: 'Student B', name: 'Dara Vong (STU-002)', email: 'dara.v@uni.edu', role: 'student' },
  ];

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    const loginEmail = customEmail || email;
    const loginPassword = customPassword || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Success -> Redirect to Home
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          studentIdCode: studentIdCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    handleLogin(undefined, demoEmail, 'Password123!');
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-subtle">
      {/* Brand & Subtitle */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-surface border border-border rounded-full shadow-xs">
          <Database className="w-4 h-4 text-ink" />
          <span className="text-xs font-semibold tracking-tight text-ink">
            DB Analytics
          </span>
          <span className="text-[11px] text-ink-secondary">/ Business Analytics LMS</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-ink font-sans">
          {mode === 'login' ? 'Sign in to your account' : 'Student Course Enrollment'}
        </h2>
        <p className="text-xs text-ink-secondary">
          PostgreSQL Database Design & Business Intelligence Learning Platform
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-surface py-7 px-6 border border-border rounded-lg shadow-xs space-y-5">
          {/* Error Message */}
          {error && (
            <div
              data-testid="auth-error-banner"
              className="p-3 bg-red-50 border border-status-danger/30 rounded text-xs text-status-danger flex items-start space-x-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  data-testid="input-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@uni.edu"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong font-sans"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-ink">
                    Password
                  </label>
                  <span className="text-[11px] text-ink-secondary font-mono">
                    Default: Password123!
                  </span>
                </div>
                <input
                  type="password"
                  required
                  data-testid="input-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                data-testid="login-submit-btn"
                className="w-full py-2 px-4 bg-ink text-white rounded text-xs font-medium hover:bg-ink-secondary transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  data-testid="register-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  University Student ID (optional)
                </label>
                <input
                  type="text"
                  data-testid="register-student-id"
                  value={studentIdCode}
                  onChange={(e) => setStudentIdCode(e.target.value)}
                  placeholder="e.g. STU-2026-006"
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
                  data-testid="register-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@uni.edu"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Choose Password (min. 6 characters)
                </label>
                <input
                  type="password"
                  required
                  data-testid="register-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-xs text-ink focus:outline-none focus:border-border-strong font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                data-testid="register-submit-btn"
                className="w-full py-2 px-4 bg-ink text-white rounded text-xs font-medium hover:bg-ink-secondary transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Enrolling...' : 'Enroll & Create Account'}</span>
              </button>
            </form>
          )}

          {/* Toggle Login / Register */}
          <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
            {mode === 'login' ? (
              <>
                <span className="text-ink-secondary">New student enrolling?</span>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  data-testid="switch-to-register-btn"
                  className="text-ink font-medium hover:underline"
                >
                  Create Student Account
                </button>
              </>
            ) : (
              <>
                <span className="text-ink-secondary">Already registered?</span>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  data-testid="switch-to-login-btn"
                  className="text-ink font-medium hover:underline"
                >
                  Sign In to Existing Account
                </button>
              </>
            )}
          </div>

          {/* Quick Demo Accounts Selection */}
          <div className="pt-3 border-t border-border space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-secondary block">
              One-Click Demo Personas (Instant Access)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((d, idx) => (
                <button
                  key={idx}
                  type="button"
                  data-testid={`demo-login-${d.role}-${idx}`}
                  onClick={() => handleSelectDemo(d.email)}
                  className="p-2 text-left bg-subtle hover:bg-active border border-border rounded transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-semibold text-ink-secondary group-hover:text-ink">
                      {d.label}
                    </span>
                    <ArrowRight className="w-3 h-3 text-ink-secondary group-hover:text-ink transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="text-xs font-medium text-ink truncate mt-0.5">
                    {d.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
