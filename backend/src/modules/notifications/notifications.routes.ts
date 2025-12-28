import { Router } from 'express';
import { requireAdmin } from '@middleware/auth';
import {
  getAdminNotificationsHandler,
  getAdminPatientNotificationsHandler,
  getAdminChatNotificationsHandler
} from './notifications.controller';

const router = Router();

// All notifications for current admin (optionally filtered)
router.get('/admin/notifications', requireAdmin, getAdminNotificationsHandler);

// All notifications for a specific patient (by patientId = auth.users.id)
router.get('/admin/patients/:patientId/notifications', requireAdmin, getAdminPatientNotificationsHandler);

// Chat-related notifications (e.g. type = 'chat')
router.get('/admin/notifications/chat', requireAdmin, getAdminChatNotificationsHandler);

export const notificationsRouter = router;

