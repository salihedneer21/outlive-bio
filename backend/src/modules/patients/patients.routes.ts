import { Router } from 'express';
import { getAdminPatientsStatsHandler, listAdminPatients } from './patients.controller';
import { requireAdmin } from '@middleware/auth';

const router = Router();

router.get('/admin/patients', requireAdmin, listAdminPatients);
router.get('/admin/patients/stats', requireAdmin, getAdminPatientsStatsHandler);

export const patientsRouter = router;
