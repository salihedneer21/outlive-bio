import type { Request, Response } from 'express';
import type { LoginRequestBody } from './auth.types';
import { loginUser } from './auth.service';
import type { ApiResponse } from '../../types/app';

export const login = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Partial<LoginRequestBody>;

  if (!body.email || !body.password) {
    res.status(400).json({
      message: 'Email and password are required'
    });
    return;
  }

  try {
    const result = await loginUser(body.email, body.password);

    const response: ApiResponse<typeof result> = {
      data: result,
      message: 'Login successful'
    };

    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    const code = (error as { code?: string }).code;

    if (code === 'INVALID_CREDENTIALS') {
      res.status(401).json({ message });
      return;
    }

    if (code === 'FORBIDDEN') {
      res.status(403).json({ message });
      return;
    }

    res.status(500).json({
      message: 'Internal authentication error'
    });
  }
};
