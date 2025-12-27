import type { PaginationMeta } from './patients';

export interface AdminLogActor {
  id: string;
  email: string | null;
  role: string | null;
}

export interface AdminImpersonationLogPatient {
  id: string;
  email: string | null;
  name: string | null;
}

export interface AdminImpersonationLog {
  id: string;
  createdAt: string;
  actor: AdminLogActor;
  patient: AdminImpersonationLogPatient;
  ipAddress: string | null;
  userAgent: string | null;
  impersonationUrl: string;
}

export interface AdminImpersonationLogsQuery {
  page: number;
  pageSize: number;
  patientId?: string;
  actorUserId?: string;
  from?: string;
  to?: string;
}

export interface AdminImpersonationLogsResult {
  logs: AdminImpersonationLog[];
  pagination: PaginationMeta;
}

