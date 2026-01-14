import { apiFetch } from './client';

interface LoginResponse {
  data: {
    user: {
      id: string;
      email: string;
    };
    role: string | null;
    accessToken: string;
  };
  message: string;
}

interface RefreshResponse {
  data: {
    user: {
      id: string;
      email: string;
    };
    role: string | null;
    accessToken: string;
  };
  message: string;
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function refreshRequest(): Promise<RefreshResponse> {
  return apiFetch<RefreshResponse>('/auth/refresh', {
    method: 'POST'
  });
}

export async function logoutRequest(): Promise<void> {
  await apiFetch<unknown>('/auth/logout', {
    method: 'POST'
  });
}
