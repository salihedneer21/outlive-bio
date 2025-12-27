import { Router } from 'express';
import { requireAdmin } from '@middleware/auth';
import { listImpersonationLogsHandler } from './logs.controller';

const router = Router();

router.get('/admin/logs/impersonation', requireAdmin, listImpersonationLogsHandler);

export const logsRouter = router;

