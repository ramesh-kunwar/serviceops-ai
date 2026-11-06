import express from 'express';
import { requestsRouter } from './features/service-requests/routes.js';
import type { ErrorRequestHandler } from 'express';

export const app = express();

app.use(express.json({ limit: '16kb' }));

app.use('/api/requests', requestsRouter);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
  });
});

const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (
    error instanceof SyntaxError &&
    'type' in error &&
    error.type === 'entity.parse.failed'
  ) {
    res.status(400).json({
      error: 'Invalid JSON body',
    });
    return;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  ) {
    res.status(413).json({
      error: 'Request body too large',
    });
    return;
  }

  res.status(500).json({
    error: 'Internal server error',
  });
};

app.use(errorHandler);
