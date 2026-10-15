import { checkUsernameAvailable } from './api';

// In-memory cache to prevent duplicate redundant API hits
const usernameCache = new Map<string, boolean>();

// Strips characters that never belong in names, handles or emails.
// Not a security boundary: the API validates everything and React escapes output.
export function sanitizeInput(val: string): string {
  return val
    .replace(/[<>'"`;()]/g, '')
    .trim();
}

/**
 * Cached availability check. Returns null when the check itself failed
 * (network/server error), so callers can tell "taken" from "unknown".
 */
export async function checkUsernameSecure(username: string): Promise<boolean | null> {
  const clean = sanitizeInput(username).toLowerCase().replace(/\s+/g, '');
  if (!clean || clean.length < 3) return false;

  // Cache hit: Zero network calls!
  const cached = usernameCache.get(clean);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const available = await checkUsernameAvailable(clean);
    usernameCache.set(clean, available);
    return available;
  } catch {
    return null;
  }
}
