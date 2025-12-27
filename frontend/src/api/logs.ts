import { apiFetch } from './client';
import type {
  AdminImpersonationLog,
  AdminImpersonationLogsResult,
  AdminImpersonationLogsQuery
} from '@outlive/shared';

export interface ImpersonationLogsResponse {
  data: AdminImpersonationLogsResult;
  message?: string;
}

export const listImpersonationLogs = async (
  params: Partial<AdminImpersonationLogsQuery> = {}
): Promise<ImpersonationLogsResponse> => {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.patientId) searchParams.set('patientId', params.patientId);
  if (params.actorUserId) searchParams.set('actorUserId', params.actorUserId);
  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);

  const query = searchParams.toString();
  const path = `/admin/logs/impersonation${query ? `?${query}` : ''}`;

  return apiFetch<ImpersonationLogsResponse>(path, {
    method: 'GET'
  });
};

