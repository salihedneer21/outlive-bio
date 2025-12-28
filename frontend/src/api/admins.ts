import { apiFetch } from './client';
import type {
  AdminUsersResult,
  AdminUserSearchResult
} from '@outlive/shared';

export interface AdminsResponse {
  data: AdminUsersResult;
  message?: string;
}

export interface AdminSearchResponse {
  data: AdminUserSearchResult;
  message?: string;
}

export const listAdmins = async (): Promise<AdminsResponse> => {
  const path = `/admin/admins`;

  return apiFetch<AdminsResponse>(path, {
    method: 'GET'
  });
};

export const searchAdminCandidates = async (q: string): Promise<AdminSearchResponse> => {
  const searchParams = new URLSearchParams();
  searchParams.set('q', q);
  const path = `/admin/admins/search?${searchParams.toString()}`;

  return apiFetch<AdminSearchResponse>(path, {
    method: 'GET'
  });
};

export const addAdmin = async (userId: string): Promise<{ message?: string }> => {
  return apiFetch<{ data: { userId: string }; message?: string }>(`/admin/admins`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
};

export const removeAdmin = async (userId: string): Promise<{ message?: string }> => {
  return apiFetch<{ data: { userId: string }; message?: string }>(`/admin/admins/${userId}`, {
    method: 'DELETE'
  });
};
