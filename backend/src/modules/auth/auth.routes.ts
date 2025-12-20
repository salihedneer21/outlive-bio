import { Router } from 'express';
import { login } from './auth.controller';

const router = Router();

router.post('/auth/login', login);

export const authRouter = router;
