import { apiFetch } from './client';
import type {
  AdminPatientNote,
  AdminPatientNotesQuery
} from '@outlive/shared';

export interface PatientNotesListResponse {
  data: {
    notes: AdminPatientNote[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  message: string;
}

export interface PatientNoteResponse {
  data: AdminPatientNote;
  message: string;
}

export const listPatientNotes = async (
  patientId: string,
  params: Partial<AdminPatientNotesQuery> = {}
): Promise<PatientNotesListResponse> => {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (typeof params.search === 'string' && params.search.trim().length > 0) {
    searchParams.set('search', params.search.trim());
  }
  if (params.includeArchived) {
    searchParams.set('includeArchived', 'true');
  }

  const query = searchParams.toString();
  const path = `/admin/patients/${patientId}/notes${query ? `?${query}` : ''}`;

  return apiFetch<PatientNotesListResponse>(path, {
    method: 'GET'
  });
};

export const createPatientNote = async (
  patientId: string,
  payload: {
    title?: string;
    bodyMarkdown: string;
    tags?: string[];
    isPinned?: boolean;
  }
): Promise<PatientNoteResponse> => {
  const path = `/admin/patients/${patientId}/notes`;

  return apiFetch<PatientNoteResponse>(path, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updatePatientNote = async (
  noteId: string,
  payload: Partial<{
    title: string | null;
    bodyMarkdown: string;
    tags: string[] | null;
    isPinned: boolean;
    isArchived: boolean;
  }>
): Promise<PatientNoteResponse> => {
  const path = `/admin/notes/${noteId}`;

  return apiFetch<PatientNoteResponse>(path, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
};

export const deletePatientNote = async (noteId: string): Promise<{ data: { id: string }; message?: string }> => {
  const path = `/admin/notes/${noteId}`;

  return apiFetch<{ data: { id: string }; message?: string }>(path, {
    method: 'DELETE'
  });
};

