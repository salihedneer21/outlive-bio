import type { Request, Response } from 'express';
import {
  getTelegraProductVariationById,
  getTelegraProductVariations,
  testTelegraConnection
} from './telegra.service';
import type { ApiResponse } from '../../types/app';

export const testTelegraConnectionHandler = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const result = await testTelegraConnection();

  const statusCode = result.success ? 200 : 500;

  const response: ApiResponse<typeof result> = {
    data: result,
    message: result.success ? 'Telegra connection successful' : 'Telegra connection failed'
  };

  res.status(statusCode).json(response);
};

export const listTelegraProductsHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { products, affiliateId } = await getTelegraProductVariations();

    const response: ApiResponse<{ products: unknown; affiliateId?: string }> = {
      data: {
        products,
        affiliateId
      },
      message: 'Telegra products fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch Telegra products'
    });
  }
};

export const getTelegraProductHandler = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;

  if (!id) {
    res.status(400).json({ message: 'Product id is required' });
    return;
  }

  try {
    const product = await getTelegraProductVariationById(id);

    if (!product) {
      res.status(404).json({ message: 'Telegra product not found' });
      return;
    }

    const response: ApiResponse<typeof product> = {
      data: product,
      message: 'Telegra product fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch Telegra product'
    });
  }
};
