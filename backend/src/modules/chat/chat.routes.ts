import { Router } from 'express';
import { requireAdmin } from '@middleware/auth';
import { requireUser } from '@middleware/userAuth';
import {
  getAdminChatThreadsHandler,
  getAdminChatMessagesHandler,
  postAdminChatMessageHandler,
  markMessagesAsReadHandler,
  getUserChatMessagesHandler,
  postUserChatMessageHandler,
  markUserMessagesAsReadHandler
} from './chat.controller';

const router = Router();

// ============================================================================
// ADMIN ROUTES
// ============================================================================

// GET /admin/chat/threads - List all chat threads with user info and unread counts
router.get('/admin/chat/threads', requireAdmin, getAdminChatThreadsHandler);

// GET /admin/chat/threads/:threadId/messages - Get messages for a specific thread
router.get('/admin/chat/threads/:threadId/messages', requireAdmin, getAdminChatMessagesHandler);

// POST /admin/chat/threads/:threadId/messages - Send a message as admin
router.post('/admin/chat/threads/:threadId/messages', requireAdmin, postAdminChatMessageHandler);

// POST /admin/chat/threads/:threadId/read - Mark messages as read by admin
router.post('/admin/chat/threads/:threadId/read', requireAdmin, markMessagesAsReadHandler);

// ============================================================================
// USER ROUTES
// ============================================================================

// GET /user/chat/messages - Get current user's chat messages
router.get('/user/chat/messages', requireUser, getUserChatMessagesHandler);

// POST /user/chat/messages - Send a message as the current user
router.post('/user/chat/messages', requireUser, postUserChatMessageHandler);

// POST /user/chat/read - Mark admin messages as read by the current user
router.post('/user/chat/read', requireUser, markUserMessagesAsReadHandler);

export const chatRouter = router;
