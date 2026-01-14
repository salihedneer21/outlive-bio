import { createServer } from 'http';
import { createApp } from './app';
import { env } from '@config/env';
import { logger } from '@config/logger';
import { initializeSocket } from '@socket/index';

const app = createApp();
const httpServer = createServer(app);

initializeSocket(httpServer);

const port = env.PORT;

httpServer.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});

