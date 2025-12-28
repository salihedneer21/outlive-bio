import type { Request, Response } from 'express';
import type { AdminUserSearchResultDto, AdminUsersResultDto } from './adminUsers.types';
import {
  addAdminRole,
  getAdminUsers,
  removeAdminRole,
  searchUsersForAdminRole
} from './adminUsers.service';
import type { ApiResponse } from '../../types/app';

export const listAdminUsersHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result: AdminUsersResultDto = await getAdminUsers();

    const response: ApiResponse<AdminUsersResultDto> = {
      data: result,
      message: 'Admins fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch admins'
    });
  }
};

export const searchAdminCandidatesHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  const limit = Number(req.query.limit) || 20;

  if (!q.trim()) {
    const empty: AdminUserSearchResultDto = { users: [] };
    const response: ApiResponse<AdminUserSearchResultDto> = {
      data: empty,
      message: 'No query provided'
    };
    res.status(200).json(response);
    return;
  }

  try {
    const result: AdminUserSearchResultDto = await searchUsersForAdminRole(q, limit);

    const response: ApiResponse<AdminUserSearchResultDto> = {
      data: result,
      message: 'Users fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to search users'
    });
  }
};

export const addAdminHandler = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.body as { userId?: string };

  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    res.status(400).json({ message: 'userId is required' });
    return;
  }

  try {
    await addAdminRole(userId);

    const response: ApiResponse<{ userId: string }> = {
      data: { userId },
      message: 'Admin role granted'
    };
    res.status(200).json(response);
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (code === 'BAD_REQUEST') {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Invalid input' });
      return;
    }

    if (code === 'NOT_FOUND') {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to add admin role'
    });
  }
};

export const removeAdminHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId;

  if (!userId || !userId.trim()) {
    res.status(400).json({ message: 'userId is required' });
    return;
  }

  try {
    await removeAdminRole(userId);

    const response: ApiResponse<{ userId: string }> = {
      data: { userId },
      message: 'Admin role removed'
    };
    res.status(200).json(response);
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (code === 'BAD_REQUEST') {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Invalid input' });
      return;
    }

    if (code === 'NOT_FOUND') {
      res.status(404).json({ message: 'Admin role not found for user' });
      return;
    }

    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to remove admin role'
    });
  }
};
