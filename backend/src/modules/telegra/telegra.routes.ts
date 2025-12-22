import { Router } from 'express';
import { requireAdmin } from '@middleware/auth';
import {
  getTelegraProductHandler,
  listTelegraProductsHandler,
  testTelegraConnectionHandler
} from './telegra.controller';

const router = Router();

router.get('/admin/telegra/connection', requireAdmin, testTelegraConnectionHandler);
router.get('/admin/telegra/products', requireAdmin, listTelegraProductsHandler);
router.get('/admin/telegra/products/:id', requireAdmin, getTelegraProductHandler);

export const telegraRouter = router;

