import { getSupabaseServiceClient } from '@lib/supabase';
import type {
  AdminImpersonationLogDto,
  AdminImpersonationLogsQueryDto,
  AdminImpersonationLogsResultDto,
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
    metadata: {
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

export const getImpersonationLogs = async (
  query: AdminImpersonationLogsQueryDto
): Promise<AdminImpersonationLogsResultDto> => {
  const supabase = getSupabaseServiceClient();

  const page = query.page > 0 ? query.page : 1;
  const pageSize = query.pageSize > 0 ? Math.min(query.pageSize, 100) : 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // First: query logs table as the canonical event stream
  let baseLogsQuery = supabase
    .from('logs')
    .select(
      'id, log_type, actor_user_id, actor_role, actor_email, metadata, created_at',
      { count: 'exact' }
    )
    .eq('log_type', 'impersonation_login')
    .order('created_at', { ascending: false });

  if (query.actorUserId) {
    baseLogsQuery = baseLogsQuery.eq('actor_user_id', query.actorUserId);
  }

  if (query.from) {
    baseLogsQuery = baseLogsQuery.gte('created_at', query.from);
  }

  if (query.to) {
    baseLogsQuery = baseLogsQuery.lte('created_at', query.to);
  }

  if (query.patientId) {
    baseLogsQuery = baseLogsQuery.contains('metadata', { patientId: query.patientId });
  }

  const { data: logRows, error: logsError, count } = await baseLogsQuery.range(from, to);

  if (logsError) {
    throw logsError;
  }

  const logsData = (logRows ?? []) as {
    id: string;
    log_type: string;
    actor_user_id: string;
    actor_role: string | null;
    actor_email: string | null;
    metadata: { patientId?: string } | null;
    created_at: string;
  }[];

  const safeCount = typeof count === 'number' ? count : logsData.length;
  const totalPages = pageSize > 0 ? Math.ceil(safeCount / pageSize) : 0;

  if (logsData.length === 0) {
    return {
      logs: [],
      pagination: {
        page,
        pageSize,
        total: safeCount,
        totalPages,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  }

  const logIds = logsData.map((row) => row.id);

  const { data: detailRows, error: detailError } = await supabase
    .from('impersonation_login_logs')
    .select(
      'log_id, patient_id, patient_email, impersonated_user_id, impersonation_url, ip_address, user_agent'
    )
    .in('log_id', logIds);

  if (detailError) {
    throw detailError;
  }

  const detailsByLogId = new Map<
    string,
    {
      log_id: string;
      patient_id: string;
      patient_email: string | null;
      impersonated_user_id: string | null;
      impersonation_url: string;
      ip_address: string | null;
      user_agent: string | null;
    }
  >();

  for (const row of (detailRows ?? []) as any[]) {
    detailsByLogId.set(row.log_id as string, {
      log_id: row.log_id as string,
      patient_id: row.patient_id as string,
      patient_email: (row.patient_email as string | null) ?? null,
      impersonated_user_id: (row.impersonated_user_id as string | null) ?? null,
      impersonation_url: row.impersonation_url as string,
      ip_address: (row.ip_address as string | null) ?? null,
      user_agent: (row.user_agent as string | null) ?? null
    });
  }

  const logs: AdminImpersonationLogDto[] = logsData.map((log) => {
    const detail = detailsByLogId.get(log.id);

    return {
      id: log.id,
      createdAt: log.created_at,
      actor: {
        id: log.actor_user_id,
        email: log.actor_email ?? null,
        role: log.actor_role ?? null
      },
      patient: {
        id: detail?.patient_id ?? (log.metadata?.patientId ?? 'unknown'),
        email: detail?.patient_email ?? null,
        name: null
      },
      ipAddress: detail?.ip_address ?? null,
      userAgent: detail?.user_agent ?? null,
      impersonationUrl: detail?.impersonation_url ?? ''
    };
  });

  const result: AdminImpersonationLogsResultDto = {
    logs,
    pagination: {
      page,
      pageSize,
      total: safeCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1 && totalPages > 0
    }
  };

  return result;
};
