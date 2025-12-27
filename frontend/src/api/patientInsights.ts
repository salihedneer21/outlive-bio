import { apiFetch } from './client';
import type { AdminPatientInsight } from '@outlive/shared';

export interface PatientInsightsListResponse {
  data: AdminPatientInsight[];
  message?: string;
}

export interface PatientInsightResponse {
  data: AdminPatientInsight;
  message?: string;
}

export const listPatientInsights = async (
  patientId: string
): Promise<PatientInsightsListResponse> => {
  const path = `/admin/patients/${patientId}/insights`;

  return apiFetch<PatientInsightsListResponse>(path, {
    method: 'GET'
  });
};

export const createPatientInsight = async (
  patientId: string,
  payload: {
    insightType: AdminPatientInsight['insightType'];
    title: string;
    previewText: string;
    bodyText?: string | null;
    ctaType: AdminPatientInsight['ctaType'];
    isVisible?: boolean;
  }
): Promise<PatientInsightResponse> => {
  const path = `/admin/patients/${patientId}/insights`;

  return apiFetch<PatientInsightResponse>(path, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updatePatientInsight = async (
  insightId: string,
  payload: Partial<{
    insightType: AdminPatientInsight['insightType'];
    title: string;
    previewText: string;
    bodyText: string | null;
    ctaType: AdminPatientInsight['ctaType'];
    isVisible: boolean;
  }>
): Promise<PatientInsightResponse> => {
  const path = `/admin/insights/${insightId}`;

  return apiFetch<PatientInsightResponse>(path, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
};

export const deletePatientInsight = async (
  insightId: string
): Promise<{ data: { id: string }; message?: string }> => {
  const path = `/admin/insights/${insightId}`;

  return apiFetch<{ data: { id: string }; message?: string }>(path, {
    method: 'DELETE'
  });
};

