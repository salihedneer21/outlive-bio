import { apiFetch } from './client';

export interface TelegraProductMedication {
  name: string;
  activeIngredient?: string;
  strength?: string;
  form?: string;
}

export interface TelegraProductVariation {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  affiliate?: string | null;
  medication?: TelegraProductMedication;
}

export interface TestTelegraConnectionResponse {
  data: {
    success: boolean;
    message: string;
    affiliateId?: string;
  };
  message: string;
}

export interface ListTelegraProductsResponse {
  data: {
    products: TelegraProductVariation[];
    affiliateId?: string;
  };
  message: string;
}

export const testTelegraConnection = async (): Promise<TestTelegraConnectionResponse> => {
  return apiFetch<TestTelegraConnectionResponse>('/admin/telegra/connection', {
    method: 'GET'
  });
};

export const listTelegraProducts = async (): Promise<ListTelegraProductsResponse> => {
  return apiFetch<ListTelegraProductsResponse>('/admin/telegra/products', {
    method: 'GET'
  });
};

