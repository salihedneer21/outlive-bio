import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiRouter } from '@routes/index';
import { requestLogger } from '@middleware/requestLogger';
import { notFoundHandler } from '@middleware/notFoundHandler';
import { errorHandler } from '@middleware/errorHandler';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

