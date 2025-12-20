import type { NextFunction, Request, Response } from 'express';
import { logger } from '@config/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error(err);

  res.status(500).json({
    message: 'Internal server error'
  });
};

