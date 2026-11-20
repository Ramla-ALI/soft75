import express from 'express';
import cors from 'cors';
import { planRouter } from './routes/plan.js';
import { logsRouter } from './routes/logs.js';
import { weeksRouter } from './routes/weeks.js';
import { journalRouter } from './routes/journal.js';
import { progressRouter } from './routes/progress.js';
import { HttpError } from './validate.js';

/**
 * Build the Express app around a database connection.
 * Keeping this separate from index.js lets the tests run it against an in-memory database.
 */
export function createApp(db) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50kb' }));

  // One user for now. This is where real authentication would set req.userId.
  app.use((req, _res, next) => {
    req.db = db;
    req.userId = 1;
    next();
  });

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api', planRouter);
  app.use('/api/logs', logsRouter);
  app.use('/api/weeks', weeksRouter);
  app.use('/api/journal', journalRouter);
  app.use('/api/progress', progressRouter);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // Central error handler: known validation errors become 4xx, anything else 500.
  app.use((err, _req, res, _next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'The request body is not valid JSON.' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  });

  return app;
}
