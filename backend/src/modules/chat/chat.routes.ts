import { Router } from 'express';
import { requireAdmin } from '@middleware/auth';
import {
  getAdminChatThreadsHandler,
  getAdminChatMessagesHandler,
  postAdminChatMessageHandler
} from './chat.controller';

const router = Router();

// List all chat threads (one per patient) with basic metadata
router.get('/admin/chat/threads', requireAdmin, getAdminChatThreadsHandler);

// List messages for a specific thread
router.get('/admin/chat/messages', requireAdmin, getAdminChatMessagesHandler);

// Send a message as admin to a patient (thread is resolved/created automatically)
router.post('/admin/chat/messages', requireAdmin, postAdminChatMessageHandler);

export const chatRouter = router;

