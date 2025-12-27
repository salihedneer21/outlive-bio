import { getSupabaseServiceClient } from '@lib/supabase';
import { env } from '@config/env';
import type {
  AdminComprehensiveIntake,
  AdminPatient,
  AdminPatientProfile,
  AdminPatientsDailyRegistrationsPoint,
  AdminPatientsQuery,
  AdminPatientsResult,
  AdminPatientsStats,
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

interface FullProfileRow extends ProfileRow {
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip_code: string | null;
  weight: number | null;
  height_inches: number | null;
  drivers_license_url: string | null;
  profile_picture_url: string | null;
  refund_policy_consent_date: string | null;
  terms_conditions_consent_date: string | null;
  privacy_policy_consent_date: string | null;
  consent_signature_url: string | null;
  lab_provider: string | null;
  requires_at_home_phlebotomy: boolean | null;
  phlebotomy_eligible: boolean | null;
  selected_phlebotomy: boolean | null;
  subscription_tier: string | null;
  pre_selected_test_id: string | null;
  test_ordered: boolean | null;
  test_ordered_at: string | null;
}

interface ComprehensiveIntakeRow {
  id: string;
  user_id: string;
  occupation: string | null;
  typical_weekday_schedule: string | null;
  travel_frequently: boolean | null;
  cardio_days_per_week: number | null;
  strength_days_per_week: number | null;
  mobility_days_per_week: number | null;
  alcohol_frequency: string | null;
  health_priorities: string[] | null;
  priorities_reason: string | null;
  sleep_quality: string | null;
  sleep_issues: string[] | null;
  current_diet: string | null;
  diet_other: string | null;
  experience_expectations: string | null;
  involvement_level: string | null;
  data_research_permission: boolean | null;
  stress_level: string | null;
  completed: boolean | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  height: string | null;
  height_unit: string | null;
  height_feet: string | null;
  height_inches: string | null;
  current_weight: string | null;
  weight_unit: string | null;
  diet_history: string | null;
  nutrition_self_assessment: string | null;
  nicotine_use: boolean | null;
  nicotine_type: string | null;
  nicotine_frequency: string | null;
  alcohol_drinks_per_day: string | null;
  alcohol_binge_drinking: string | null;
  other_health_priority: string | null;
  biggest_difficulties: string | null;
  medical_conditions: unknown[] | null;
  cancer_type: string | null;
  other_conditions: string | null;
  family_members: unknown[] | null;
  last_physical_exam: string | null;
  screenings_completed: unknown[] | null;
  uploaded_lab_ids: unknown[] | null;
  injury_history: string | null;
  snoring: string | null;
  other_medical_condition: string | null;
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

const mapProfileRowToAdminProfile = (
  patient: PatientRow,
  profile: FullProfileRow
): AdminPatientProfile => {
  const intakeStep = (profile.intake_step ?? null) as IntakeStep;

  return {
    userId: profile.user_id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    phone: profile.phone,
    email: patient.email ?? null,
    dateOfBirth: profile.date_of_birth,
    sexAtBirth: profile.sex_at_birth,
    address: {
      street: profile.address_street,
      city: profile.address_city,
      state: profile.address_state,
      zipCode: profile.address_zip_code
    },
    weight: profile.weight,
    heightInches: profile.height_inches,
    driversLicenseUrl: profile.drivers_license_url,
    profilePictureUrl: profile.profile_picture_url,
    intakeStep,
    intakeCompletedAt: profile.intake_completed_at,
    consents: {
      refundPolicyConsentDate: profile.refund_policy_consent_date,
      termsConditionsConsentDate: profile.terms_conditions_consent_date,
      privacyPolicyConsentDate: profile.privacy_policy_consent_date,
      consentSignatureUrl: profile.consent_signature_url
    },
    lab: {
      labProvider: profile.lab_provider,
      requiresAtHomePhlebotomy: Boolean(profile.requires_at_home_phlebotomy),
      phlebotomyEligible: Boolean(profile.phlebotomy_eligible),
      selectedPhlebotomy: Boolean(profile.selected_phlebotomy),
      subscriptionTier: profile.subscription_tier,
      preSelectedTestId: profile.pre_selected_test_id,
      testOrdered: Boolean(profile.test_ordered),
      testOrderedAt: profile.test_ordered_at
    }
  };
};

const mapComprehensiveIntakeRowToAdmin = (
  row: ComprehensiveIntakeRow
): AdminComprehensiveIntake => {
  const completed = Boolean(row.completed);

  return {
    id: row.id,
    userId: row.user_id,
    occupation: row.occupation,
    typicalWeekdaySchedule: row.typical_weekday_schedule,
    travelFrequently: row.travel_frequently,
    cardioDaysPerWeek: row.cardio_days_per_week,
    strengthDaysPerWeek: row.strength_days_per_week,
    mobilityDaysPerWeek: row.mobility_days_per_week,
    alcoholFrequency: row.alcohol_frequency,
    healthPriorities: row.health_priorities,
    prioritiesReason: row.priorities_reason,
    sleepQuality: row.sleep_quality,
    sleepIssues: row.sleep_issues,
    currentDiet: row.current_diet,
    dietOther: row.diet_other,
    experienceExpectations: row.experience_expectations,
    involvementLevel: row.involvement_level,
    dataResearchPermission: row.data_research_permission,
    stressLevel: row.stress_level,
    completed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    height: row.height,
    heightUnit: row.height_unit,
    heightFeet: row.height_feet,
    heightInches: row.height_inches,
    currentWeight: row.current_weight,
    weightUnit: row.weight_unit,
    dietHistory: row.diet_history,
    nutritionSelfAssessment: row.nutrition_self_assessment,
    nicotineUse: row.nicotine_use,
    nicotineType: row.nicotine_type,
    nicotineFrequency: row.nicotine_frequency,
    alcoholDrinksPerDay: row.alcohol_drinks_per_day,
    alcoholBingeDrinking: row.alcohol_binge_drinking,
    otherHealthPriority: row.other_health_priority,
    biggestDifficulties: row.biggest_difficulties,
    medicalConditions: row.medical_conditions,
    cancerType: row.cancer_type,
    otherConditions: row.other_conditions,
    familyMembers: row.family_members,
    lastPhysicalExam: row.last_physical_exam,
    screeningsCompleted: row.screenings_completed,
    uploadedLabIds: row.uploaded_lab_ids,
    injuryHistory: row.injury_history,
    snoring: row.snoring,
    otherMedicalCondition: row.other_medical_condition
  };
};

const formatDate = (value: string | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const getDefaultDateRange = (): { from: string; to: string } => {
  const today = new Date();
  const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const from = new Date(to);
  from.setUTCDate(to.getUTCDate() - 29);

  const format = (d: Date): string => d.toISOString().slice(0, 10);

  return {
    from: format(from),
    to: format(to)
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

export const getAdminPatientsStats = async (params?: {
  from?: string | null;
  to?: string | null;
}): Promise<AdminPatientsStats> => {
  const supabase = getSupabaseServiceClient();

  const defaultRange = getDefaultDateRange();
  const from = params?.from || defaultRange.from;
  const to = params?.to || defaultRange.to;

  const [{ count: patientsCount, error: patientsCountError }, { data: profilesData, error: profilesError }, { data: registrationsData, error: registrationsError }] =
    await Promise.all([
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('profile').select('sex_at_birth, intake_step'),
      supabase
        .from('patients')
        .select('created_at')
        .gte('created_at', from)
        .lte('created_at', to)
    ]);

  if (patientsCountError) {
    throw patientsCountError;
  }

  if (profilesError) {
    throw profilesError;
  }

  if (registrationsError) {
    throw registrationsError;
  }

  const totalPatients = typeof patientsCount === 'number' ? patientsCount : 0;

  const genderCounts: Record<string, number> = {};
  const intakeStatusCounts: AdminPatientsStats['intakeStatusCounts'] = {
    not_started: 0,
    in_progress: 0,
    completed: 0
  };

  if (profilesData) {
    for (const profile of profilesData as Array<{ sex_at_birth: string | null; intake_step: string | null }>) {
      const genderKey = profile.sex_at_birth && profile.sex_at_birth.trim()
        ? profile.sex_at_birth.trim().toLowerCase()
        : 'unknown';
      genderCounts[genderKey] = (genderCounts[genderKey] ?? 0) + 1;

      const status = normalizeIntakeStatus(profile.intake_step as IntakeStep);
      intakeStatusCounts[status] += 1;
    }
  }

  const dailyRegistrationsMap = new Map<string, number>();

  // Initialize all days in range with 0 for a continuous series.
  {
    const start = new Date(from);
    const end = new Date(to);
    const formatDay = (d: Date): string => d.toISOString().slice(0, 10);

    const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    const endDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

    while (cursor <= endDay) {
      const key = formatDay(cursor);
      dailyRegistrationsMap.set(key, 0);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  if (registrationsData) {
    for (const row of registrationsData as Array<{ created_at: string | null }>) {
      const iso = formatDate(row.created_at);
      if (!iso) continue;
      const dayKey = iso.slice(0, 10);
      if (!dailyRegistrationsMap.has(dayKey)) {
        dailyRegistrationsMap.set(dayKey, 0);
      }
      dailyRegistrationsMap.set(dayKey, (dailyRegistrationsMap.get(dayKey) ?? 0) + 1);
    }
  }

  const dailyRegistrations: AdminPatientsDailyRegistrationsPoint[] = Array.from(
    dailyRegistrationsMap.entries()
  )
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, count]) => ({ date, count }));

  return {
    totalPatients,
    genderCounts,
    intakeStatusCounts,
    dailyRegistrations
  };
};

export const getAdminPatientProfile = async (
  patientId: string
): Promise<{ patient: AdminPatient; profile: AdminPatientProfile | null }> => {
  const supabase = getSupabaseServiceClient();

  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, user_id, email, created_at')
    .eq('id', patientId)
    .single();

  if (patientError || !patient) {
    const err: Error & { code?: string } = new Error('Patient not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const patientRow = patient as PatientRow;

  let profile: AdminPatientProfile | null = null;
  let intakeStep: IntakeStep = null;
  let intakeCompletedAt: string | null = null;
  let firstName: string | null = null;
  let lastName: string | null = null;
  let phone: string | null = null;
  let dateOfBirth: string | null = null;
  let sexAtBirth: string | null = null;

  if (patientRow.user_id) {
    const { data: profileData, error: profileError } = await supabase
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
          'created_at',
          'address_street',
          'address_city',
          'address_state',
          'address_zip_code',
          'weight',
          'height_inches',
          'drivers_license_url',
          'profile_picture_url',
          'refund_policy_consent_date',
          'terms_conditions_consent_date',
          'privacy_policy_consent_date',
          'consent_signature_url',
          'lab_provider',
          'requires_at_home_phlebotomy',
          'phlebotomy_eligible',
          'selected_phlebotomy',
          'subscription_tier',
          'pre_selected_test_id',
          'test_ordered',
          'test_ordered_at'
        ].join(', ')
      )
      .eq('user_id', patientRow.user_id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (profileData) {
      const fullProfile = profileData as unknown as FullProfileRow;
      profile = mapProfileRowToAdminProfile(patientRow, fullProfile);
      intakeStep = profile.intakeStep;
      intakeCompletedAt = profile.intakeCompletedAt;
      firstName = profile.firstName;
      lastName = profile.lastName;
      phone = profile.phone;
      dateOfBirth = profile.dateOfBirth;
      sexAtBirth = profile.sexAtBirth;
    }
  }

  const fullName =
    firstName || lastName ? [firstName, lastName].filter(Boolean).join(' ') || null : null;

  const intakeStatus = normalizeIntakeStatus(intakeStep);

  const patientSummary: AdminPatient = {
    id: patientRow.id,
    userId: patientRow.user_id,
    email: patientRow.email ?? null,
    name: {
      first: firstName,
      last: lastName,
      full: fullName
    },
    phone,
    dateOfBirth,
    registrationDate: patientRow.created_at ?? null,
    intake: {
      step: intakeStep,
      status: intakeStatus,
      completedAt: intakeCompletedAt
    },
    sexAtBirth
  };

  return {
    patient: patientSummary,
    profile
  };
};

export const getAdminPatientComprehensiveIntake = async (
  patientId: string
): Promise<{ patient: AdminPatient; comprehensiveIntake: AdminComprehensiveIntake | null }> => {
  const supabase = getSupabaseServiceClient();

  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, user_id, email, created_at')
    .eq('id', patientId)
    .single();

  if (patientError || !patient) {
    const err: Error & { code?: string } = new Error('Patient not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const patientRow = patient as PatientRow;

  let firstName: string | null = null;
  let lastName: string | null = null;
  let phone: string | null = null;
  let dateOfBirth: string | null = null;
  let sexAtBirth: string | null = null;
  let intakeStep: IntakeStep = null;
  let intakeCompletedAt: string | null = null;

  if (patientRow.user_id) {
    const { data: profileData, error: profileError } = await supabase
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
          'intake_completed_at'
        ].join(', ')
      )
      .eq('user_id', patientRow.user_id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (profileData) {
      const profile = profileData as unknown as ProfileRow;
      firstName = profile.first_name;
      lastName = profile.last_name;
      phone = profile.phone;
      dateOfBirth = profile.date_of_birth;
      sexAtBirth = profile.sex_at_birth;
      intakeStep = (profile.intake_step ?? null) as IntakeStep;
      intakeCompletedAt = profile.intake_completed_at;
    }
  }

  let comprehensiveIntake: AdminComprehensiveIntake | null = null;

  if (patientRow.user_id) {
    const { data: intakeRows, error: intakeError } = await supabase
      .from('comprehensive_intake')
      .select('*')
      .eq('user_id', patientRow.user_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (intakeError) {
      throw intakeError;
    }

    if (intakeRows && intakeRows.length > 0) {
      const row = intakeRows[0] as unknown as ComprehensiveIntakeRow;
      comprehensiveIntake = mapComprehensiveIntakeRowToAdmin(row);
    }
  }

  const fullName =
    firstName || lastName ? [firstName, lastName].filter(Boolean).join(' ') || null : null;

  const intakeStatus = normalizeIntakeStatus(intakeStep);

  const patientSummary: AdminPatient = {
    id: patientRow.id,
    userId: patientRow.user_id,
    email: patientRow.email ?? null,
    name: {
      first: firstName,
      last: lastName,
      full: fullName
    },
    phone,
    dateOfBirth,
    registrationDate: patientRow.created_at ?? null,
    intake: {
      step: intakeStep,
      status: intakeStatus,
      completedAt: intakeCompletedAt
    },
    sexAtBirth
  };

  return {
    patient: patientSummary,
    comprehensiveIntake
  };
};

/**
 * Generate a magic link that allows an admin to impersonate a patient
 * and log into the public portal as that patient.
 */
export const generatePatientImpersonationLink = async (
  patientId: string,
  initiatedByUserId?: string
): Promise<string> => {
  const supabase = getSupabaseServiceClient();
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, email')
    .eq('id', patientId)
    .single();

  if (patientError || !patient) {
    const err: Error & { code?: string } = new Error('Patient not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (!patient.email) {
    const err: Error & { code?: string } = new Error('Patient does not have an email address');
    err.code = 'NO_EMAIL';
    throw err;
  }

  let redirectTo: string | undefined;

  if (env.PATIENT_PORTAL_BASE_URL) {
    try {
      // Build the final destination path in the patient portal
      const baseUrl = new URL(env.PATIENT_PORTAL_BASE_URL);
      const dashboardUrl = new URL('/patient/dashboard', baseUrl);
      if (initiatedByUserId) {
        dashboardUrl.searchParams.set('impersonatedBy', initiatedByUserId);
      }

      // Route magic-link callbacks through the public auth page, which
      // already knows how to handle Supabase hash-based tokens and then
      // redirect back using the `redirect` query param.
      const authUrl = new URL('/auth', baseUrl);
      authUrl.searchParams.set(
        'redirect',
        `${dashboardUrl.pathname}${dashboardUrl.search}`
      );

      redirectTo = authUrl.toString();
    } catch {
      // If the URL construction fails for any reason, fall back to Supabase default redirect.
      redirectTo = undefined;
    }
  }

  const payload: any = {
    type: 'magiclink',
    email: patient.email
  };

  if (redirectTo) {
    payload.options = { redirectTo };
  }

  const {
    data: linkData,
    error: linkError
  } = await (supabase.auth.admin.generateLink(payload) as Promise<{
    data: { properties?: { action_link?: string | null } } | null;
    error: Error | null;
  }>);

  if (linkError || !linkData?.properties?.action_link) {
    const err: Error & { code?: string } = new Error('Failed to generate impersonation link');
    err.code = 'LINK_ERROR';
    throw err;
  }

  return linkData.properties.action_link;
};
