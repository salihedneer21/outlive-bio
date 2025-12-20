export type IntakeStep =
  | null
  | 'patient_information_completed'
  | 'documents_completed'
  | 'medical_history_completed'
  | 'consent_completed'
  | 'completed'
  | 'in_progress';

export interface AdminPatientIntake {
  step: IntakeStep;
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt: string | null;
}

export interface AdminPatientName {
  first: string | null;
  last: string | null;
  full: string | null;
}

export interface AdminPatient {
  id: string;
  userId: string | null;
  email: string | null;
  name: AdminPatientName;
  phone: string | null;
  dateOfBirth: string | null;
  registrationDate: string | null;
  intake: AdminPatientIntake;
  sexAtBirth: string | null;
}

export interface AdminPatientsQuery {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AdminPatientsResult {
  patients: AdminPatient[];
  pagination: PaginationMeta;
}

