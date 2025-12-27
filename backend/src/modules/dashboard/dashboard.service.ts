import { getSupabaseServiceClient } from '@lib/supabase';
import { getAdminPatientsStats } from '@modules/patients/patients.service';
import type { AdminDashboardStatsDto } from './dashboard.types';

export const getAdminDashboardStats = async (params?: {
  from?: string | null;
  to?: string | null;
}): Promise<AdminDashboardStatsDto> => {
  const supabase = getSupabaseServiceClient();

  const from = params?.from ?? null;
  const to = params?.to ?? null;

  const [patientsStats, productsCountResult, categoriesCountResult, logsCountResult] =
    await Promise.all([
      getAdminPatientsStats({ from: from ?? undefined, to: to ?? undefined }),
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('categories')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('logs')
        .select('id', { count: 'exact', head: true })
    ]);

  if (productsCountResult.error) {
    throw productsCountResult.error;
  }

  if (categoriesCountResult.error) {
    throw categoriesCountResult.error;
  }

  if (logsCountResult.error) {
    throw logsCountResult.error;
  }

  const totalProducts =
    typeof productsCountResult.count === 'number'
      ? productsCountResult.count
      : productsCountResult.data?.length ?? 0;

  const totalCategories =
    typeof categoriesCountResult.count === 'number'
      ? categoriesCountResult.count
      : categoriesCountResult.data?.length ?? 0;

  const totalLogs =
    typeof logsCountResult.count === 'number'
      ? logsCountResult.count
      : logsCountResult.data?.length ?? 0;

  const weeklyRegistrations = patientsStats.dailyRegistrations.slice(-7);

  const result: AdminDashboardStatsDto = {
    totals: {
      patients: patientsStats.totalPatients,
      products: totalProducts,
      categories: totalCategories,
      logs: totalLogs
    },
    weeklyRegistrations
  };

  return result;
};

