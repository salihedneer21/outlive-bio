import { createApp } from './app';
import { env } from '@config/env';
import { logger } from '@config/logger';

const app = createApp();

const port = env.PORT;

app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});

