import { getSupabaseServiceClient } from '@lib/supabase';
import type {
  AdminPatientNote,
  AdminPatientNotesQuery,
  AdminPatientNotesResult,
  PaginationMeta
} from './patientNotes.types';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const buildPaginationMeta = (page: number, pageSize: number, total: number): PaginationMeta => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

const mapRowToAdminPatientNote = (row: any): AdminPatientNote => ({
  id: row.id,
  patientId: row.patient_id,
  title: row.title ?? null,
  bodyMarkdown: row.body_markdown,
  bodyPlaintext: row.body_plaintext ?? null,
  tags: Array.isArray(row.tags) ? (row.tags as string[]) : null,
  isPinned: !!row.is_pinned,
  isArchived: !!row.is_archived,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: {
    id: row.created_by_user_id,
    email: row.created_by_email ?? null,
    role: row.created_by_role ?? null
  },
  lastEditedBy: row.last_edited_by_user_id
    ? {
        id: row.last_edited_by_user_id,
        email: row.last_edited_by_email ?? null,
        role: row.last_edited_by_role ?? null
      }
    : null
});

export const getPatientNotes = async (
  patientId: string,
  query: AdminPatientNotesQuery
): Promise<AdminPatientNotesResult> => {
  const supabase = getSupabaseServiceClient();

  const page = query.page > 0 ? query.page : 1;
  const pageSize =
    query.pageSize > 0 ? Math.min(query.pageSize, MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let notesQuery = supabase
    .from('patient_internal_notes')
    .select('*', { count: 'exact' })
    .eq('patient_id', patientId);

  // When includeArchived is true, we show only archived notes.
  // Otherwise, we show only active (non-archived) notes.
  if (query.includeArchived) {
    notesQuery = notesQuery.eq('is_archived', true);
  } else {
    notesQuery = notesQuery.eq('is_archived', false);
  }

  if (query.search && query.search.trim().length > 0) {
    const search = query.search.trim();

    notesQuery = notesQuery.or(
      [
        `title.ilike.%${search}%`,
        `body_markdown.ilike.%${search}%`,
        `body_plaintext.ilike.%${search}%`
      ].join(',')
    );
  }

  // Pinned notes first, then newest first
  notesQuery = notesQuery.order('is_pinned', { ascending: false }).order('created_at', {
    ascending: false
  });

  const { data, error, count } = await notesQuery.range(from, to);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as any[];
  const safeCount = typeof count === 'number' ? count : rows.length;

  const notes = rows.map(mapRowToAdminPatientNote);

  return {
    notes,
    pagination: buildPaginationMeta(page, pageSize, safeCount)
  };
};

interface CreatePatientNoteInput {
  patientId: string;
  title?: string;
  bodyMarkdown: string;
  tags?: string[];
  isPinned?: boolean;
  createdByUserId: string;
  createdByEmail: string | null;
  createdByRole: string | null;
}

export const createPatientNote = async (input: CreatePatientNoteInput): Promise<AdminPatientNote> => {
  const supabase = getSupabaseServiceClient();

  const bodyPlaintext = input.bodyMarkdown.replace(/[#*_`>~-]+/g, '').trim() || null;

  const { data, error } = await supabase
    .from('patient_internal_notes')
    .insert({
      patient_id: input.patientId,
      created_by_user_id: input.createdByUserId,
      created_by_role: input.createdByRole ?? 'admin',
      last_edited_by_user_id: input.createdByUserId,
      title: input.title ?? null,
      body_markdown: input.bodyMarkdown,
      body_plaintext: bodyPlaintext,
      tags: input.tags && input.tags.length > 0 ? input.tags : null,
      is_pinned: !!input.isPinned,
      is_archived: false
    })
    .select('*')
    .single();

  if (error || !data) {
    throw error ?? new Error('Failed to create patient note');
  }

  return mapRowToAdminPatientNote({
    ...data,
    created_by_email: input.createdByEmail,
    created_by_role: input.createdByRole,
    last_edited_by_email: input.createdByEmail,
    last_edited_by_role: input.createdByRole
  });
};

interface UpdatePatientNoteInput {
  noteId: string;
  title?: string;
  bodyMarkdown?: string;
  tags?: string[] | null;
  isPinned?: boolean;
  isArchived?: boolean;
  editedByUserId: string;
  editedByEmail: string | null;
  editedByRole: string | null;
}

export const updatePatientNote = async (
  input: UpdatePatientNoteInput
): Promise<AdminPatientNote> => {
  const supabase = getSupabaseServiceClient();

  const updates: Record<string, unknown> = {
    last_edited_by_user_id: input.editedByUserId
  };

  if (input.title !== undefined) {
    updates.title = input.title;
  }

  if (input.bodyMarkdown !== undefined) {
    updates.body_markdown = input.bodyMarkdown;
    updates.body_plaintext =
      input.bodyMarkdown.replace(/[#*_`>~-]+/g, '').trim() || null;
  }

  if (input.tags !== undefined) {
    updates.tags = input.tags && input.tags.length > 0 ? input.tags : null;
  }

  if (input.isPinned !== undefined) {
    updates.is_pinned = input.isPinned;
  }

  if (input.isArchived !== undefined) {
    updates.is_archived = input.isArchived;
  }

  const { data, error } = await supabase
    .from('patient_internal_notes')
    .update(updates)
    .eq('id', input.noteId)
    .select('*')
    .single();

  if (error || !data) {
    const err: Error & { code?: string } = new Error('Note not found or update failed');
    err.code = error?.code ?? 'NOT_FOUND';
    throw err;
  }

  return mapRowToAdminPatientNote({
    ...data,
    last_edited_by_email: input.editedByEmail,
    last_edited_by_role: input.editedByRole
  });
};

export const deletePatientNote = async (noteId: string): Promise<{ id: string }> => {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('patient_internal_notes')
    .delete()
    .eq('id', noteId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const deleteError: Error & { code?: string } = new Error('Note not found or delete failed');
    deleteError.code = 'NOT_FOUND';
    throw deleteError;
  }

  return { id: (data as { id: string }).id };
};
