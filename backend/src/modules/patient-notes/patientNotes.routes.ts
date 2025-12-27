import { Router } from 'express';
import { requireAdmin } from '@middleware/auth';
import {
  createPatientNoteHandler,
  deletePatientNoteHandler,
  listPatientNotesHandler,
  updatePatientNoteHandler
} from './patientNotes.controller';

const router = Router();

// List notes for a patient
router.get('/admin/patients/:id/notes', requireAdmin, listPatientNotesHandler);

// Create a new note for a patient
router.post('/admin/patients/:id/notes', requireAdmin, createPatientNoteHandler);

// Update an existing note (pin, archive, edit content, etc.)
router.patch('/admin/notes/:noteId', requireAdmin, updatePatientNoteHandler);

// Permanently delete a note
router.delete('/admin/notes/:noteId', requireAdmin, deletePatientNoteHandler);

export const patientNotesRouter = router;
