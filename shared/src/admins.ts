export interface AdminUserName {
  first: string | null;
  last: string | null;
  full: string | null;
}

export interface AdminUser {
  id: string;
  email: string | null;
  role: string | null;
  createdAt: string | null;
  name?: AdminUserName;
}

export interface AdminUsersResult {
  admins: AdminUser[];
}

export interface AdminUserSearchUser {
  id: string;
  email: string | null;
  name: AdminUserName;
  isAdmin: boolean;
}

export interface AdminUserSearchResult {
  users: AdminUserSearchUser[];
}
