import { getSupabaseServiceClient } from '@lib/supabase';
import type {
  AdminCategory,
  AdminCategoriesQuery,
  AdminCategoriesResult,
  CreateAdminCategoryInput,
  UpdateAdminCategoryInput
} from './categories.types';
import type { PaginationMeta } from '@modules/patients/patients.types';
import { DEFAULT_CATEGORY_FREQUENCY, isCategoryFrequency } from './categories.constants';
import type { CategoryFrequency } from './categories.constants';

interface CategoryRow {
  id: number;
  name: string;
  description: string | null;
  color: string;
  frequency: string | null;
  order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

const normalizeFrequency = (frequency: string | null): CategoryFrequency => {
  if (isCategoryFrequency(frequency)) {
    return frequency;
  }

  return DEFAULT_CATEGORY_FREQUENCY;
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

const mapCategoryRowToAdminCategory = (row: CategoryRow): AdminCategory => {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    color: row.color,
    frequency: normalizeFrequency(row.frequency),
    order: typeof row.order === 'number' ? row.order : 0,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null
  };
};

export const getAdminCategories = async (
  query: AdminCategoriesQuery
): Promise<AdminCategoriesResult> => {
  const supabase = getSupabaseServiceClient();

  const page = query.page > 0 ? query.page : 1;
  const pageSize = query.pageSize > 0 ? Math.min(query.pageSize, 100) : 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const search = query.search?.trim();

  let categoriesQuery = supabase
    .from('categories')
    .select('id, name, description, color, frequency, order, created_at, updated_at', {
      count: 'exact'
    });

  if (search) {
    categoriesQuery = categoriesQuery.ilike('name', `%${search}%`);
  }

  const sortBy = query.sortBy ?? 'order';
  const sortOrder = query.sortOrder ?? 'asc';

  categoriesQuery = categoriesQuery.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error, count } = await categoriesQuery.range(from, to);

  if (error) {
    throw error;
  }

  const safeCount = typeof count === 'number' ? count : data?.length ?? 0;

  if (!data || data.length === 0) {
    return {
      categories: [],
      pagination: buildPaginationMeta(page, pageSize, safeCount)
    };
  }

  const categories: AdminCategory[] = (data as unknown as CategoryRow[]).map(
    mapCategoryRowToAdminCategory
  );

  return {
    categories,
    pagination: buildPaginationMeta(page, pageSize, safeCount)
  };
};

export const getAdminCategoryById = async (id: number): Promise<AdminCategory> => {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, description, color, frequency, order, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const notFoundError: Error & { code?: string } = new Error('Category not found');
    notFoundError.code = 'NOT_FOUND';
    throw notFoundError;
  }

  return mapCategoryRowToAdminCategory(data as CategoryRow);
};

export const createAdminCategory = async (
  input: CreateAdminCategoryInput
): Promise<AdminCategory> => {
  const supabase = getSupabaseServiceClient();

  const payload = {
    name: input.name,
    description: input.description ?? null,
    color: input.color,
    frequency: input.frequency ?? DEFAULT_CATEGORY_FREQUENCY,
    order: input.order
  };

  const { data, error } = await supabase
    .from('categories')
    .insert([payload])
    .select('id, name, description, color, frequency, order, created_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return mapCategoryRowToAdminCategory(data as CategoryRow);
};

export const updateAdminCategory = async (
  id: number,
  input: UpdateAdminCategoryInput
): Promise<AdminCategory> => {
  const existing = await getAdminCategoryById(id);

  if (typeof input.frequency !== 'undefined' && input.frequency !== existing.frequency) {
    const freqError: Error & { code?: string } = new Error(
      'Category frequency cannot be changed once created'
    );
    freqError.code = 'FREQUENCY_IMMUTABLE';
    throw freqError;
  }

  const updatePayload: Partial<Pick<CategoryRow, 'name' | 'description' | 'color' | 'order'>> & {
    updated_at?: string;
  } = {};

  if (typeof input.name !== 'undefined') {
    updatePayload.name = input.name;
  }

  if (typeof input.description !== 'undefined') {
    updatePayload.description = input.description ?? null;
  }

  if (typeof input.color !== 'undefined') {
    updatePayload.color = input.color;
  }

  if (typeof input.order !== 'undefined') {
    updatePayload.order = input.order;
  }

  updatePayload.updated_at = new Date().toISOString();

  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('categories')
    .update(updatePayload)
    .eq('id', id)
    .select('id, name, description, color, frequency, order, created_at, updated_at')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const notFoundError: Error & { code?: string } = new Error('Category not found');
    notFoundError.code = 'NOT_FOUND';
    throw notFoundError;
  }

  return mapCategoryRowToAdminCategory(data as CategoryRow);
};

export const deleteAdminCategory = async (id: number): Promise<{ id: number }> => {
  const supabase = getSupabaseServiceClient();

  const { count: productsCount, error: productsError } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);

  if (productsError) {
    throw productsError;
  }

  const usageCount = typeof productsCount === 'number' ? productsCount : 0;

  if (usageCount > 0) {
    const inUseError: Error & { code?: string } = new Error(
      `Cannot delete category: ${usageCount} product(s) are using this category`
    );
    inUseError.code = 'CATEGORY_IN_USE';
    throw inUseError;
  }

  const { data, error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const notFoundError: Error & { code?: string } = new Error('Category not found');
    notFoundError.code = 'NOT_FOUND';
    throw notFoundError;
  }

  return { id: (data as { id: number }).id };
};
