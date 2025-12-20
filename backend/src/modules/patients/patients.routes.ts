import { Router } from 'express';
import { listAdminPatients } from './patients.controller';
import { requireAdmin } from '@middleware/auth';

const router = Router();

router.get('/admin/patients', requireAdmin, listAdminPatients);

export const patientsRouter = router;

