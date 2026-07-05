import { auth } from './firebase-client';
import { onAuthStateChanged } from 'firebase/auth';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? 'https://supplysync-uizo.onrender.com/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');

export class ApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

/**
 * Wait for Firebase auth to finish restoring the session.
 * Returns the current user (or null if not logged in).
 */
function waitForAuth(): Promise<import('firebase/auth').User | null> {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
    // Safety timeout so we never hang forever
    setTimeout(() => resolve(null), 5000);
  });
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const user = await waitForAuth();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (user) {
    const token = await user.getIdToken();
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    cache: 'no-store', // Disable caching globally for realtime updates
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData?.error?.message || response.statusText,
      errorData?.error?.code
    );
  }

  const data = await response.json();
  if (!data.success) {
    throw new ApiError(data.error?.message || 'Unknown API Error', data.error?.code);
  }

  return data.data as T;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const user = await waitForAuth();
  const token = user ? await user.getIdToken() : null;
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://supplysync-uizo.onrender.com/api' : (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');

  const res = await fetch(`${baseUrl}${path}`, {
    cache: 'no-store', // Disable caching globally for realtime updates
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || "Request failed");
  }

  return json.data as T;
}
