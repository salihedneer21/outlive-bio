import { Router } from 'express';
import { login, logout, refresh } from './auth.controller';

const router = Router();

router.post('/auth/login', login);
router.post('/auth/refresh', refresh);
router.post('/auth/logout', logout);

export const authRouter = router;
