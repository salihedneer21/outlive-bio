import type { Request, Response } from 'express';
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProductById,
  getAdminProducts,
  updateAdminProduct
} from './products.service';
import type {
  AdminProductsQuery,
  CreateAdminProductInput,
  UpdateAdminProductInput
} from './products.types';
import type { ApiResponse } from '../../types/app';
import { uploadImageToBucket } from '@lib/storage';

export const listAdminProducts = async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;

  const sortBy =
    typeof req.query.sortBy === 'string' &&
    (req.query.sortBy === 'id' ||
      req.query.sortBy === 'created_at' ||
      req.query.sortBy === 'stock_quantity' ||
      req.query.sortBy === 'product_type')
      ? (req.query.sortBy as AdminProductsQuery['sortBy'])
      : undefined;

  const sortOrder =
    req.query.sortOrder === 'asc' || req.query.sortOrder === 'desc'
      ? (req.query.sortOrder as 'asc' | 'desc')
      : undefined;

  const categoryId =
    typeof req.query.categoryId === 'string' ? Number(req.query.categoryId) : undefined;

  const showInCatalog =
    typeof req.query.showInCatalog === 'string'
      ? req.query.showInCatalog === 'true'
      : undefined;

  const isUpsell =
    typeof req.query.isUpsell === 'string' ? req.query.isUpsell === 'true' : undefined;

  const productType =
    typeof req.query.productType === 'string'
      ? (req.query.productType as CreateAdminProductInput['productType'])
      : undefined;

  const query: AdminProductsQuery = {
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
    categoryId: typeof categoryId === 'number' && Number.isFinite(categoryId) ? categoryId : undefined,
    productType,
    showInCatalog,
    isUpsell
  };

  try {
    const result = await getAdminProducts(query);

    const response: ApiResponse<typeof result> = {
      data: result,
      message: 'Products fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch products'
    });
  }
};

export const getAdminProductHandler = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ message: 'Invalid product id' });
    return;
  }

  try {
    const product = await getAdminProductById(id);

    const response: ApiResponse<typeof product> = {
      data: product,
      message: 'Product fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (code === 'NOT_FOUND') {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch product'
    });
  }
};

export const createAdminProductHandler = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Partial<CreateAdminProductInput>;

  if (typeof body.name !== 'string' || !body.name.trim()) {
    res.status(400).json({ message: 'Name is required' });
    return;
  }

  if (typeof body.description === 'undefined') {
    res.status(400).json({ message: 'Description is required' });
    return;
  }

  if (typeof body.categoryId !== 'number' || body.categoryId <= 0) {
    res.status(400).json({ message: 'categoryId must be a positive number' });
    return;
  }

  if (typeof body.stockQuantity !== 'number' || body.stockQuantity < 0) {
    res.status(400).json({ message: 'stockQuantity must be a non-negative number' });
    return;
  }

  if (!body.productType) {
    res.status(400).json({ message: 'productType is required' });
    return;
  }

  // We expect imageUrl to be a Supabase storage URL returned by a separate upload endpoint.
  if (typeof body.imageUrl !== 'string') {
    res.status(400).json({ message: 'imageUrl is required and must be a string' });
    return;
  }

  const payload: CreateAdminProductInput = {
    name: body.name.trim(),
    description: body.description,
    slug: body.slug,
    productUrl: body.productUrl,
    imageUrl: body.imageUrl,
    categoryId: body.categoryId,
    stockQuantity: body.stockQuantity,
    productType: body.productType,
    price: typeof body.price === 'number' ? body.price : null,
    priceDiscounted:
      typeof body.priceDiscounted === 'number' ? body.priceDiscounted : body.priceDiscounted ?? null,
    subscriptionPrice:
      typeof body.subscriptionPrice === 'number' ? body.subscriptionPrice : null,
    quarterlyPrice: typeof body.quarterlyPrice === 'number' ? body.quarterlyPrice : null,
    annualPrice: typeof body.annualPrice === 'number' ? body.annualPrice : null,
    isBestSeller: body.isBestSeller ?? false,
    showInCatalog: body.showInCatalog ?? true,
    isUpsell: body.isUpsell ?? false,
    optInDuringUpsell: body.optInDuringUpsell ?? false,
    stripeProductId: body.stripeProductId ?? null,
    stripePriceId: body.stripePriceId ?? null,
    telegraProductId: body.telegraProductId ?? null,
    pricingTier: body.pricingTier ?? null,
    tierDisplayName: body.tierDisplayName ?? null,
    applicableStates: body.applicableStates ?? null
  };

  try {
    const product = await createAdminProduct(payload);

    const response: ApiResponse<typeof product> = {
      data: product,
      message: 'Product created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    const code = (error as { code?: string }).code;
    const message = (error as { message?: string }).message || '';

    // Handle unique constraint violation on stripe_product_id
    if (code === '23505' && message.includes('stripe_product_id')) {
      res.status(409).json({
        message: 'A product with this Stripe product ID already exists'
      });
      return;
    }

    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to create product'
    });
  }
};

export const updateAdminProductHandler = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ message: 'Invalid product id' });
    return;
  }

  const body = req.body as Partial<UpdateAdminProductInput>;

  const payload: UpdateAdminProductInput = { ...body };

  try {
    const product = await updateAdminProduct(id, payload);

    const response: ApiResponse<typeof product> = {
      data: product,
      message: 'Product updated successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    const code = (error as { code?: string }).code;
    const message = (error as { message?: string }).message || '';

    if (code === 'NOT_FOUND') {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Handle unique constraint violation on stripe_product_id
    if (code === '23505' && message.includes('stripe_product_id')) {
      res.status(409).json({
        message: 'A product with this Stripe product ID already exists'
      });
      return;
    }

    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to update product'
    });
  }
};

export const deleteAdminProductHandler = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ message: 'Invalid product id' });
    return;
  }

  try {
    const result = await deleteAdminProduct(id);

    const response: ApiResponse<typeof result> = {
      data: result,
      message: 'Product deleted successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (code === 'NOT_FOUND') {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to delete product'
    });
  }
};

export const uploadProductImageHandler = async (req: Request, res: Response): Promise<void> => {
  const file = (req as Request & { file?: { buffer: Buffer; originalname: string; mimetype: string } }).file;

  if (!file) {
    res.status(400).json({ message: 'Image file is required' });
    return;
  }

  if (!file.mimetype.startsWith('image/')) {
    res.status(400).json({ message: 'Only image files are allowed' });
    return;
  }

  try {
    const publicUrl = await uploadImageToBucket({
      bucket: 'product-images',
      fileBuffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype
    });

    const response: ApiResponse<{ imageUrl: string }> = {
      data: { imageUrl: publicUrl },
      message: 'Image uploaded successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to upload image'
    });
  }
};
