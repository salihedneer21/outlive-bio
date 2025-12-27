import type { Request, Response } from 'express';
import type { AdminImpersonationLogsQueryDto } from './logs.types';
import { getImpersonationLogs } from './logs.service';
import type { ApiResponse } from '../../types/app';

export const listImpersonationLogsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  const patientId =
    typeof req.query.patientId === 'string' && req.query.patientId.trim().length > 0
      ? req.query.patientId.trim()
      : undefined;
  const actorUserId =
    typeof req.query.actorUserId === 'string' && req.query.actorUserId.trim().length > 0
      ? req.query.actorUserId.trim()
      : undefined;
  const from =
    typeof req.query.from === 'string' && req.query.from.trim().length > 0
      ? req.query.from.trim()
      : undefined;
  const to =
    typeof req.query.to === 'string' && req.query.to.trim().length > 0
      ? req.query.to.trim()
      : undefined;

  const query: AdminImpersonationLogsQueryDto = {
    page,
    pageSize,
    patientId,
    actorUserId,
    from,
    to
  };

  try {
    const result = await getImpersonationLogs(query);

    const response: ApiResponse<typeof result> = {
      data: result,
      message: 'Impersonation logs fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch impersonation logs'
    });
  }
};

