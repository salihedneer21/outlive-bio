import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '@middleware/auth';
import {
  createAdminProductHandler,
  deleteAdminProductHandler,
  getAdminProductHandler,
  listAdminProducts,
  updateAdminProductHandler,
  uploadProductImageHandler
} from './products.controller';

const router = Router();
const upload = multer();

router.get('/admin/products', requireAdmin, listAdminProducts);
router.get('/admin/products/:id', requireAdmin, getAdminProductHandler);
router.post('/admin/products', requireAdmin, createAdminProductHandler);
router.put('/admin/products/:id', requireAdmin, updateAdminProductHandler);
router.delete('/admin/products/:id', requireAdmin, deleteAdminProductHandler);
// Endpoint to upload product image so we will get URL to store in product record
router.post(
  '/admin/products/image',
  requireAdmin,
  upload.single('file'),
  uploadProductImageHandler
);

export const productsRouter = router;

