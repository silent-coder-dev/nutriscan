'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { saveSession, getSession, getRedirectTarget, getGuestScans, clearGuestScans } from '@/lib/auth';
import { login, errorMessage, ApiError } from '@/lib/api';
import { sanitizeInput } from '@/lib/security';
import AuthShell from '../components/AuthShell';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

export default function LoginPage() {
  const router = useRouter();

  // Already signed in: skip this page
  useEffect(() => {
    if (getSession()) router.replace(getRedirectTarget());
  }, [router]);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple client-side brute-force throttle; unlocks after 30 seconds
  const [failedAttempts, setFailedAttempts] = useState(0);
  const unlockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLocked = failedAttempts >= MAX_ATTEMPTS;

  useEffect(() => () => {
    if (unlockTimer.current) clearTimeout(unlockTimer.current);
  }, []);

  const recordFailure = () => {
    const next = failedAttempts + 1;
    setFailedAttempts(next);
    if (next >= MAX_ATTEMPTS && !unlockTimer.current) {
      unlockTimer.current = setTimeout(() => {
        unlockTimer.current = null;
        setFailedAttempts(0);
        setError(null);
      }, LOCKOUT_MS);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setError('Too many failed attempts. Please wait 30 seconds.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await login(sanitizeInput(identifier).toLowerCase(), password, getGuestScans());
      clearGuestScans(); // migrated server-side
      saveSession(data.token, data);
      router.replace(getRedirectTarget());
    } catch (err) {
      // Only wrong credentials count towards the lockout, not network errors
      if (err instanceof ApiError && err.status === 401) recordFailure();
      setError(errorMessage(err, 'Login failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title={
        <>
          Sign in to your <span className="text-leaf">pantry</span>.
        </>
      }
      subtitle="Pick up where you left off: scan history, scout score and diet settings."
      footer={
        <>
          New here?{' '}
          <Link href="/register" className="font-semibold text-fg underline decoration-leaf decoration-2 underline-offset-4 hover:text-leaf">
            Create an account
          </Link>
        </>
      }
    >
      {(error || isLocked) && (
        <div className="notice-error mb-5" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 text-clay mt-0.5" />
          <span>{isLocked ? 'Too many failed attempts. Please wait 30 seconds.' : error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label htmlFor="identifier" className="field-label">Username or email</label>
          <input
            id="identifier"
            type="text"
            required
            maxLength={254}
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="password" className="field-label">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              maxLength={72}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="field pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1.5 top-1.5 w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-fg hover:bg-bg transition-colors cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || isLocked}
          className="btn-primary w-full h-12 text-[15px]"
        >
          {loading ? 'Signing in…' : 'Sign in'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
    </AuthShell>
  );
}
