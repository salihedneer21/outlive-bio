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
import { dashboardRouter } from '@modules/dashboard/dashboard.routes';
import { adminUsersRouter } from '@modules/admin-users/adminUsers.routes';
import { chatRouter } from '@modules/chat/chat.routes';
import { notificationsRouter } from '@modules/notifications/notifications.routes';

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
router.use('/', dashboardRouter);
router.use('/', adminUsersRouter);
router.use('/', chatRouter);
router.use('/', notificationsRouter);

export const apiRouter = router;
