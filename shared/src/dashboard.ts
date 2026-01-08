export interface AdminDashboardTotals {
  patients: number;
  products: number;
  categories: number;
  logs: number;
}

export interface AdminDashboardRegistrationPoint {
  date: string;
  count: number;
}

export interface AdminDashboardStats {
  totals: AdminDashboardTotals;
  /** Daily registrations for the last 30 days */
  registrations: AdminDashboardRegistrationPoint[];
}

