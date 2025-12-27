import { Router } from 'express';
import { requireAdmin } from '@middleware/auth';
import {
  createPatientInsightHandler,
  deletePatientInsightHandler,
  listPatientInsightsHandler,
  updatePatientInsightHandler
} from './patientInsights.controller';

const router = Router();

router.get('/admin/patients/:id/insights', requireAdmin, listPatientInsightsHandler);
router.post('/admin/patients/:id/insights', requireAdmin, createPatientInsightHandler);
router.patch('/admin/insights/:insightId', requireAdmin, updatePatientInsightHandler);
router.delete('/admin/insights/:insightId', requireAdmin, deletePatientInsightHandler);

export const patientInsightsRouter = router;

