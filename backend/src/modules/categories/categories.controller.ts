import type { Request, Response } from 'express';
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  getAdminCategoryById,
  updateAdminCategory
} from './categories.service';
import type { AdminCategoriesQuery, CreateAdminCategoryInput, UpdateAdminCategoryInput } from './categories.types';
import type { CategoryFrequency } from './categories.constants';
import { DEFAULT_CATEGORY_FREQUENCY, isCategoryFrequency } from './categories.constants';
import type { ApiResponse } from '../../types/app';

export const listAdminCategories = async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;

  const sortBy =
    typeof req.query.sortBy === 'string' &&
    (req.query.sortBy === 'order' || req.query.sortBy === 'created_at')
      ? (req.query.sortBy as 'order' | 'created_at')
      : undefined;

  const sortOrder =
    req.query.sortOrder === 'asc' || req.query.sortOrder === 'desc'
      ? (req.query.sortOrder as 'asc' | 'desc')
      : undefined;

  const query: AdminCategoriesQuery = {
    page,
    pageSize,
    search,
    sortBy,
    sortOrder
  };

  try {
    const result = await getAdminCategories(query);

    const response: ApiResponse<typeof result> = {
      data: result,
      message: 'Categories fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch categories'
    });
  }
};

export const getAdminCategory = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ message: 'Invalid category id' });
    return;
  }

  try {
    const category = await getAdminCategoryById(id);

    const response: ApiResponse<typeof category> = {
      data: category,
      message: 'Category fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (code === 'NOT_FOUND') {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch category'
    });
  }
};

export const createAdminCategoryHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = req.body as Partial<{
    name: unknown;
    description: unknown;
    color: unknown;
    frequency: unknown;
    order: unknown;
  }>;

  if (typeof body.name !== 'string' || !body.name.trim()) {
    res.status(400).json({ message: 'Name is required' });
    return;
  }

  if (typeof body.color !== 'string' || !body.color.trim()) {
    res.status(400).json({ message: 'Color is required' });
    return;
  }

  const orderValue =
    typeof body.order === 'number'
      ? body.order
      : typeof body.order === 'string'
      ? Number(body.order)
      : NaN;

  if (!Number.isFinite(orderValue) || orderValue < 0) {
    res.status(400).json({ message: 'Order must be a non-negative number' });
    return;
  }

  let frequency: CategoryFrequency = DEFAULT_CATEGORY_FREQUENCY;

  if (typeof body.frequency !== 'undefined') {
    if (isCategoryFrequency(body.frequency)) {
      frequency = body.frequency;
    } else if (body.frequency != null) {
      res.status(400).json({ message: 'Invalid category frequency' });
      return;
    }
  }

  const payload: CreateAdminCategoryInput = {
    name: body.name.trim(),
    description:
      typeof body.description === 'string'
        ? body.description
        : body.description == null
        ? null
        : String(body.description),
    color: body.color.trim(),
    frequency,
    order: orderValue
  };

  try {
    const category = await createAdminCategory(payload);

    const response: ApiResponse<typeof category> = {
      data: category,
      message: 'Category created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to create category'
    });
  }
};

export const updateAdminCategoryHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ message: 'Invalid category id' });
    return;
  }

  const body = req.body as Partial<{
    name: unknown;
    description: unknown;
    color: unknown;
    frequency: unknown;
    order: unknown;
  }>;

  const payload: UpdateAdminCategoryInput = {};

  if ('name' in body) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      res.status(400).json({ message: 'Name must be a non-empty string' });
      return;
    }
    payload.name = body.name.trim();
  }

  if ('description' in body) {
    if (body.description == null) {
      payload.description = null;
    } else if (typeof body.description === 'string') {
      payload.description = body.description;
    } else {
      payload.description = String(body.description);
    }
  }

  if ('color' in body) {
    if (typeof body.color !== 'string' || !body.color.trim()) {
      res.status(400).json({ message: 'Color must be a non-empty string' });
      return;
    }
    payload.color = body.color.trim();
  }

  if ('order' in body) {
    const orderValue =
      typeof body.order === 'number'
        ? body.order
        : typeof body.order === 'string'
        ? Number(body.order)
        : NaN;

    if (!Number.isFinite(orderValue) || orderValue < 0) {
      res.status(400).json({ message: 'Order must be a non-negative number' });
      return;
    }

    payload.order = orderValue;
  }

  if ('frequency' in body) {
    if (isCategoryFrequency(body.frequency)) {
      payload.frequency = body.frequency;
    } else if (body.frequency != null) {
      res.status(400).json({ message: 'Invalid category frequency' });
      return;
    }
  }

  if (Object.keys(payload).length === 0) {
    res.status(400).json({ message: 'No valid fields provided to update' });
    return;
  }

  try {
    const category = await updateAdminCategory(id, payload);

    const response: ApiResponse<typeof category> = {
      data: category,
      message: 'Category updated successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (code === 'NOT_FOUND') {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    if (code === 'FREQUENCY_IMMUTABLE') {
      res.status(409).json({
        message: 'Category frequency cannot be changed once created'
      });
      return;
    }

    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to update category'
    });
  }
};

export const deleteAdminCategoryHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ message: 'Invalid category id' });
    return;
  }

  try {
    const result = await deleteAdminCategory(id);

    const response: ApiResponse<typeof result> = {
      data: result,
      message: 'Category deleted successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (code === 'NOT_FOUND') {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    if (code === 'CATEGORY_IN_USE') {
      res.status(409).json({
        message:
          error instanceof Error
            ? error.message
            : 'Cannot delete category because it is in use by products'
      });
      return;
    }

    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to delete category'
    });
  }
};
