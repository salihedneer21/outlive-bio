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
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
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

export interface ProductRow {
  id: number;
  name: string;
  description: string | null;
  slug: string | null;
  product_url: string;
  image_url: string | null;
  category_id: number;
  quantity: number | null;
  dose: string | null;
  stock_quantity: number | null;
  subscription_price: number | null;
  price: number | null;
  price_discounted: number | null;
  quarterly_price: number | null;
  annual_price: number | null;
  product_type: string | null;
  is_best_seller: boolean | null;
  show_in_catalog: boolean | null;
  is_upsell: boolean | null;
  opt_in_during_upsell: boolean | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  applicable_states: string | null;
  pricing_tier: string | null;
  tier_display_name: string | null;
  telegra_product_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProductWithCategoryRow extends ProductRow {
  categories: {
    id: number;
    name: string;
    color: string;
    frequency: string | null;
  } | null;
}
