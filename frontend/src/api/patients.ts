import { apiFetch } from './client';
import type { AdminPatientsResult, AdminPatientsStats } from '@outlive/shared';

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

export interface PatientStatsParams {
  from?: string;
  to?: string;
}

export interface PatientStatsResponse {
  data: AdminPatientsStats;
  message: string;
}

export interface ImpersonatePatientResponse {
  data: {
    url: string;
  };
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

export const getPatientStats = async (params: PatientStatsParams = {}): Promise<PatientStatsResponse> => {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);

  const query = searchParams.toString();
  const path = `/admin/patients/stats${query ? `?${query}` : ''}`;

  return apiFetch<PatientStatsResponse>(path, {
    method: 'GET'
  });
};

export const impersonatePatient = async (
  patientId: string
): Promise<ImpersonatePatientResponse> => {
  const path = `/admin/patients/${patientId}/impersonate`;

  return apiFetch<ImpersonatePatientResponse>(path, {
    method: 'POST'
  });
};
