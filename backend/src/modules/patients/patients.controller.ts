import type { Request, Response } from 'express';
import {
  generatePatientImpersonationLink,
  getAdminPatientComprehensiveIntake,
  getAdminPatientProfile,
  getAdminPatients,
  getAdminPatientsStats
} from './patients.service';
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

export const getAdminPatientProfileHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const patientId = req.params.id;

  if (!patientId) {
    res.status(400).json({ message: 'Patient id is required' });
    return;
  }

  try {
    const result = await getAdminPatientProfile(patientId);

    const response: ApiResponse<typeof result> = {
      data: result,
      message: 'Patient profile fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (code === 'NOT_FOUND') {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch patient profile'
    });
  }
};

export const getAdminPatientComprehensiveIntakeHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const patientId = req.params.id;

  if (!patientId) {
    res.status(400).json({ message: 'Patient id is required' });
    return;
  }

  try {
    const result = await getAdminPatientComprehensiveIntake(patientId);

    const response: ApiResponse<typeof result> = {
      data: result,
      message: 'Patient comprehensive intake fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (code === 'NOT_FOUND') {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    res.status(500).json({
      message:
        error instanceof Error ? error.message : 'Failed to fetch patient comprehensive intake'
    });
  }
};

export const getAdminPatientsStatsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const from = typeof req.query.from === 'string' ? req.query.from : undefined;
  const to = typeof req.query.to === 'string' ? req.query.to : undefined;

  try {
    const stats = await getAdminPatientsStats({ from, to });

    const response: ApiResponse<typeof stats> = {
      data: stats,
      message: 'Patient stats fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch patient stats'
    });
  }
};

export const impersonateAdminPatientHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const patientId = req.params.id;

  if (!patientId) {
    res.status(400).json({ message: 'Patient id is required' });
    return;
  }

  const authUser = (res.locals as {
    authUser?: { id: string; email: string | null; role: string | null };
  }).authUser;

  const actor = authUser
    ? {
        id: authUser.id,
        email: authUser.email ?? null,
        role: authUser.role ?? null
      }
    : undefined;

  const ipAddressHeader =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? null;
  const ipAddress = ipAddressHeader || req.ip || null;
  const userAgent =
    typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null;

  try {
    const url = await generatePatientImpersonationLink(patientId, actor, {
      ipAddress,
      userAgent
    });

    const response: ApiResponse<{ url: string }> = {
      data: { url },
      message: 'Impersonation link generated successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (code === 'NOT_FOUND') {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    if (code === 'NO_EMAIL') {
      res.status(400).json({ message: 'Patient does not have an email address' });
      return;
    }

    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to generate impersonation link'
    });
  }
};
