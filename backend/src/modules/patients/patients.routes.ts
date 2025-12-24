import { Router } from 'express';
import {
  getAdminPatientComprehensiveIntakeHandler,
  getAdminPatientProfileHandler,
  getAdminPatientsStatsHandler,
  impersonateAdminPatientHandler,
  listAdminPatients
} from './patients.controller';
import { requireAdmin } from '@middleware/auth';

const router = Router();

router.get('/admin/patients', requireAdmin, listAdminPatients);
router.get('/admin/patients/stats', requireAdmin, getAdminPatientsStatsHandler);
router.get('/admin/patients/:id/profile', requireAdmin, getAdminPatientProfileHandler);
router.get(
  '/admin/patients/:id/comprehensive-intake',
  requireAdmin,
  getAdminPatientComprehensiveIntakeHandler
);
router.post('/admin/patients/:id/impersonate', requireAdmin, impersonateAdminPatientHandler);

export const patientsRouter = router;
