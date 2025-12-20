import type { PaginationMeta } from '@modules/patients/patients.types';
import type { CategoryFrequency } from './categories.constants';

export type { CategoryFrequency } from './categories.constants';

export interface AdminCategory {
  id: number;
  name: string;
  description: string | null;
  color: string;
  frequency: CategoryFrequency;
  order: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminCategoriesQuery {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: 'order' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminCategoriesResult {
  categories: AdminCategory[];
  pagination: PaginationMeta;
}

export interface CreateAdminCategoryInput {
  name: string;
  description?: string | null;
  color: string;
  frequency?: CategoryFrequency;
  order: number;
}

export interface UpdateAdminCategoryInput {
  name?: string;
  description?: string | null;
  color?: string;
  frequency?: CategoryFrequency;
  order?: number;
}
