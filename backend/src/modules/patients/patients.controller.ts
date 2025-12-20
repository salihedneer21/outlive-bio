import type { Request, Response } from 'express';
import { getAdminPatients } from './patients.service';
import type { AdminPatientsQuery } from './patients.types';
import type { ApiResponse } from '../../types/app';

export const listAdminPatients = async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const sortBy =
    typeof req.query.sortBy === 'string' && req.query.sortBy === 'created_at'
      ? 'created_at'
      : undefined;
  const sortOrder =
    req.query.sortOrder === 'asc' || req.query.sortOrder === 'desc'
      ? (req.query.sortOrder as 'asc' | 'desc')
      : undefined;

  const query: AdminPatientsQuery = {
    page,
    pageSize,
    search,
    sortBy,
    sortOrder
  };

  try {
    const result = await getAdminPatients(query);

    const response: ApiResponse<typeof result> = {
      data: result,
      message: 'Patients fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch patients'
    });
  }
};
