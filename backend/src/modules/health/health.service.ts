import type { HealthStatus } from './health.types';
import { env } from '@config/env';

export const getHealthStatus = (): HealthStatus => ({
  status: 'ok',
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
  environment: env.NODE_ENV
});

