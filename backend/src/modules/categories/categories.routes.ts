import { Router } from 'express';
import { requireAdmin } from '@middleware/auth';
import {
  createAdminCategoryHandler,
  deleteAdminCategoryHandler,
  getAdminCategory,
  listAdminCategories,
  updateAdminCategoryHandler
} from './categories.controller';

const router = Router();

router.get('/admin/categories', requireAdmin, listAdminCategories);
router.get('/admin/categories/:id', requireAdmin, getAdminCategory);
router.post('/admin/categories', requireAdmin, createAdminCategoryHandler);
router.put('/admin/categories/:id', requireAdmin, updateAdminCategoryHandler);
router.delete('/admin/categories/:id', requireAdmin, deleteAdminCategoryHandler);

export const categoriesRouter = router;

