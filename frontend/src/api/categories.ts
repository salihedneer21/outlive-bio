import { apiFetch } from './client';
import type {
  AdminCategory,
  AdminCategoriesResult,
  CreateAdminCategoryInput,
  UpdateAdminCategoryInput
} from '@outlive/shared';

export interface ListCategoriesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: 'order' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface ListCategoriesResponse {
  data: AdminCategoriesResult;
  message: string;
}

export interface CategoryResponse {
  data: AdminCategory;
  message: string;
}

export interface DeleteCategoryResponse {
  data: { id: number };
  message: string;
}

export const listCategories = async (
  params: ListCategoriesParams = {}
): Promise<ListCategoriesResponse> => {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.search) searchParams.set('search', params.search);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const query = searchParams.toString();
  const path = `/admin/categories${query ? `?${query}` : ''}`;

  return apiFetch<ListCategoriesResponse>(path, {
    method: 'GET'
  });
};

export const getCategory = async (id: number): Promise<CategoryResponse> => {
  return apiFetch<CategoryResponse>(`/admin/categories/${id}`, {
    method: 'GET'
  });
};

export const createCategory = async (
  input: CreateAdminCategoryInput
): Promise<CategoryResponse> => {
  return apiFetch<CategoryResponse>('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(input)
  });
};

export const updateCategory = async (
  id: number,
  input: UpdateAdminCategoryInput
): Promise<CategoryResponse> => {
  return apiFetch<CategoryResponse>(`/admin/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
};

export const deleteCategory = async (id: number): Promise<DeleteCategoryResponse> => {
  return apiFetch<DeleteCategoryResponse>(`/admin/categories/${id}`, {
    method: 'DELETE'
  });
};
