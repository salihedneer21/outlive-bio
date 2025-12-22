import { getSupabaseServiceClient } from '@lib/supabase';
import { SUBSCRIPTION_CATEGORY_ID } from '@config/subscriptions';
import type {
  AdminProduct,
  AdminProductsQuery,
  AdminProductsResult,
  CreateAdminProductInput,
  UpdateAdminProductInput
} from './products.types';
import type { ProductWithCategoryRow } from './products.types';
import type { PaginationMeta } from '@modules/patients/patients.types';

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

const parseApplicableStates = (value: string | null): string[] | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((v) => typeof v === 'string') as string[];
    }
  } catch {
    // ignore parse errors and treat as null
  }
  return null;
};

const mapProductRowToAdminProduct = (row: ProductWithCategoryRow): AdminProduct => {
  const applicableStates = parseApplicableStates(row.applicable_states);

  const frequencyRaw = row.categories?.frequency ?? null;
  const frequency =
    frequencyRaw === 'subscription' || frequencyRaw === 'one-time' ? frequencyRaw : null;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    slug: row.slug ?? '',
    productUrl: row.product_url,
    imageUrl: row.image_url,

    categoryId: row.category_id,
    category: row.categories
      ? {
          id: row.categories.id,
          name: row.categories.name,
          description: null,
          color: row.categories.color,
          frequency
        }
      : null,

    stockQuantity: row.stock_quantity ?? 0,
    productType: (row.product_type as any) ?? 'subscription',

    price: row.price,
    priceDiscounted: row.price_discounted,
    subscriptionPrice: row.subscription_price,
    quarterlyPrice: row.quarterly_price,
    annualPrice: row.annual_price,

    isBestSeller: row.is_best_seller ?? false,
    showInCatalog: row.show_in_catalog ?? true,
    isUpsell: row.is_upsell ?? false,
    optInDuringUpsell: row.opt_in_during_upsell ?? false,

    stripeProductId: row.stripe_product_id,
    stripePriceId: row.stripe_price_id,

    telegraProductId: row.telegra_product_id,

    pricingTier: (row.pricing_tier as any) ?? null,
    tierDisplayName: row.tier_display_name,
    applicableStates,

    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const getAdminProducts = async (
  query: AdminProductsQuery
): Promise<AdminProductsResult> => {
  const supabase = getSupabaseServiceClient();

  const page = query.page > 0 ? query.page : 1;
  const pageSize = query.pageSize > 0 ? Math.min(query.pageSize, 100) : 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const search = query.search?.trim();

  let productsQuery = supabase
    .from('products')
    .select(
      `
      id,
      name,
      description,
      slug,
      product_url,
      image_url,
      category_id,
      quantity,
      dose,
      stock_quantity,
      subscription_price,
      price,
      price_discounted,
      quarterly_price,
      annual_price,
      product_type,
      is_best_seller,
      show_in_catalog,
      is_upsell,
      opt_in_during_upsell,
      stripe_product_id,
      stripe_price_id,
      applicable_states,
      pricing_tier,
      tier_display_name,
      telegra_product_id,
      created_at,
      updated_at,
      categories:categories (
        id,
        name,
        color,
        frequency
      )
    `,
      { count: 'exact' }
    );

  if (search) {
    productsQuery = productsQuery.or(
      [
        `name.ilike.%${search}%`,
        `slug.ilike.%${search}%`,
        // allow searching by numeric id if search looks like a number
        Number.isFinite(Number(search)) ? `id.eq.${Number(search)}` : null
      ]
        .filter(Boolean)
        .join(',')
    );
  }

  if (typeof query.categoryId === 'number') {
    productsQuery = productsQuery.eq('category_id', query.categoryId);
  }

  if (query.productType) {
    productsQuery = productsQuery.eq('product_type', query.productType);
  }

  if (typeof query.showInCatalog === 'boolean') {
    productsQuery = productsQuery.eq('show_in_catalog', query.showInCatalog);
  }

  if (typeof query.isUpsell === 'boolean') {
    productsQuery = productsQuery.eq('is_upsell', query.isUpsell);
  }

  const sortBy = query.sortBy ?? 'id';
  const sortOrder = query.sortOrder ?? 'desc';
  productsQuery = productsQuery.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error, count } = await productsQuery.range(from, to);

  if (error) {
    throw error;
  }

  const safeCount = typeof count === 'number' ? count : data?.length ?? 0;

  if (!data || data.length === 0) {
    return {
      products: [],
      pagination: buildPaginationMeta(page, pageSize, safeCount)
    };
  }

  const products: AdminProduct[] = (data as unknown as ProductWithCategoryRow[]).map(
    mapProductRowToAdminProduct
  );

  return {
    products,
    pagination: buildPaginationMeta(page, pageSize, safeCount)
  };
};

export const getAdminProductById = async (id: number): Promise<AdminProduct> => {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      description,
      slug,
      product_url,
      image_url,
      category_id,
      quantity,
      dose,
      stock_quantity,
      subscription_price,
      price,
      price_discounted,
      quarterly_price,
      annual_price,
      product_type,
      is_best_seller,
      show_in_catalog,
      is_upsell,
      opt_in_during_upsell,
      stripe_product_id,
      stripe_price_id,
      applicable_states,
      pricing_tier,
      tier_display_name,
      telegra_product_id,
      created_at,
      updated_at,
      categories:categories (
        id,
        name,
        color,
        frequency
      )
    `
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const notFoundError: Error & { code?: string } = new Error('Product not found');
    notFoundError.code = 'NOT_FOUND';
    throw notFoundError;
  }

  return mapProductRowToAdminProduct(data as unknown as ProductWithCategoryRow);
};

export const createAdminProduct = async (
  input: CreateAdminProductInput
): Promise<AdminProduct> => {
  const supabase = getSupabaseServiceClient();

  const slugBase = input.slug && input.slug.trim().length > 0 ? input.slug.trim() : input.name;
  const generatedSlug =
    slugBase
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') || `product-${Date.now()}`;

  const slug = generatedSlug;
  const productUrl = `/products/${slug}`;

  const isSubscriptionCategory = input.categoryId === SUBSCRIPTION_CATEGORY_ID;

  const applicableStatesJson =
    isSubscriptionCategory && input.applicableStates && input.applicableStates.length > 0
      ? JSON.stringify(input.applicableStates)
      : null;

  const payload: Partial<ProductWithCategoryRow> = {
    name: input.name,
    description: input.description,
    slug,
    product_url: productUrl,
    image_url: input.imageUrl,
    category_id: input.categoryId,
    quantity: 1,
    dose: '',
    stock_quantity: input.stockQuantity,
    subscription_price: input.subscriptionPrice ?? 0,
    price: input.price,
    price_discounted: input.priceDiscounted ?? null,
    quarterly_price: input.quarterlyPrice ?? 0,
    annual_price: input.annualPrice ?? 0,
    product_type: input.productType,
    is_best_seller: input.isBestSeller ?? false,
    show_in_catalog: input.showInCatalog ?? true,
    is_upsell: input.isUpsell ?? false,
    opt_in_during_upsell: input.optInDuringUpsell ?? false,
    stripe_product_id: input.stripeProductId,
    stripe_price_id: input.stripePriceId,
    applicable_states: applicableStatesJson,
    pricing_tier: isSubscriptionCategory ? (input.pricingTier as string | null) : null,
    tier_display_name: isSubscriptionCategory ? input.tierDisplayName ?? null : null,
    telegra_product_id: input.telegraProductId ?? null
  };

  const { data, error } = await supabase
    .from('products')
    .insert([payload])
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    const err: Error & { code?: string } = new Error('Failed to create product');
    err.code = 'CREATE_FAILED';
    throw err;
  }

  const createdId = (data as { id: number }).id;
  return getAdminProductById(createdId);
};

export const updateAdminProduct = async (
  id: number,
  input: UpdateAdminProductInput
): Promise<AdminProduct> => {
  const existing = await getAdminProductById(id);

  const supabase = getSupabaseServiceClient();

  const isSubscriptionCategory =
    (typeof input.categoryId === 'number' ? input.categoryId : existing.categoryId) ===
    SUBSCRIPTION_CATEGORY_ID;

  const updatePayload: Partial<ProductWithCategoryRow> & { updated_at?: string } = {};

  if (typeof input.name !== 'undefined') {
    updatePayload.name = input.name;
  }

  if (typeof input.description !== 'undefined') {
    updatePayload.description = input.description;
  }

  if (typeof input.slug !== 'undefined' || typeof input.productUrl !== 'undefined') {
    const slug =
      typeof input.slug === 'string' && input.slug.trim().length > 0
        ? input.slug.trim()
        : existing.slug;
    updatePayload.slug = slug;
    updatePayload.product_url = `/products/${slug}`;
  }

  if (typeof input.imageUrl !== 'undefined') {
    updatePayload.image_url = input.imageUrl;
  }

  if (typeof input.categoryId === 'number') {
    updatePayload.category_id = input.categoryId;
  }

  if (typeof input.stockQuantity === 'number') {
    updatePayload.stock_quantity = input.stockQuantity;
  }

  if (typeof input.productType !== 'undefined') {
    updatePayload.product_type = input.productType;
  }

  if (typeof input.price !== 'undefined') {
    updatePayload.price = input.price;
  }

  if (typeof input.priceDiscounted !== 'undefined') {
    updatePayload.price_discounted = input.priceDiscounted;
  }

  if (typeof input.subscriptionPrice !== 'undefined') {
    // Column is NOT NULL, so normalise null/undefined to an integer value.
    updatePayload.subscription_price =
      input.subscriptionPrice ?? existing.subscriptionPrice ?? 0;
  }

  if (typeof input.quarterlyPrice !== 'undefined') {
    updatePayload.quarterly_price = input.quarterlyPrice;
  }

  if (typeof input.annualPrice !== 'undefined') {
    updatePayload.annual_price = input.annualPrice;
  }

  if (typeof input.isBestSeller !== 'undefined') {
    updatePayload.is_best_seller = input.isBestSeller;
  }

  if (typeof input.showInCatalog !== 'undefined') {
    updatePayload.show_in_catalog = input.showInCatalog;
  }

  if (typeof input.isUpsell !== 'undefined') {
    updatePayload.is_upsell = input.isUpsell;
  }

  if (typeof input.optInDuringUpsell !== 'undefined') {
    updatePayload.opt_in_during_upsell = input.optInDuringUpsell;
  }

  if (typeof input.stripeProductId !== 'undefined') {
    updatePayload.stripe_product_id = input.stripeProductId;
  }

  if (typeof input.stripePriceId !== 'undefined') {
    updatePayload.stripe_price_id = input.stripePriceId;
  }

  if (typeof input.telegraProductId !== 'undefined') {
    updatePayload.telegra_product_id = input.telegraProductId;
  }

  if (isSubscriptionCategory) {
    if (typeof input.pricingTier !== 'undefined') {
      updatePayload.pricing_tier = input.pricingTier as string | null;
    }

    if (typeof input.tierDisplayName !== 'undefined') {
      updatePayload.tier_display_name = input.tierDisplayName;
    }

    if (typeof input.applicableStates !== 'undefined') {
      updatePayload.applicable_states =
        input.applicableStates && input.applicableStates.length > 0
          ? JSON.stringify(input.applicableStates)
          : null;
    }
  } else {
    // Ensure subscription-specific fields are cleared if product is no longer in subscription category
    updatePayload.pricing_tier = null;
    updatePayload.tier_display_name = null;
    updatePayload.applicable_states = null;
  }

  updatePayload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('products')
    .update(updatePayload)
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    const notFoundError: Error & { code?: string } = new Error('Product not found');
    notFoundError.code = 'NOT_FOUND';
    throw notFoundError;
  }

  const updatedId = (data as { id: number }).id;
  return getAdminProductById(updatedId);
};

export const deleteAdminProduct = async (id: number): Promise<{ id: number }> => {
  const supabase = getSupabaseServiceClient();

  // Get image URL first for potential cleanup (best-effort).
  const { data: existing, error: existingError } = await supabase
    .from('products')
    .select('id, image_url')
    .eq('id', id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (!existing) {
    const notFoundError: Error & { code?: string } = new Error('Product not found');
    notFoundError.code = 'NOT_FOUND';
    throw notFoundError;
  }

  // Let deletion of the product row be the primary concern; image cleanup
  // can be handled by a separate process if needed.
  const { data, error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const deleteError: Error & { code?: string } = new Error('Failed to delete product');
    deleteError.code = 'DELETE_FAILED';
    throw deleteError;
  }

  return { id: (data as { id: number }).id };
};
