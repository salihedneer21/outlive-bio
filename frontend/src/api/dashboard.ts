import { apiFetch } from './client';
import type { AdminDashboardStats } from '@outlive/shared';

export interface DashboardStatsResponse {
  data: AdminDashboardStats;
  message?: string;
}

export const getDashboardStats = async (params: {
  from?: string;
  to?: string;
} = {}): Promise<DashboardStatsResponse> => {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);

  const query = searchParams.toString();
  const path = `/admin/dashboard/stats${query ? `?${query}` : ''}`;

  return apiFetch<DashboardStatsResponse>(path, {
    method: 'GET'
  });
};

