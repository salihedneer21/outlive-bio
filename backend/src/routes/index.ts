import { Router } from 'express';
import { healthRouter } from '@modules/health/health.routes';
import { authRouter } from '@modules/auth/auth.routes';
import { patientsRouter } from '@modules/patients/patients.routes';
import { categoriesRouter } from '@modules/categories/categories.routes';
import { productsRouter } from '@modules/products/products.routes';
import { telegraRouter } from '@modules/telegra/telegra.routes';
import { patientNotesRouter } from '@modules/patient-notes/patientNotes.routes';
import { patientInsightsRouter } from '@modules/patient-insights/patientInsights.routes';
import { logsRouter } from '@modules/logs/logs.routes';

const router = Router();

router.use('/', healthRouter);
router.use('/', authRouter);
router.use('/', patientsRouter);
router.use('/', categoriesRouter);
router.use('/', productsRouter);
router.use('/', telegraRouter);
router.use('/', patientNotesRouter);
router.use('/', patientInsightsRouter);
router.use('/', logsRouter);

export const apiRouter = router;
