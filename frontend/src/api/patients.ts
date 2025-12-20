import { apiFetch } from './client';
import type { AdminPatientsResult } from '@outlive/shared';

export interface ListPatientsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface ListPatientsResponse {
  data: AdminPatientsResult;
  message: string;
}

export const listPatients = async (params: ListPatientsParams = {}): Promise<ListPatientsResponse> => {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.search) searchParams.set('search', params.search);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const query = searchParams.toString();
  const path = `/admin/patients${query ? `?${query}` : ''}`;

  return apiFetch<ListPatientsResponse>(path, {
    method: 'GET'
  });
};
