import { Router } from 'express';
import { requireAdmin } from '@middleware/auth';
import {
  addAdminHandler,
  listAdminUsersHandler,
  removeAdminHandler,
  searchAdminCandidatesHandler
} from './adminUsers.controller';

const router = Router();

router.get('/admin/admins', requireAdmin, listAdminUsersHandler);
router.get('/admin/admins/search', requireAdmin, searchAdminCandidatesHandler);
router.post('/admin/admins', requireAdmin, addAdminHandler);
router.delete('/admin/admins/:userId', requireAdmin, removeAdminHandler);

export const adminUsersRouter = router;
