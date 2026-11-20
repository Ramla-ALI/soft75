import { openDb, seed } from '../src/db.js';

const db = openDb();
const result = seed(db);
console.log(result.seeded ? '🌱 Database seeded with the 75-day plan.' : 'Database already has the plan. Nothing to do.');
db.close();
