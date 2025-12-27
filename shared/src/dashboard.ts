export interface AdminDashboardTotals {
  patients: number;
  products: number;
  categories: number;
  logs: number;
}

export interface AdminDashboardWeeklyPoint {
  date: string;
  count: number;
}

export interface AdminDashboardStats {
  totals: AdminDashboardTotals;
  weeklyRegistrations: AdminDashboardWeeklyPoint[];
}

