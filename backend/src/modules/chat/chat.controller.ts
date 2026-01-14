import type { Request, Response } from 'express';
import type { ApiResponse } from '../../types/app';
import {
  getAdminChatThreads,
  getAdminChatMessages,
  sendAdminChatMessage,
  markMessagesAsRead,
  getUserChatMessages,
  sendUserChatMessage,
  markAdminMessagesAsRead
} from './chat.service';
import { getIO } from '@socket/index';
import { emitNewUserMessage, emitNewAdminMessage } from '@socket/chatHandlers';

/**
 * GET /admin/chat/threads
 * Get all chat threads with user info and unread counts
 */
export const getAdminChatThreadsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const page =
      typeof req.query.page === 'string' && !Number.isNaN(Number(req.query.page))
        ? Number(req.query.page)
        : 1;
    const pageSize =
      typeof req.query.pageSize === 'string' && !Number.isNaN(Number(req.query.pageSize))
        ? Number(req.query.pageSize)
        : 50;

    const result = await getAdminChatThreads({ page, pageSize });

    const response: ApiResponse<typeof result> = {
      data: result,
      message: 'Chat threads fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch chat threads'
    });
  }
};

/**
 * GET /admin/chat/threads/:threadId/messages
 * Get messages for a specific thread
 */
export const getAdminChatMessagesHandler = async (req: Request, res: Response): Promise<void> => {
  const threadId = req.params.threadId;
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 100;

  if (!threadId) {
    res.status(400).json({ message: 'threadId is required' });
    return;
  }

  try {
    const result = await getAdminChatMessages({ threadId, limit });

    const response: ApiResponse<typeof result> = {
      data: result,
      message: 'Chat messages fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch chat messages'
    });
  }
};

/**
 * POST /admin/chat/threads/:threadId/messages
 * Send a message as admin to a thread
 */
export const postAdminChatMessageHandler = async (req: Request, res: Response): Promise<void> => {
  const threadId = req.params.threadId;
  const { content } = req.body as { content?: string };

  if (!threadId) {
    res.status(400).json({ message: 'threadId is required' });
    return;
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ message: 'content is required' });
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
      threadId,
      content: content.trim(),
      adminId: authUser.id
    });

    // Emit socket events for real-time updates
    const io = getIO();
    if (io) {
      emitNewAdminMessage(io, threadId, result.thread.user_id, {
        id: result.message.id,
        thread_id: result.message.thread_id,
        sender_id: result.message.sender_id,
        sender_type: result.message.sender_type,
        content: result.message.content,
        created_at: result.message.created_at,
        read: result.message.read
      });
    }

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

/**
 * POST /admin/chat/threads/:threadId/read
 * Mark all user messages in a thread as read
 */
export const markMessagesAsReadHandler = async (req: Request, res: Response): Promise<void> => {
  const threadId = req.params.threadId;

  if (!threadId) {
    res.status(400).json({ message: 'threadId is required' });
    return;
  }

  try {
    const result = await markMessagesAsRead({ threadId });

    const response: ApiResponse<typeof result> = {
      data: result,
      message: 'Messages marked as read'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to mark messages as read'
    });
  }
};

// ============================================================================
// USER CHAT HANDLERS
// ============================================================================

/**
 * GET /user/chat/messages
 * Get current user's chat messages
 */
export const getUserChatMessagesHandler = async (req: Request, res: Response): Promise<void> => {
  const authUser = (res.locals as {
    authUser?: { id: string; email: string | null; role: string | null };
  }).authUser;

  if (!authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 100;

  try {
    const result = await getUserChatMessages({ userId: authUser.id, limit });

    const response: ApiResponse<typeof result> = {
      data: result,
      message: 'Chat messages fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch chat messages'
    });
  }
};

/**
 * POST /user/chat/messages
 * Send a message as the current user
 */
export const postUserChatMessageHandler = async (req: Request, res: Response): Promise<void> => {
  const { content } = req.body as { content?: string };

  if (!content || typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ message: 'content is required' });
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
    const result = await sendUserChatMessage({
      userId: authUser.id,
      content: content.trim()
    });

    // Emit socket events for real-time updates
    const io = getIO();
    if (io) {
      emitNewUserMessage(io, result.thread.id, authUser.id, {
        id: result.message.id,
        thread_id: result.message.thread_id,
        sender_id: result.message.sender_id,
        sender_type: result.message.sender_type,
        content: result.message.content,
        created_at: result.message.created_at,
        read: result.message.read
      });
    }

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

/**
 * POST /user/chat/read
 * Mark all admin messages as read by the current user
 */
export const markUserMessagesAsReadHandler = async (req: Request, res: Response): Promise<void> => {
  const authUser = (res.locals as {
    authUser?: { id: string; email: string | null; role: string | null };
  }).authUser;

  if (!authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    // Get user's thread first
    const chatData = await getUserChatMessages({ userId: authUser.id, limit: 1 });
    const result = await markAdminMessagesAsRead({ threadId: chatData.thread.id });

    const response: ApiResponse<typeof result> = {
      data: result,
      message: 'Messages marked as read'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to mark messages as read'
    });
  }
};
