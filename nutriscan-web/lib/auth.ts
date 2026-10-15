import { useSyncExternalStore } from 'react';

export const AUTH_STORAGE_KEYS = {
  TOKEN: 'nutriscan_token',
  USER: 'nutriscan_user',
  GUEST_SCANS: 'nutriscan_guest_scans',
};

// The API accepts at most this many guest barcodes on sign-in
const MAX_GUEST_SCANS = 50;

export interface UserSession {
  token: string;
  userId: number;
  username: string;
  fullName: string;
  email: string;
  dietaryPreference?: string | null;
  allergies?: string | null;
  medicalConditions?: string | null;
  scoutScore: number;
  uniqueDiscoveries: number;
  lastUsernameChange?: string | null;
}

export type SessionUser = Omit<UserSession, 'token'>;

// localStorage can throw (private mode, blocked storage); treat that as "no data"
function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the session simply won't persist
  }
}

// Cached so useSyncExternalStore gets a stable object while storage is unchanged
let cachedToken: string | null = null;
let cachedUser: string | null = null;
let cachedSession: UserSession | null = null;

// 1. Get Session: Strictly return NULL if no real user is logged in
export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;

  const token = readStorage(AUTH_STORAGE_KEYS.TOKEN);
  const userStr = readStorage(AUTH_STORAGE_KEYS.USER);

  if (!token || !userStr) {
    return null; // NO DEFAULT USER
  }

  if (token === cachedToken && userStr === cachedUser) {
    return cachedSession;
  }

  try {
    const user = JSON.parse(userStr) as SessionUser;
    cachedToken = token;
    cachedUser = userStr;
    cachedSession = { ...user, token };
    return cachedSession;
  } catch {
    return null;
  }
}

function toStoredUser(userData: Partial<UserSession>): SessionUser {
  const user = { ...userData };
  delete user.token; // the token is stored on its own
  return user as SessionUser;
}

// 2. Save Session when login succeeds
export function saveSession(token: string, userData: Partial<UserSession>) {
  if (typeof window === 'undefined') return;
  writeStorage(AUTH_STORAGE_KEYS.TOKEN, token);
  writeStorage(AUTH_STORAGE_KEYS.USER, JSON.stringify(toStoredUser(userData)));
  notifyAuthChange();
}

// Merge fresh fields (e.g. a new scout score) into the stored session
export function updateSession(patch: Partial<SessionUser>) {
  const current = getSession();
  if (!current) return;
  saveSession(current.token, { ...current, ...patch });
}

// 3. Clear Session on Logout
export function clearSession() {
  if (typeof window === 'undefined') return;
  writeStorage(AUTH_STORAGE_KEYS.TOKEN, null);
  writeStorage(AUTH_STORAGE_KEYS.USER, null);
  notifyAuthChange();
}

// 4. Auth change notifications (same tab + other tabs)
const AUTH_EVENT = 'nutriscan-auth-change';

function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function subscribeToAuth(callback: () => void) {
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

// Current session, re-rendering whenever it changes (null during server render)
export function useSession(): UserSession | null {
  return useSyncExternalStore(subscribeToAuth, getSession, () => null);
}

// 5. Where to go after sign-in. Only same-site paths are allowed.
export function getRedirectTarget(fallback = '/dashboard'): string {
  if (typeof window === 'undefined') return fallback;
  const next = new URLSearchParams(window.location.search).get('next');
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) {
    return next;
  }
  return fallback;
}

// 6. Barcodes scanned before signing in, migrated to the account on login/register
export function getGuestScans(): string[] {
  try {
    const parsed: unknown = JSON.parse(readStorage(AUTH_STORAGE_KEYS.GUEST_SCANS) || '[]');
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === 'string') : [];
  } catch {
    return [];
  }
}

export function addGuestScan(barcode: string) {
  const existing = getGuestScans();
  if (existing.includes(barcode)) return;
  const next = [...existing, barcode].slice(-MAX_GUEST_SCANS);
  writeStorage(AUTH_STORAGE_KEYS.GUEST_SCANS, JSON.stringify(next));
}

export function clearGuestScans() {
  writeStorage(AUTH_STORAGE_KEYS.GUEST_SCANS, null);
}
