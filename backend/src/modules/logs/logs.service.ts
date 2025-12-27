import { getSupabaseServiceClient } from '@lib/supabase';
import type {
  CreateImpersonationLoginLogInput,
  CreateLogInput,
  LogRecord
} from './logs.types';

export const createLog = async (input: CreateLogInput): Promise<LogRecord> => {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('logs')
    .insert({
      log_type: input.logType,
      actor_user_id: input.actorUserId,
      actor_role: input.actorRole,
      actor_email: input.actorEmail,
      metadata: input.metadata ?? null
    })
    .select('id, log_type, actor_user_id, actor_role, actor_email, metadata, created_at')
    .single();

  if (error || !data) {
    throw error ?? new Error('Failed to create log');
  }

  return {
    id: data.id as string,
    logType: data.log_type as string,
    actorUserId: data.actor_user_id as string,
    actorRole: (data.actor_role as string | null) ?? null,
    actorEmail: (data.actor_email as string | null) ?? null,
    metadata: (data.metadata as Record<string, unknown> | null) ?? null,
    createdAt: data.created_at as string
  };
};

export const createImpersonationLoginLog = async (
  input: CreateImpersonationLoginLogInput
): Promise<void> => {
  const supabase = getSupabaseServiceClient();

  const log = await createLog({
    logType: 'impersonation_login',
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    actorEmail: input.actorEmail,
    context: {
      patientId: input.patientId
    }
  });

  const { error } = await supabase.from('impersonation_login_logs').insert({
    log_id: log.id,
    patient_id: input.patientId,
    patient_email: input.patientEmail,
    impersonated_user_id: input.impersonatedUserId,
    impersonation_url: input.impersonationUrl,
    expires_at: input.expiresAt ?? null,
    ip_address: input.ipAddress ?? null,
    user_agent: input.userAgent ?? null
  });

  if (error) {
    throw error;
  }
};
