import { apiFetch } from './client';
import type {
  AdminComprehensiveIntake,
  AdminPatient,
  AdminPatientProfile,
  AdminPatientsResult,
  AdminPatientsStats
} from '@outlive/shared';

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

export interface PatientProfileResponse {
  data: {
    patient: AdminPatient;
    profile: AdminPatientProfile | null;
  };
  message: string;
}

export interface PatientComprehensiveIntakeResponse {
  data: {
    patient: AdminPatient;
    comprehensiveIntake: AdminComprehensiveIntake | null;
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

const normalizeStringArray = (value: unknown): string[] | null => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
    } catch {
      return null;
    }
  }

  return null;
};

export const getPatientProfile = async (
  patientId: string
): Promise<PatientProfileResponse> => {
  const path = `/admin/patients/${patientId}/profile`;

  return apiFetch<PatientProfileResponse>(path, {
    method: 'GET'
  });
};

export const getPatientComprehensiveIntake = async (
  patientId: string
): Promise<PatientComprehensiveIntakeResponse> => {
  const path = `/admin/patients/${patientId}/comprehensive-intake`;

  const response = await apiFetch<PatientComprehensiveIntakeResponse>(path, {
    method: 'GET'
  });

  const ci = response.data.comprehensiveIntake;

  if (ci) {
    ci.healthPriorities = normalizeStringArray(ci.healthPriorities as unknown);
    ci.sleepIssues = normalizeStringArray(ci.sleepIssues as unknown);
    ci.medicalConditions = normalizeStringArray(ci.medicalConditions as unknown);
    ci.screeningsCompleted = normalizeStringArray(ci.screeningsCompleted as unknown);
    ci.uploadedLabIds = normalizeStringArray(ci.uploadedLabIds as unknown);
  }

  return response;
};
