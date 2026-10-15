import { NutriScore, Product, VegStatus } from '@/types/product';
import { clearSession, getSession, SessionUser } from './auth';

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/+$/, '');

const NETWORK_ERROR = 'Unable to reach the NutriScan server. Check your connection and that the API is running.';

/** Error carrying the HTTP status and the API's own message. Status 0 = network failure. */
export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function defaultMessage(status: number): string {
  if (status === 400) return 'Please check the details and try again.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have access to this.';
  if (status === 404) return 'Not found.';
  if (status === 409) return 'That conflicts with existing data.';
  if (status === 429) return 'Too many requests. Please slow down.';
  if (status >= 500) return 'The server had a problem. Please try again shortly.';
  return `Request failed (${status}).`;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  // Attach the signed-in user's token when there is one
  auth?: boolean;
  signal?: AbortSignal;
}

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, auth = false, signal }: RequestOptions = {}
): Promise<{ data: T; response: Response }> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = auth ? getSession()?.token : undefined;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(NETWORK_ERROR, 0);
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    // Expired or revoked token: sign out so guarded pages redirect to /login
    if (response.status === 401 && token) clearSession();
    const errBody = (payload ?? {}) as { message?: string; fieldErrors?: Record<string, string> };
    throw new ApiError(errBody.message || defaultMessage(response.status), response.status, errBody.fieldErrors);
  }

  return { data: payload as T, response };
}

// ---------------------------------------------------------------- products

export interface ScanResult {
  product: Product | null;
  error?: string;
  isRateLimited?: boolean;
  // Free guest scans left (null for signed-in users)
  remainingScans?: number | null;
}

export async function fetchProductByBarcode(barcode: string): Promise<ScanResult> {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) {
    return { product: null };
  }

  try {
    const { data, response } = await apiRequest<Product>(`/products/${encodeURIComponent(cleanBarcode)}`, { auth: true });
    const remaining = response.headers.get('X-RateLimit-Remaining');
    return { product: data, remainingScans: remaining !== null ? Number(remaining) : null };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return { product: null, error: `Product not registered for barcode: "${cleanBarcode}"` };
    }
    if (err instanceof ApiError && err.status === 429) {
      return { product: null, isRateLimited: true, error: err.message };
    }
    return { product: null, error: errorMessage(err, NETWORK_ERROR) };
  }
}

export interface InsightPoint {
  tone: 'good' | 'warn' | 'bad' | 'info';
  title: string;
  detail: string;
}

export interface ProductAlternative {
  barcode: string;
  productName: string;
  brand: string | null;
  nutriScore: NutriScore;
  imageUrl: string | null;
}

export interface ProductInsights {
  barcode: string;
  verdict: 'Clean' | 'Moderate' | 'Avoid';
  summary: string;
  // "AI" = written by the language model, "NUTRIBOT" = built from nutrition rules
  summarySource: 'AI' | 'NUTRIBOT';
  highlights: InsightPoint[];
  personalAlerts: InsightPoint[];
  personalized: boolean;
  alternatives: ProductAlternative[];
  alternativesCategory: string | null;
}

export async function getProductInsights(barcode: string, signal?: AbortSignal) {
  const { data } = await apiRequest<ProductInsights>(`/products/${encodeURIComponent(barcode)}/insights`, {
    auth: true,
    signal,
  });
  return data;
}

// ---------------------------------------------------------------- auth & users

export interface AuthResponse extends SessionUser {
  token: string;
  migratedScansCount: number;
}

export interface ScanHistoryItem {
  id: number;
  productName: string;
  brand: string | null;
  barcode: string;
  scannedAt: string;
  healthVerdict: 'Clean' | 'Moderate' | 'Avoid';
  vegStatus?: VegStatus;
  isDiscovery: boolean;
}

export interface ScoutRank {
  username: string;
  fullName: string;
  scoutScore: number;
  uniqueDiscoveries: number;
}

export interface ProfileUpdate {
  fullName: string;
  username: string;
  email: string;
  dietaryPreference: string;
  allergies: string;
  medicalConditions: string;
}

export async function login(identifier: string, password: string, guestBarcodes: string[]) {
  const { data } = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email: identifier, password, guestBarcodes },
  });
  return data;
}

export async function register(details: {
  username: string;
  fullName: string;
  email: string;
  password: string;
  guestBarcodes: string[];
}) {
  const { data } = await apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: details });
  return data;
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data } = await apiRequest<{ available: boolean }>(
    `/auth/check-username?username=${encodeURIComponent(username)}`
  );
  return Boolean(data?.available);
}

export async function getCurrentUser() {
  const { data } = await apiRequest<SessionUser>('/users/me', { auth: true });
  return data;
}

export async function getScanHistory() {
  const { data } = await apiRequest<ScanHistoryItem[]>('/users/me/scans', { auth: true });
  return Array.isArray(data) ? data : [];
}

export async function getLeaderboard() {
  const { data } = await apiRequest<ScoutRank[]>('/users/leaderboard');
  return Array.isArray(data) ? data : [];
}

export async function updateProfile(update: ProfileUpdate) {
  // Returns a fresh token: the old one stops working if the email changed
  const { data } = await apiRequest<AuthResponse>('/users/profile', { method: 'PUT', body: update, auth: true });
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await apiRequest<{ message: string }>('/users/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
    auth: true,
  });
}
