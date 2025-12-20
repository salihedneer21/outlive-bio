import { getSupabaseServiceClient } from '@lib/supabase';
import type {
  AdminPatient,
  AdminPatientsQuery,
  AdminPatientsResult,
  IntakeStep,
  PaginationMeta
} from './patients.types';

interface PatientRow {
  id: string;
  user_id: string | null;
  email: string | null;
  created_at: string | null;
}

interface ProfileRow {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  sex_at_birth: string | null;
  intake_step: string | null;
  intake_completed_at: string | null;
  created_at: string | null;
}

const normalizeIntakeStatus = (step: IntakeStep): 'not_started' | 'in_progress' | 'completed' => {
  if (!step) {
    return 'not_started';
  }

  if (step === 'completed') {
    return 'completed';
  }

  return 'in_progress';
};

const buildPaginationMeta = (page: number, pageSize: number, total: number): PaginationMeta => {
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1 && totalPages > 0
  };
};

export const getAdminPatients = async (query: AdminPatientsQuery): Promise<AdminPatientsResult> => {
  const supabase = getSupabaseServiceClient();

  const page = query.page > 0 ? query.page : 1;
  const pageSize = query.pageSize > 0 ? Math.min(query.pageSize, 100) : 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const search = query.search?.trim();

  /*
    Step 1: Fetch patients with pagination, search, and sorting from 'patients' table
    Step 2: Map user_ids from patients to fetch profiles in bulk
    Step 3: Combine patient data with profile data
    Step 4: Return formatted result with pagination metadata

    we can optimize this later with a single query using joins, this needs db changes though
    Fathima needs to add foreign key from patients.user_id to profile.user_id
  */

  // Optional name search: find matching profile.user_id values using a simple ILIKE search.
  // This keeps the implementation database-agnostic while still allowing searching by name.
  let matchingProfileUserIds: string[] = [];
  if (search) {
    const { data: profileMatches, error: profileError } = await supabase
      .from('profile')
      .select('user_id')
      .or(
        [
          `first_name.ilike.%${search}%`,
          `last_name.ilike.%${search}%`,
          `phone.ilike.%${search}%`
        ].join(',')
      );

    if (profileError) {
      throw profileError;
    }

    if (profileMatches) {
      matchingProfileUserIds = Array.from(
        new Set(
          (profileMatches as unknown as ProfileRow[])
            .map((row) => row.user_id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
        )
      );
    }
  }

  let patientsQuery = supabase
    .from('patients')
    .select('id, user_id, email, created_at', { count: 'exact' });

  if (search) {
    // Search by email and any profile that matched first/last name or phone.
    const orFilters: string[] = [`email.ilike.%${search}%`];
    for (const userId of matchingProfileUserIds) {
      orFilters.push(`user_id.eq.${userId}`);
    }

    patientsQuery = patientsQuery.or(orFilters.join(','));
  }

  const sortBy = query.sortBy ?? 'created_at';
  const sortOrder = query.sortOrder ?? 'desc';
  patientsQuery = patientsQuery.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data: patientsData, error: patientsError, count } = await patientsQuery.range(from, to);

  if (patientsError) {
    throw patientsError;
  }

  const safeCount = typeof count === 'number' ? count : patientsData?.length ?? 0;

  if (!patientsData || patientsData.length === 0) {
    return {
      patients: [],
      pagination: buildPaginationMeta(page, pageSize, safeCount)
    };
  }

  const userIds = Array.from(
    new Set(
      patientsData
        .map((patient) => patient.user_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )
  );

  const profilesMap = new Map<string, ProfileRow>();

  if (userIds.length > 0) {
    const { data: profilesData, error: profilesError } = await supabase
      .from('profile')
      .select(
        [
          'user_id',
          'first_name',
          'last_name',
          'phone',
          'date_of_birth',
          'sex_at_birth',
          'intake_step',
          'intake_completed_at',
          'created_at'
        ].join(', ')
      )
      .in('user_id', userIds);

    if (profilesError) {
      throw profilesError;
    }

    if (profilesData) {
      for (const profile of profilesData as unknown as ProfileRow[]) {
        profilesMap.set(profile.user_id, profile);
      }
    }
  }

  const patients: AdminPatient[] = patientsData.map((patient: PatientRow) => {
    const profile = patient.user_id ? profilesMap.get(patient.user_id) ?? null : null;

    const firstName = profile?.first_name ?? null;
    const lastName = profile?.last_name ?? null;
    const fullName =
      firstName || lastName ? [firstName, lastName].filter(Boolean).join(' ') || null : null;

    const rawIntakeStep = profile?.intake_step ?? null;
    const intakeStep = rawIntakeStep as IntakeStep;
    const intakeStatus = normalizeIntakeStatus(intakeStep);

    return {
      id: patient.id,
      userId: patient.user_id,
      email: patient.email ?? null,
      name: {
        first: firstName,
        last: lastName,
        full: fullName
      },
      phone: profile?.phone ?? null,
      dateOfBirth: profile?.date_of_birth ?? null,
      registrationDate: patient.created_at ?? null,
      intake: {
        step: intakeStep,
        status: intakeStatus,
        completedAt: profile?.intake_completed_at ?? null
      },
      sexAtBirth: profile?.sex_at_birth ?? null
    };
  });

  return {
    patients,
    pagination: buildPaginationMeta(page, pageSize, safeCount)
  };
};
