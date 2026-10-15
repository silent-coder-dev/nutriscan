'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, X, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { validatePassword, validateUsername } from '@/lib/validation';
import { saveSession, getSession, getRedirectTarget, getGuestScans, clearGuestScans } from '@/lib/auth';
import { register, errorMessage } from '@/lib/api';
import { checkUsernameSecure, sanitizeInput } from '@/lib/security';
import AuthShell from '../components/AuthShell';
import RuleChecklist from '../components/RuleChecklist';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'unknown';

export default function RegisterPage() {
  const router = useRouter();

  // Already signed in: skip this page
  useEffect(() => {
    if (getSession()) router.replace(getRedirectTarget());
  }, [router]);

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Result of the last availability check, tagged with the username it was for
  const [availability, setAvailability] = useState<{ username: string; status: UsernameStatus } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pwd = validatePassword(password);
  const userValidation = validateUsername(username);

  const usernameStatus: UsernameStatus =
    !username || !userValidation.isValid
      ? 'idle'
      : availability?.username === username
      ? availability.status
      : 'checking';

  const usernameMsg = !username
    ? ''
    : !userValidation.isValid
    ? userValidation.error || 'Invalid username format'
    : usernameStatus === 'available'
    ? "Nice, that one's free."
    : usernameStatus === 'taken'
    ? 'Someone already has that handle.'
    : usernameStatus === 'unknown'
    ? "Couldn't check availability right now. You can still try to sign up."
    : '';

  // Lowercase, strip spaces, cap at 15 chars
  const handleUsernameInput = (val: string) => {
    const sanitized = sanitizeInput(val).toLowerCase().replace(/\s+/g, '');
    if (sanitized.length <= 15) {
      setUsername(sanitized);
    }
  };

  // Debounced availability check, only once the format is valid
  useEffect(() => {
    if (!username || !userValidation.isValid) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const isAvailable = await checkUsernameSecure(username);
      if (cancelled) return;
      setAvailability({
        username,
        status: isAvailable === null ? 'unknown' : isAvailable ? 'available' : 'taken',
      });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username, userValidation.isValid]);

  const canSubmitUsername = usernameStatus === 'available' || usernameStatus === 'unknown';
  const isFormValid = pwd.isValid && userValidation.isValid && canSubmitUsername;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await register({
        username,
        fullName: sanitizeInput(fullName),
        email: sanitizeInput(email).toLowerCase(),
        password,
        guestBarcodes: getGuestScans(),
      });
      clearGuestScans(); // migrated server-side
      saveSession(data.token, data);
      router.replace(getRedirectTarget());
    } catch (err) {
      setError(errorMessage(err, 'Error creating account.'));
    } finally {
      setLoading(false);
    }
  };

  const usernameFieldState = !username
    ? ''
    : !userValidation.isValid || usernameStatus === 'taken'
    ? 'field-error'
    : usernameStatus === 'available'
    ? 'field-ok'
    : '';

  return (
    <AuthShell
      eyebrow="New account"
      title={
        <>
          Claim your <span className="text-leaf">handle</span>.
        </>
      }
      subtitle="Save every scan, set your diet and allergies, and climb the scout leaderboard."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-fg underline decoration-leaf decoration-2 underline-offset-4 hover:text-leaf">
            Sign in
          </Link>
        </>
      }
    >
      {error && (
        <div className="notice-error mb-5" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 text-clay mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="username" className="field-label">Username</label>
            <span className={`font-mono text-[11px] ${username.length === 15 ? 'text-clay font-bold' : 'text-dim'}`}>
              {username.length}/15
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-dim">@</span>
            <input
              id="username"
              type="text"
              required
              maxLength={15}
              autoComplete="username"
              value={username}
              onChange={(e) => handleUsernameInput(e.target.value)}
              placeholder="scout_99"
              className={`field pl-8 pr-10 font-mono ${usernameFieldState}`}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-dim animate-spin" />}
              {usernameStatus === 'available' && <Check className="w-4 h-4 text-river stroke-[3]" />}
              {usernameStatus === 'taken' && <X className="w-4 h-4 text-clay stroke-[3]" />}
            </span>
          </div>

          {usernameMsg && (
            <p className={`text-[13px] mt-1.5 font-medium ${usernameStatus === 'available' ? 'text-river' : usernameStatus === 'unknown' ? 'text-sun' : 'text-clay'}`}>
              {usernameMsg}
            </p>
          )}

          <RuleChecklist
            rules={[
              { label: 'Only a–z, 0–9, _ . -', met: Boolean(username) && userValidation.hasOnlyLower },
              { label: '3–15 characters', met: userValidation.hasValidLength },
            ]}
          />
          <p className="text-[12px] text-dim mt-1.5">Numbers and _ . - are optional.</p>
        </div>

        <div>
          <label htmlFor="fullName" className="field-label">Full name</label>
          <input
            id="fullName"
            type="text"
            required
            maxLength={100}
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="email" className="field-label">Email</label>
          <input
            id="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
              autoComplete="new-password"
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

          <RuleChecklist
            rules={[
              { label: '8–72 characters', met: pwd.hasMinLength },
              { label: 'Uppercase letter', met: pwd.hasUpperCase },
              { label: 'Lowercase letter', met: pwd.hasLowerCase },
              { label: 'A number', met: pwd.hasNumber },
              { label: 'A symbol (!@#$…)', met: pwd.hasSpecialChar },
            ]}
          />
        </div>

        <button
          type="submit"
          disabled={!isFormValid || loading}
          className="btn-primary w-full h-12 text-[15px]"
        >
          {loading ? 'Creating account…' : 'Create account'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
    </AuthShell>
  );
}
