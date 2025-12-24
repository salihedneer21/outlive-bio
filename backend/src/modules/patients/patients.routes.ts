import { Router } from 'express';
import {
  getAdminPatientsStatsHandler,
  impersonateAdminPatientHandler,
  listAdminPatients
} from './patients.controller';
import { requireAdmin } from '@middleware/auth';

const router = Router();

router.get('/admin/patients', requireAdmin, listAdminPatients);
router.get('/admin/patients/stats', requireAdmin, getAdminPatientsStatsHandler);
router.post('/admin/patients/:id/impersonate', requireAdmin, impersonateAdminPatientHandler);

export const patientsRouter = router;
