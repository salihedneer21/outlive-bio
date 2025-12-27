import type { Request, Response } from 'express';
import type {
  AdminPatientNotesQuery
} from './patientNotes.types';
import {
  createPatientNote,
  deletePatientNote,
  getPatientNotes,
  updatePatientNote
} from './patientNotes.service';
import type { ApiResponse } from '../../types/app';

export const listPatientNotesHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const patientId = req.params.id;

  if (!patientId) {
    res.status(400).json({ message: 'Patient id is required' });
    return;
  }

  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const includeArchived =
    req.query.includeArchived === 'true' || req.query.includeArchived === '1';

  const query: AdminPatientNotesQuery = {
    page,
    pageSize,
    search,
    includeArchived
  };

  try {
    const result = await getPatientNotes(patientId, query);

    const response: ApiResponse<typeof result> = {
      data: result,
      message: 'Patient notes fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch patient notes'
    });
  }
};

export const createPatientNoteHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const patientId = req.params.id;

  if (!patientId) {
    res.status(400).json({ message: 'Patient id is required' });
    return;
  }

  const authUser = (res.locals as {
    authUser?: { id: string; email: string | null; role: string | null };
  }).authUser;

  if (!authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { title, bodyMarkdown, tags, isPinned } = req.body ?? {};

  if (!bodyMarkdown || typeof bodyMarkdown !== 'string' || bodyMarkdown.trim().length === 0) {
    res.status(400).json({ message: 'bodyMarkdown is required' });
    return;
  }

  try {
    const note = await createPatientNote({
      patientId,
      title: typeof title === 'string' ? title : undefined,
      bodyMarkdown,
      tags: Array.isArray(tags) ? tags.map((t) => String(t)) : undefined,
      isPinned: typeof isPinned === 'boolean' ? isPinned : undefined,
      createdByUserId: authUser.id,
      createdByEmail: authUser.email ?? null,
      createdByRole: authUser.role ?? 'admin'
    });

    const response: ApiResponse<typeof note> = {
      data: note,
      message: 'Patient note created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to create patient note'
    });
  }
};

export const updatePatientNoteHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const noteId = req.params.noteId;

  if (!noteId) {
    res.status(400).json({ message: 'Note id is required' });
    return;
  }

  const authUser = (res.locals as {
    authUser?: { id: string; email: string | null; role: string | null };
  }).authUser;

  if (!authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { title, bodyMarkdown, tags, isPinned, isArchived } = req.body ?? {};

  try {
    const note = await updatePatientNote({
      noteId,
      title: title !== undefined ? String(title) : undefined,
      bodyMarkdown:
        bodyMarkdown !== undefined && typeof bodyMarkdown === 'string'
          ? bodyMarkdown
          : undefined,
      tags: tags === null
        ? null
        : Array.isArray(tags)
          ? tags.map((t) => String(t))
          : undefined,
      isPinned:
        typeof isPinned === 'boolean'
          ? isPinned
          : undefined,
      isArchived:
        typeof isArchived === 'boolean'
          ? isArchived
          : undefined,
      editedByUserId: authUser.id,
      editedByEmail: authUser.email ?? null,
      editedByRole: authUser.role ?? 'admin'
    });

    const response: ApiResponse<typeof note> = {
      data: note,
      message: 'Patient note updated successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (code === 'NOT_FOUND') {
      res.status(404).json({ message: 'Note not found' });
      return;
    }

    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to update patient note'
    });
  }
};

export const deletePatientNoteHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const noteId = req.params.noteId;

  if (!noteId) {
    res.status(400).json({ message: 'Note id is required' });
    return;
  }

  const authUser = (res.locals as {
    authUser?: { id: string; email: string | null; role: string | null };
  }).authUser;

  if (!authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const result = await deletePatientNote(noteId);

    const response: ApiResponse<typeof result> = {
      data: result,
      message: 'Patient note deleted successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (code === 'NOT_FOUND') {
      res.status(404).json({ message: 'Note not found' });
      return;
    }

    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to delete patient note'
    });
  }
};

