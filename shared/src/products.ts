import type { PaginationMeta } from './patients';

export const PRODUCT_TYPES = ['subscription', 'device', 'medication', 'telegra', 'one-off'] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRICING_TIERS = ['tier_1', 'tier_2'] as const;

export type PricingTier = (typeof PRICING_TIERS)[number];

export interface AdminProductCategoryInfo {
  id: number;
  name: string;
  description?: string | null;
  color: string;
  frequency: 'one-time' | 'subscription' | null;
}

export interface AdminProduct {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  productUrl: string;
  imageUrl: string | null;

  categoryId: number;
  category?: AdminProductCategoryInfo | null;

  stockQuantity: number;
  productType: ProductType;

  price: number | null;
  priceDiscounted: number | null;
  subscriptionPrice: number | null;
  quarterlyPrice: number | null;
  annualPrice: number | null;

  isBestSeller: boolean;
  showInCatalog: boolean;
  isUpsell: boolean;
  optInDuringUpsell: boolean;

  stripeProductId: string | null;
  stripePriceId: string | null;

  telegraProductId: string | null;

  pricingTier: PricingTier | null;
  tierDisplayName: string | null;
  applicableStates: string[] | null;

  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminProductsQuery {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: 'id' | 'created_at' | 'stock_quantity' | 'product_type';
  sortOrder?: 'asc' | 'desc';
  categoryId?: number;
  productType?: ProductType;
  showInCatalog?: boolean;
  isUpsell?: boolean;
}

export interface AdminProductsResult {
  products: AdminProduct[];
  pagination: PaginationMeta;
}

export interface CreateAdminProductInput {
  name: string;
  description: string | null;
  slug?: string;
  productUrl?: string;
  imageUrl: string | null;

  categoryId: number;

  stockQuantity: number;
  productType: ProductType;

  price: number | null;
  priceDiscounted?: number | null;
  subscriptionPrice?: number | null;
  quarterlyPrice?: number | null;
  annualPrice?: number | null;

  isBestSeller?: boolean;
  showInCatalog?: boolean;
  isUpsell?: boolean;
  optInDuringUpsell?: boolean;

  stripeProductId: string | null;
  stripePriceId: string | null;

  telegraProductId?: string | null;

  pricingTier?: PricingTier | null;
  tierDisplayName?: string | null;
  applicableStates?: string[] | null;
}

export interface UpdateAdminProductInput {
  name?: string;
  description?: string | null;
  slug?: string;
  productUrl?: string;
  imageUrl?: string | null;

  categoryId?: number;

  stockQuantity?: number;
  productType?: ProductType;

  price?: number | null;
  priceDiscounted?: number | null;
  subscriptionPrice?: number | null;
  quarterlyPrice?: number | null;
  annualPrice?: number | null;

  isBestSeller?: boolean;
  showInCatalog?: boolean;
  isUpsell?: boolean;
  optInDuringUpsell?: boolean;

  stripeProductId?: string | null;
  stripePriceId?: string | null;

  telegraProductId?: string | null;

  pricingTier?: PricingTier | null;
  tierDisplayName?: string | null;
  applicableStates?: string[] | null;
}

