import { Router } from 'express';
import { healthRouter } from '@modules/health/health.routes';
import { authRouter } from '@modules/auth/auth.routes';
import { patientsRouter } from '@modules/patients/patients.routes';

const router = Router();

router.use('/', healthRouter);
router.use('/', authRouter);
router.use('/', patientsRouter);

export const apiRouter = router;
