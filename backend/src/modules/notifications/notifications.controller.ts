import type { Request, Response } from 'express';
import type { ApiResponse } from '../../types/app';
import {
  getAdminNotifications,
  getAdminPatientNotifications,
  getAdminChatNotifications
} from './notifications.service';

export const getAdminNotificationsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authUser = (res.locals as {
    authUser?: { id: string; email: string | null; role: string | null };
  }).authUser;

  if (!authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  const page =
    typeof req.query.page === 'string' && !Number.isNaN(Number(req.query.page))
      ? Number(req.query.page)
      : undefined;
  const pageSize =
    typeof req.query.pageSize === 'string' &&
    !Number.isNaN(Number(req.query.pageSize))
      ? Number(req.query.pageSize)
      : undefined;

  try {
    const notifications = await getAdminNotifications({ type, page, pageSize });

    const response: ApiResponse<typeof notifications> = {
      data: notifications,
      message: 'Notifications fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch notifications'
    });
  }
};

export const getAdminPatientNotificationsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const patientId = req.params.patientId;

  if (!patientId) {
    res.status(400).json({ message: 'patientId is required' });
    return;
  }

  const page =
    typeof req.query.page === 'string' && !Number.isNaN(Number(req.query.page))
      ? Number(req.query.page)
      : undefined;
  const pageSize =
    typeof req.query.pageSize === 'string' &&
    !Number.isNaN(Number(req.query.pageSize))
      ? Number(req.query.pageSize)
      : undefined;

  try {
    const notifications = await getAdminPatientNotifications({
      patientId,
      page,
      pageSize
    });

    const response: ApiResponse<typeof notifications> = {
      data: notifications,
      message: 'Patient notifications fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch patient notifications'
    });
  }
};

export const getAdminChatNotificationsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page =
      typeof req.query.page === 'string' && !Number.isNaN(Number(req.query.page))
        ? Number(req.query.page)
        : undefined;
    const pageSize =
      typeof req.query.pageSize === 'string' &&
      !Number.isNaN(Number(req.query.pageSize))
        ? Number(req.query.pageSize)
        : undefined;

    const notifications = await getAdminChatNotifications({ page, pageSize });

    const response: ApiResponse<typeof notifications> = {
      data: notifications,
      message: 'Chat notifications fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch chat notifications'
    });
  }
};
