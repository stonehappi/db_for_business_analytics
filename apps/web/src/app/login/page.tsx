'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Database, ShieldCheck, AlertCircle, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleLogin = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    let loginEmail = email;
    let loginPassword = password;

    if (e && e.currentTarget) {
      const formData = new FormData(e.currentTarget);
      const formEmail = formData.get('email') as string;
      const formPassword = formData.get('password') as string;
      if (formEmail) loginEmail = formEmail;
      if (formPassword) loginPassword = formPassword;
    }

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

      // Success -> Redirect to Home or deep link redirect param
      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get('redirect') || '/';
      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
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
          Sign in to your account
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
          <form onSubmit={handleLogin} data-hydrated={hydrated} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
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
              </div>
              <input
                type="password"
                name="password"
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

          {/* Registration Notice (Self-Registration Disabled) */}
          <div
            data-testid="registration-closed-notice"
            className="p-3 bg-subtle border border-border rounded text-xs text-ink-secondary flex items-start space-x-2.5"
          >
            <ShieldCheck className="w-4 h-4 text-ink shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-medium text-ink block">Student self-registration is closed</span>
              <p className="text-[11px] leading-relaxed text-ink-secondary">
                Student accounts are provisioned and managed directly by course instructors. Contact your teacher to be enrolled.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
