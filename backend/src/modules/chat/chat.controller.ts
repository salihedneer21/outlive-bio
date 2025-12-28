import type { Request, Response } from 'express';
import type { ApiResponse } from '../../types/app';
import {
  getAdminChatThreads,
  getAdminChatMessages,
  sendAdminChatMessage
} from './chat.service';

export const getAdminChatThreadsHandler = async (req: Request, res: Response): Promise<void> => {
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

    const threads = await getAdminChatThreads({ page, pageSize });

    const response: ApiResponse<typeof threads> = {
      data: threads,
      message: 'Chat threads fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch chat threads'
    });
  }
};

export const getAdminChatMessagesHandler = async (req: Request, res: Response): Promise<void> => {
  const threadId = typeof req.query.threadId === 'string' ? req.query.threadId : undefined;
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 50;

  if (!threadId) {
    res.status(400).json({ message: 'threadId is required' });
    return;
  }

  try {
    const messages = await getAdminChatMessages({ threadId, limit });

    const response: ApiResponse<typeof messages> = {
      data: messages,
      message: 'Chat messages fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch chat messages'
    });
  }
};

export const postAdminChatMessageHandler = async (req: Request, res: Response): Promise<void> => {
  const { patientId, body } = req.body as { patientId?: string; body?: string };

  if (!patientId || !body) {
    res.status(400).json({ message: 'patientId and body are required' });
    return;
  }

  const authUser = (res.locals as {
    authUser?: { id: string; email: string | null; role: string | null };
  }).authUser;

  if (!authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const result = await sendAdminChatMessage({
      patientId,
      body,
      adminId: authUser.id,
      adminEmail: authUser.email ?? undefined
    });

    const response: ApiResponse<typeof result> = {
      data: result,
      message: 'Message sent successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to send message'
    });
  }
};
