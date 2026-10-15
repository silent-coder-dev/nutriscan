'use client';

import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RuleChecklist from '../components/RuleChecklist';
import { saveSession, useSession, UserSession } from '@/lib/auth';
import { updateProfile, changePassword, errorMessage } from '@/lib/api';
import { sanitizeInput, checkUsernameSecure } from '@/lib/security';
import { validatePassword, validateUsername } from '@/lib/validation';
import {
  AlertTriangle, Check, Loader2, Lock, Eye, EyeOff, AlertCircle,
  UserRound, Salad, KeyRound, ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

const COMMON_ALLERGIES = ['Peanuts', 'Gluten', 'Dairy', 'Soy', 'Tree Nuts', 'Eggs', 'Shellfish'];
const DIETARY_OPTIONS = ['Omnivore', 'Vegetarian', 'Vegan', 'Keto', 'Pescatarian', 'Halal'];
const USERNAME_COOLDOWN_DAYS = 20;
const DAY_MS = 1000 * 60 * 60 * 24;

const TABS = [
  { id: 'profile', label: 'Account', hint: 'Name, handle, email', icon: UserRound },
  { id: 'diet', label: 'Diet & health', hint: 'Allergies, conditions', icon: Salad },
  { id: 'security', label: 'Security', hint: 'Password', icon: KeyRound },
] as const;

type TabId = (typeof TABS)[number]['id'];
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'unknown';

// Days left before the handle can change again (0 = unlocked)
function usernameLockDays(lastChange: string | null | undefined, now: number): number {
  if (!lastChange) return 0;
  const changedAt = new Date(lastChange).getTime();
  if (Number.isNaN(changedAt)) return 0;
  const remaining = Math.ceil((changedAt + USERNAME_COOLDOWN_DAYS * DAY_MS - now) / DAY_MS);
  return Math.min(USERNAME_COOLDOWN_DAYS, Math.max(0, remaining));
}

export default function ProfileClient() {
  const session = useSession();
  // AuthGuard only renders this page with a session; the form owns its own state
  return session ? <ProfileForm session={session} /> : null;
}

function ProfileForm({ session }: { session: UserSession }) {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  // Personal details, seeded from the stored session
  const [fullName, setFullName] = useState(session.fullName || '');
  const [username, setUsername] = useState(session.username || '');
  const [email, setEmail] = useState(session.email || '');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(() =>
    session.allergies ? session.allergies.split(',').map((s) => s.trim()).filter(Boolean) : []
  );
  const [dietaryPref, setDietaryPref] = useState(session.dietaryPreference || 'Omnivore');
  const [medicalConditions, setMedicalConditions] = useState(session.medicalConditions || '');

  // Username can change once every 20 days
  const [now] = useState(() => Date.now());
  const daysRemainingForUsername = usernameLockDays(session.lastUsernameChange, now);
  const [availability, setAvailability] = useState<{ username: string; status: UsernameStatus } | null>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const pwdValidation = validatePassword(newPassword);
  const isChangingUsername = username !== (session.username || '').toLowerCase();
  const usernameIsValid = validateUsername(username).isValid;

  const usernameStatus: UsernameStatus = !isChangingUsername
    ? 'idle'
    : !usernameIsValid
    ? 'invalid'
    : availability?.username === username
    ? availability.status
    : 'checking';

  // Debounced availability check for a new handle
  useEffect(() => {
    if (!isChangingUsername || !usernameIsValid) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const available = await checkUsernameSecure(username);
      if (cancelled) return;
      setAvailability({ username, status: available === null ? 'unknown' : available ? 'available' : 'taken' });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username, isChangingUsername, usernameIsValid]);

  const handleUsernameChange = (val: string) => {
    setUsername(sanitizeInput(val).toLowerCase().replace(/\s+/g, '').slice(0, 15));
  };

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies(prev =>
      prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
    );
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (isChangingUsername && daysRemainingForUsername > 0) {
      setNotification({
        type: 'error',
        message: `Usernames can change once every ${USERNAME_COOLDOWN_DAYS} days. Try again in ${daysRemainingForUsername} days.`
      });
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await updateProfile({
        fullName: sanitizeInput(fullName),
        username: isChangingUsername ? username : session.username,
        email: sanitizeInput(email).toLowerCase(),
        dietaryPreference: dietaryPref,
        allergies: selectedAllergies.join(', '),
        medicalConditions: sanitizeInput(medicalConditions),
      });

      // The API issues a new token (required when the email changes)
      saveSession(updatedUser.token || session.token, updatedUser);
      setNotification({ type: 'success', message: 'Saved. Your changes are live.' });
    } catch (err) {
      // A 401 signs the user out inside the API client; the guard then redirects
      setNotification({ type: 'error', message: errorMessage(err, 'Failed to update user profile') });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdValidation.isValid) return;

    setLoading(true);
    setNotification(null);

    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setNotification({ type: 'success', message: 'Password updated.' });
    } catch (err) {
      setNotification({ type: 'error', message: errorMessage(err, 'Password update failed') });
    } finally {
      setLoading(false);
    }
  };

  const usernameFieldState =
    usernameStatus === 'available' ? 'field-ok' : usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'field-error' : '';

  const usernameHint =
    usernameStatus === 'invalid'
      ? validateUsername(username).error || 'Use 3–15 characters: a–z, 0–9, _ . -'
      : usernameStatus === 'taken'
      ? 'Someone already has that handle.'
      : usernameStatus === 'unknown'
      ? "Couldn't check availability right now."
      : null;

  const blockProfileSave =
    isChangingUsername && (usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking');

  const saveButton = (label: string, disabled = false) => (
    <button type="submit" disabled={loading || disabled} className="btn-primary">
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-20">
        <Link href="/" className="inline-flex items-center gap-1.5 mb-6 text-[14px] font-semibold text-muted hover:text-leaf transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Identity */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-20 h-20 rounded-full bg-leaf text-bg flex items-center justify-center font-display text-4xl font-extrabold shrink-0">
            {fullName ? fullName.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="min-w-0">
            <p className="eyebrow">Profile</p>
            <h1 className="display text-[34px] sm:text-[44px] leading-[0.95] mt-1.5 truncate">
              {fullName || 'Scout'}
            </h1>
            <p className="font-mono text-[13px] text-muted mt-2 truncate">
              @{username || 'scout'} · {email}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-[230px_1fr] gap-6 items-start">
          {/* Tab index */}
          <nav className="panel p-1.5 flex md:flex-col gap-1" aria-label="Profile sections">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setNotification(null);
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`flex-1 text-left px-3.5 py-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-colors ${
                    active ? 'bg-leaf text-bg' : 'hover:bg-raised'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-bg' : 'text-muted'}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{tab.label}</span>
                    <span className={`hidden md:block text-[12px] ${active ? 'text-bg/60' : 'text-muted'}`}>
                      {tab.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="min-w-0">
            {notification && (
              <div className={`mb-5 ${notification.type === 'success' ? 'notice-ok' : 'notice-error'}`} role={notification.type === 'error' ? 'alert' : 'status'}>
                {notification.type === 'success' ? (
                  <Check className="w-4 h-4 text-river shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-clay shrink-0 mt-0.5" />
                )}
                <span>{notification.message}</span>
              </div>
            )}

            {activeTab === 'profile' && (
              <section className="panel p-6 sm:p-8">
                <h2 className="display text-3xl">Account</h2>
                <p className="text-muted mt-1">How you show up on the leaderboard.</p>
                <div className="h-px bg-line mt-5 mb-6" />

                <form onSubmit={handleProfileSubmit} className="space-y-5 max-w-lg">
                  <div>
                    <label htmlFor="fullName" className="field-label">Full name</label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      maxLength={100}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="field"
                    />
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <label htmlFor="username" className="field-label">Username</label>
                      {daysRemainingForUsername > 0 && (
                        <span className="tag text-sun bg-sun/10">
                          Locked · {daysRemainingForUsername}d
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-dim">@</span>
                      <input
                        id="username"
                        type="text"
                        required
                        maxLength={15}
                        disabled={daysRemainingForUsername > 0}
                        value={username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        className={`field pl-8 pr-10 font-mono ${usernameFieldState}`}
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-dim animate-spin" />}
                        {usernameStatus === 'available' && <Check className="w-4 h-4 text-river stroke-[3]" />}
                        {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <AlertTriangle className="w-4 h-4 text-clay" />}
                      </span>
                    </div>
                    {usernameHint && (
                      <p className={`text-[13px] mt-1.5 font-medium ${usernameStatus === 'unknown' ? 'text-sun' : 'text-clay'}`}>
                        {usernameHint}
                      </p>
                    )}
                    <p className="text-[12px] text-muted mt-1.5">
                      You can change your handle once every 20 days so rankings stay fair.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="email" className="field-label">Email</label>
                    <input
                      id="email"
                      type="email"
                      required
                      maxLength={254}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="field"
                    />
                  </div>

                  <div className="pt-2">
                    {saveButton("Save changes", blockProfileSave)}
                  </div>
                </form>
              </section>
            )}

            {activeTab === 'diet' && (
              <section className="panel p-6 sm:p-8">
                <h2 className="display text-3xl">Diet & health</h2>
                <p className="text-muted mt-1">We use these to flag ingredients that don&apos;t suit you.</p>
                <div className="h-px bg-line mt-5 mb-6" />

                <form onSubmit={handleProfileSubmit} className="space-y-7">
                  <fieldset>
                    <legend className="field-label">How you eat</legend>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-1">
                      {DIETARY_OPTIONS.map((diet) => (
                        <button
                          type="button"
                          key={diet}
                          onClick={() => setDietaryPref(diet)}
                          aria-pressed={dietaryPref === diet}
                          className={`h-11 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                            dietaryPref === diet
                              ? 'bg-leaf text-bg border-line-strong'
                              : 'bg-raised border-line hover:border-line-strong'
                          }`}
                        >
                          {diet}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="field-label">Allergies & intolerances</legend>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {COMMON_ALLERGIES.map((allergy) => {
                        const isSelected = selectedAllergies.includes(allergy);
                        return (
                          <button
                            type="button"
                            key={allergy}
                            onClick={() => toggleAllergy(allergy)}
                            className={`chip ${isSelected ? 'chip-warn' : ''}`}
                            aria-pressed={isSelected}
                          >
                            {isSelected ? <Check className="w-3.5 h-3.5" /> : <span className="text-dim">+</span>}
                            {allergy}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <label htmlFor="medical" className="field-label">Medical notes</label>
                      <span className="font-mono text-[11px] text-dim">{medicalConditions.length}/255</span>
                    </div>
                    <textarea
                      id="medical"
                      rows={3}
                      maxLength={255}
                      value={medicalConditions}
                      onChange={(e) => setMedicalConditions(e.target.value)}
                      placeholder="e.g. Type 2 diabetes, hypertension, coeliac…"
                      className="field h-auto py-3 resize-y"
                    />
                  </div>

                  {saveButton("Save preferences")}
                </form>
              </section>
            )}

            {activeTab === 'security' && (
              <section className="panel p-6 sm:p-8">
                <h2 className="display text-3xl">Password</h2>
                <p className="text-muted mt-1">Use at least 8 characters with a mix of symbols.</p>
                <div className="h-px bg-line mt-5 mb-6" />

                <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
                  <div>
                    <label htmlFor="currentPassword" className="field-label">Current password</label>
                    <div className="relative">
                      <input
                        id="currentPassword"
                        type={showCurrentPass ? 'text' : 'password'}
                        required
                        maxLength={72}
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="field pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-1.5 top-1.5 w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-fg hover:bg-bg cursor-pointer"
                        aria-label={showCurrentPass ? 'Hide password' : 'Show password'}
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="field-label">New password</label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showNewPass ? 'text' : 'password'}
                        required
                        maxLength={72}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="field pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-1.5 top-1.5 w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-fg hover:bg-bg cursor-pointer"
                        aria-label={showNewPass ? 'Hide password' : 'Show password'}
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <RuleChecklist
                      rules={[
                        { label: '8–72 characters', met: pwdValidation.hasMinLength },
                        { label: 'Uppercase letter', met: pwdValidation.hasUpperCase },
                        { label: 'Lowercase letter', met: pwdValidation.hasLowerCase },
                        { label: 'A number', met: pwdValidation.hasNumber },
                        { label: 'A symbol (!@#$…)', met: pwdValidation.hasSpecialChar },
                      ]}
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading || !pwdValidation.isValid || !currentPassword}
                      className="btn-primary"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      Update password
                    </button>
                  </div>
                </form>
              </section>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
