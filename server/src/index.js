import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { openDb, seed } from './db.js';
import { createApp } from './app.js';

const db = openDb();
seed(db); // first run: load the plan automatically
const app = createApp(db);

// In production, serve the built React app from the same server.
const dist = join(dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(join(dist, 'index.html')));
}

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => console.log(`🌸 75 Soft API running at http://localhost:${port}/api`));
