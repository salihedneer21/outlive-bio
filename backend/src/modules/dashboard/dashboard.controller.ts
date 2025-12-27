import type { Request, Response } from 'express';
import type { AdminDashboardStatsDto } from './dashboard.types';
import { getAdminDashboardStats } from './dashboard.service';
import type { ApiResponse } from '../../types/app';

export const getAdminDashboardStatsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const from =
    typeof req.query.from === 'string' && req.query.from.trim().length > 0
      ? req.query.from.trim()
      : undefined;
  const to =
    typeof req.query.to === 'string' && req.query.to.trim().length > 0
      ? req.query.to.trim()
      : undefined;

  try {
    const stats: AdminDashboardStatsDto = await getAdminDashboardStats({ from, to });

    const response: ApiResponse<AdminDashboardStatsDto> = {
      data: stats,
      message: 'Dashboard stats fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch dashboard stats'
    });
  }
};

