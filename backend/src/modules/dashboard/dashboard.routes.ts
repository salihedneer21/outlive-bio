import { Router } from 'express';
import { requireAdmin } from '@middleware/auth';
import { getAdminDashboardStatsHandler } from './dashboard.controller';

const router = Router();

router.get('/admin/dashboard/stats', requireAdmin, getAdminDashboardStatsHandler);

export const dashboardRouter = router;

