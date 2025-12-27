export type LogType = 'impersonation_login' | string;

export interface CreateLogInput {
  logType: LogType;
  actorUserId: string;
  actorRole: string | null;
  actorEmail: string | null;
  metadata?: Record<string, unknown>;
}

export interface LogRecord {
  id: string;
  logType: LogType;
  actorUserId: string;
  actorRole: string | null;
  actorEmail: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface CreateImpersonationLoginLogInput {
  patientId: string;
  patientEmail: string | null;
  impersonatedUserId: string | null;
  impersonationUrl: string;
  expiresAt?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  actorUserId: string;
  actorRole: string | null;
  actorEmail: string | null;
}
