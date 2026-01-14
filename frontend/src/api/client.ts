import { authEvents } from '@/auth/authEvents';

// In development: use relative URL to go through Vite proxy (same-origin, cookies work)
// In production: use full URL from env (cross-origin with sameSite=none + secure=true)
export const API_BASE_URL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL ?? '/api');

export interface ApiError {
  message: string;
  status?: number;
}

/**
 * Token refresh state management
 *
 * Handles concurrent requests during token refresh:
 * - First 401 triggers a refresh attempt
 * - Subsequent 401s wait for the refresh to complete
 * - If refresh succeeds, all queued requests are retried
 * - If refresh fails, all queued requests fail and user is logged out
 */
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    // Verify the user has admin role
    if (!data?.data?.role || data.data.role !== 'admin') {
      return false;
    }

    // Store the new access token for subsequent requests
    if (data.data.accessToken) {
      authEvents.setAccessToken(data.data.accessToken);
    }

    return true;
  } catch {
    return false;
  }
}

async function handleTokenRefresh(): Promise<boolean> {
  // If already refreshing, wait for that attempt
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = attemptTokenRefresh();

  try {
    const success = await refreshPromise;
    return success;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { accessToken?: string; _isRetry?: boolean } = {}
): Promise<T> {
  const { accessToken, _isRetry, headers, ...rest } = options;

  // Use provided token, or get from stored auth state
  const token = accessToken ?? authEvents.getAccessToken();

  const result = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  const contentType = result.headers.get('Content-Type') ?? '';

  let body: unknown;
  if (contentType.includes('application/json')) {
    body = await result.json();
  } else {
    body = await result.text();
  }

  if (!result.ok) {
    // Handle 401 Unauthorized - attempt token refresh
    if (result.status === 401 && !_isRetry) {
      const refreshSuccess = await handleTokenRefresh();

      if (refreshSuccess) {
        // Retry the original request
        return apiFetch<T>(path, { ...options, _isRetry: true });
      }

      // Refresh failed - emit session expired event
      authEvents.emit('session-expired');
    }

    const message =
      typeof body === 'object' && body && 'message' in body
        ? (body as { message?: string }).message ?? 'Request failed'
        : 'Request failed';

    const error: ApiError & { status: number } = { message, status: result.status };
    throw error;
  }

  return body as T;
}
