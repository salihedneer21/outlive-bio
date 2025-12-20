import { Router } from 'express';
import { healthRouter } from '@modules/health/health.routes';
import { authRouter } from '@modules/auth/auth.routes';

const router = Router();

router.use('/', healthRouter);
router.use('/', authRouter);

export const apiRouter = router;
