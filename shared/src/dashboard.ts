export interface AdminDashboardTotals {
  patients: number;
  products: number;
  categories: number;
  logs: number;
}

export interface AdminDashboardGrowth {
  patients: number | null; // percentage change from previous period
  products: number | null;
  categories: number | null;
  logs: number | null;
}

export interface AdminDashboardRegistrationPoint {
  date: string;
  count: number;
}

export interface StateRegistrationData {
  state: string;
  count: number;
}

export interface GenderDistribution {
  gender: string;
  count: number;
}

export interface OutstandingLab {
  patientId: string;
  patientName: string;
  email: string;
  labProvider: string | null;
  orderedAt: string;
}

export interface AdminDashboardStats {
  totals: AdminDashboardTotals;
  /** Growth percentages compared to previous 30-day period */
  growth: AdminDashboardGrowth;
  /** Daily registrations for the last 30 days */
  registrations: AdminDashboardRegistrationPoint[];
  /** Registrations grouped by US state */
  stateRegistrations: StateRegistrationData[];
  /** Gender distribution of patients */
  genderDistribution: GenderDistribution[];
  /** Labs ordered but not yet completed */
  outstandingLabs: OutstandingLab[];
}

