import { getSupabaseServiceClient } from '@lib/supabase';
import { getAdminPatientsStats } from '@modules/patients/patients.service';
import type { AdminDashboardStatsDto } from './dashboard.types';
import type { StateRegistrationData, GenderDistribution, OutstandingLab } from '@outlive/shared';

// Standard US state abbreviations for validation
const US_STATE_CODES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]);

// Map full state names to abbreviations
const STATE_NAME_TO_CODE: Record<string, string> = {
  'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR',
  'CALIFORNIA': 'CA', 'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE',
  'FLORIDA': 'FL', 'GEORGIA': 'GA', 'HAWAII': 'HI', 'IDAHO': 'ID',
  'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA', 'KANSAS': 'KS',
  'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
  'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS',
  'MISSOURI': 'MO', 'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV',
  'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
  'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH', 'OKLAHOMA': 'OK',
  'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT',
  'VERMONT': 'VT', 'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV',
  'WISCONSIN': 'WI', 'WYOMING': 'WY', 'DISTRICT OF COLUMBIA': 'DC', 'WASHINGTON DC': 'DC'
};

const normalizeStateCode = (state: string | null): string | null => {
  if (!state) return null;
  const normalized = state.trim().toUpperCase();

  // Check if it's already a valid abbreviation
  if (US_STATE_CODES.has(normalized)) {
    return normalized;
  }

  // Try to match full state name
  const code = STATE_NAME_TO_CODE[normalized];
  return code ?? null;
};

// Helper to calculate percentage change
const calculateGrowth = (current: number, previous: number): number | null => {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return Math.round(((current - previous) / previous) * 100);
};

export const getAdminDashboardStats = async (params?: {
  from?: string | null;
  to?: string | null;
}): Promise<AdminDashboardStatsDto> => {
  const supabase = getSupabaseServiceClient();

  const from = params?.from ?? null;
  const to = params?.to ?? null;

  // Calculate date range for growth comparison (last 30 days vs previous 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const currentPeriodStart = thirtyDaysAgo.toISOString();
  const previousPeriodStart = sixtyDaysAgo.toISOString();
  const previousPeriodEnd = thirtyDaysAgo.toISOString();

  const [
    patientsStats,
    productsCountResult,
    categoriesCountResult,
    logsCountResult,
    // Previous period counts for growth calculation
    prevPatientsResult,
    prevProductsResult,
    prevLogsResult
  ] = await Promise.all([
    getAdminPatientsStats({ from: from ?? undefined, to: to ?? undefined }),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('categories')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('logs')
      .select('id', { count: 'exact', head: true }),
    // Previous 30 days patient count
    supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', previousPeriodStart)
      .lt('created_at', previousPeriodEnd),
    // Previous 30 days products count
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', previousPeriodStart)
      .lt('created_at', previousPeriodEnd),
    // Previous 30 days logs count
    supabase
      .from('logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', previousPeriodStart)
      .lt('created_at', previousPeriodEnd)
  ]);

  // Current period patient count (last 30 days)
  const currentPatientsResult = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', currentPeriodStart);

  const currentProductsResult = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', currentPeriodStart);

  const currentLogsResult = await supabase
    .from('logs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', currentPeriodStart);

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

  // Fetch state registrations with date filtering
  let stateRegistrations: StateRegistrationData[] = [];

  try {
    // Get patients within date range, then join with profile for state
    let patientsQuery = supabase
      .from('patients')
      .select('user_id, created_at');

    if (from) {
      patientsQuery = patientsQuery.gte('created_at', from);
    }
    if (to) {
      patientsQuery = patientsQuery.lte('created_at', to);
    }

    const { data: patientsData, error: patientsError } = await patientsQuery;

    if (patientsError) {
      console.error('Error fetching patients for state data:', patientsError);
    } else if (patientsData && patientsData.length > 0) {
      // Get user IDs from patients
      const userIds = patientsData
        .map(p => p.user_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);

      if (userIds.length > 0) {
        // Fetch profiles with address_state for these users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profile')
          .select('user_id, address_state')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles for state data:', profilesError);
        } else if (profilesData && profilesData.length > 0) {
          // Aggregate by state
          const stateCounts = new Map<string, number>();

          for (const profile of profilesData) {
            const rawState = profile.address_state as string | null;
            const stateCode = normalizeStateCode(rawState);
            if (stateCode) {
              stateCounts.set(stateCode, (stateCounts.get(stateCode) ?? 0) + 1);
            }
          }

          // Convert to array and sort by count descending
          stateRegistrations = Array.from(stateCounts.entries())
            .map(([state, count]) => ({ state, count }))
            .sort((a, b) => b.count - a.count);
        }
      }
    }
  } catch (err) {
    console.error('Error fetching state registrations:', err);
  }

  // Calculate growth percentages
  const currentPatients = currentPatientsResult.count ?? 0;
  const prevPatients = prevPatientsResult.count ?? 0;
  const currentProducts = currentProductsResult.count ?? 0;
  const prevProducts = prevProductsResult.count ?? 0;
  const currentLogs = currentLogsResult.count ?? 0;
  const prevLogs = prevLogsResult.count ?? 0;

  // Convert gender counts to distribution array
  const genderDistribution: GenderDistribution[] = Object.entries(patientsStats.genderCounts)
    .map(([gender, count]) => ({
      gender: gender.charAt(0).toUpperCase() + gender.slice(1), // Capitalize
      count
    }))
    .sort((a, b) => b.count - a.count);

  // Fetch outstanding labs (labs ordered but pending results)
  let outstandingLabs: OutstandingLab[] = [];
  try {
    // Get patients with tests ordered
    const { data: patientsWithLabs, error: labsError } = await supabase
      .from('patients')
      .select('id, email, user_id')
      .order('created_at', { ascending: false });

    if (!labsError && patientsWithLabs && patientsWithLabs.length > 0) {
      const userIds = patientsWithLabs
        .map(p => p.user_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);

      if (userIds.length > 0) {
        // Get profiles with test_ordered = true
        const { data: profilesWithLabs, error: profilesLabsError } = await supabase
          .from('profile')
          .select('user_id, first_name, last_name, lab_provider, test_ordered, test_ordered_at')
          .in('user_id', userIds)
          .eq('test_ordered', true)
          .not('test_ordered_at', 'is', null)
          .order('test_ordered_at', { ascending: false })
          .limit(10);

        if (!profilesLabsError && profilesWithLabs) {
          // Create a map for quick patient lookup
          const patientMap = new Map(
            patientsWithLabs.map(p => [p.user_id, p])
          );

          outstandingLabs = profilesWithLabs
            .filter(profile => profile.test_ordered_at)
            .map(profile => {
              const patient = patientMap.get(profile.user_id);
              const firstName = (profile.first_name as string | null) ?? '';
              const lastName = (profile.last_name as string | null) ?? '';
              const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';

              return {
                patientId: patient?.id ?? '',
                patientName: fullName,
                email: patient?.email ?? '',
                labProvider: profile.lab_provider as string | null,
                orderedAt: profile.test_ordered_at as string
              };
            })
            .filter(lab => lab.patientId);
        }
      }
    }
  } catch (err) {
    console.error('Error fetching outstanding labs:', err);
  }

  const result: AdminDashboardStatsDto = {
    totals: {
      patients: patientsStats.totalPatients,
      products: totalProducts,
      categories: totalCategories,
      logs: totalLogs
    },
    growth: {
      patients: calculateGrowth(currentPatients, prevPatients),
      products: calculateGrowth(currentProducts, prevProducts),
      categories: null, // Categories don't have created_at typically
      logs: calculateGrowth(currentLogs, prevLogs)
    },
    registrations: patientsStats.dailyRegistrations,
    stateRegistrations,
    genderDistribution,
    outstandingLabs
  };

  return result;
};

