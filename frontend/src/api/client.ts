export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export interface ApiError {
  message: string;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {}
): Promise<T> {
  const { accessToken, headers, ...rest } = options;

  const result = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
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
    const message =
      typeof body === 'object' && body && 'message' in body
        ? (body as { message?: string }).message ?? 'Request failed'
        : 'Request failed';
    throw { message, status: result.status } as ApiError & { status: number };
  }

  return body as T;
}
