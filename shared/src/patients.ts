export type IntakeStep =
  | null
  | 'patient_information_completed'
  | 'documents_completed'
  | 'medical_history_completed'
  | 'consent_completed'
  | 'completed'
  | 'in_progress';

export interface AdminPatientIntake {
  step: IntakeStep;
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt: string | null;
}

export interface AdminPatientName {
  first: string | null;
  last: string | null;
  full: string | null;
}

export interface AdminPatient {
  id: string;
  userId: string | null;
  email: string | null;
  name: AdminPatientName;
  phone: string | null;
  dateOfBirth: string | null;
  registrationDate: string | null;
  intake: AdminPatientIntake;
  sexAtBirth: string | null;
}

export interface AdminPatientsQuery {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AdminPatientsResult {
  patients: AdminPatient[];
  pagination: PaginationMeta;
}

export interface AdminPatientsDailyRegistrationsPoint {
  date: string;
  count: number;
}

export interface AdminPatientsStats {
  totalPatients: number;
  genderCounts: Record<string, number>;
  intakeStatusCounts: {
    not_started: number;
    in_progress: number;
    completed: number;
  };
  dailyRegistrations: AdminPatientsDailyRegistrationsPoint[];
}

export interface AdminPatientProfile {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  sexAtBirth: string | null;
  address: {
    street: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
  };
  weight: number | null;
  heightInches: number | null;
  driversLicenseUrl: string | null;
  profilePictureUrl: string | null;
  intakeStep: IntakeStep;
  intakeCompletedAt: string | null;
  consents: {
    refundPolicyConsentDate: string | null;
    termsConditionsConsentDate: string | null;
    privacyPolicyConsentDate: string | null;
    consentSignatureUrl: string | null;
  };
  lab: {
    labProvider: string | null;
    requiresAtHomePhlebotomy: boolean;
    phlebotomyEligible: boolean;
    selectedPhlebotomy: boolean;
    subscriptionTier: string | null;
    preSelectedTestId: string | null;
    testOrdered: boolean;
    testOrderedAt: string | null;
  };
}

export interface AdminComprehensiveIntake {
  id: string;
  userId: string;
  occupation: string | null;
  typicalWeekdaySchedule: string | null;
  travelFrequently: boolean | null;
  cardioDaysPerWeek: number | null;
  strengthDaysPerWeek: number | null;
  mobilityDaysPerWeek: number | null;
  alcoholFrequency: string | null;
  healthPriorities: string[] | null;
  prioritiesReason: string | null;
  sleepQuality: string | null;
  sleepIssues: string[] | null;
  currentDiet: string | null;
  dietOther: string | null;
  experienceExpectations: string | null;
  involvementLevel: string | null;
  dataResearchPermission: boolean | null;
  stressLevel: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  height: string | null;
  heightUnit: string | null;
  heightFeet: string | null;
  heightInches: string | null;
  currentWeight: string | null;
  weightUnit: string | null;
  dietHistory: string | null;
  nutritionSelfAssessment: string | null;
  nicotineUse: boolean | null;
  nicotineType: string | null;
  nicotineFrequency: string | null;
  alcoholDrinksPerDay: string | null;
  alcoholBingeDrinking: string | null;
  otherHealthPriority: string | null;
  biggestDifficulties: string | null;
  medicalConditions: string[] | null;
  cancerType: string | null;
  otherConditions: string | null;
  familyMembers: unknown[] | null;
  lastPhysicalExam: string | null;
  screeningsCompleted: string[] | null;
  uploadedLabIds: string[] | null;
  injuryHistory: string | null;
  snoring: string | null;
  otherMedicalCondition: string | null;
}
