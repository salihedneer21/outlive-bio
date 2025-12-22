import { apiFetch, API_BASE_URL } from './client';
import type {
  AdminProduct,
  AdminProductsResult,
  CreateAdminProductInput,
  UpdateAdminProductInput
} from '@outlive/shared';

export interface ListProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: 'id' | 'created_at' | 'stock_quantity' | 'product_type';
  sortOrder?: 'asc' | 'desc';
  categoryId?: number;
  productType?: string;
  showInCatalog?: boolean;
  isUpsell?: boolean;
}

export interface ListProductsResponse {
  data: AdminProductsResult;
  message: string;
}

export interface ProductResponse {
  data: AdminProduct;
  message: string;
}

export interface DeleteProductResponse {
  data: { id: number };
  message: string;
}

export const listProducts = async (
  params: ListProductsParams = {}
): Promise<ListProductsResponse> => {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.search) searchParams.set('search', params.search);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  if (typeof params.categoryId === 'number') {
    searchParams.set('categoryId', String(params.categoryId));
  }
  if (params.productType) searchParams.set('productType', params.productType);
  if (typeof params.showInCatalog === 'boolean') {
    searchParams.set('showInCatalog', String(params.showInCatalog));
  }
  if (typeof params.isUpsell === 'boolean') {
    searchParams.set('isUpsell', String(params.isUpsell));
  }

  const query = searchParams.toString();
  const path = `/admin/products${query ? `?${query}` : ''}`;

  return apiFetch<ListProductsResponse>(path, {
    method: 'GET'
  });
};

export const getProduct = async (id: number): Promise<ProductResponse> => {
  return apiFetch<ProductResponse>(`/admin/products/${id}`, {
    method: 'GET'
  });
};

export const createProduct = async (
  input: CreateAdminProductInput
): Promise<ProductResponse> => {
  return apiFetch<ProductResponse>('/admin/products', {
    method: 'POST',
    body: JSON.stringify(input)
  });
};

export const updateProduct = async (
  id: number,
  input: UpdateAdminProductInput
): Promise<ProductResponse> => {
  return apiFetch<ProductResponse>(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
};

export const deleteProduct = async (id: number): Promise<DeleteProductResponse> => {
  return apiFetch<DeleteProductResponse>(`/admin/products/${id}`, {
    method: 'DELETE'
  });
};

export interface UploadImageResponse {
  data: {
    imageUrl: string;
  };
  message: string;
}

export const uploadProductImage = async (file: File): Promise<UploadImageResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/admin/products/image`, {
    method: 'POST',
    credentials: 'include',
    body: formData
  });

  const contentType = response.headers.get('Content-Type') ?? '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof body === 'object' && body && 'message' in body
        ? (body as { message?: string }).message ?? 'Image upload failed'
        : 'Image upload failed';
    throw { message, status: response.status } as { message: string; status: number };
  }

  return body as UploadImageResponse;
};

