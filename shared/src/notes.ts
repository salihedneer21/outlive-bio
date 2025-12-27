export interface AdminPatientNoteAuthor {
  id: string;
  email: string | null;
  role: string | null;
}

export interface AdminPatientNote {
  id: string;
  patientId: string;
  title: string | null;
  bodyMarkdown: string;
  bodyPlaintext: string | null;
  tags: string[] | null;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: AdminPatientNoteAuthor;
  lastEditedBy: AdminPatientNoteAuthor | null;
}

export interface AdminPatientNotesQuery {
  page: number;
  pageSize: number;
  search?: string;
  includeArchived?: boolean;
}

