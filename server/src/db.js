import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SCHEMA = readFileSync(join(here, '../db/schema.sql'), 'utf8');
const SEED = JSON.parse(readFileSync(join(here, '../db/seed-data.json'), 'utf8'));

/** Open (or create) the database and make sure the schema exists. */
export function openDb(file = process.env.DB_FILE || join(here, '../db/soft75.sqlite')) {
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}

/** Load the 75-day plan into an empty database. Safe to run twice. */
export function seed(db, { userName = 'Ramla' } = {}) {
  const already = db.prepare('SELECT COUNT(*) AS n FROM plan_days').get().n;
  if (already > 0) return { seeded: false };

  const insert = db.transaction(() => {
    const addRecipe = db.prepare('INSERT INTO recipes (id, name, meal, time) VALUES (?, ?, ?, ?)');
    const addIng = db.prepare('INSERT INTO recipe_ingredients (recipe_id, position, text) VALUES (?, ?, ?)');
    const addStep = db.prepare('INSERT INTO recipe_steps (recipe_id, position, text) VALUES (?, ?, ?)');
    for (const r of SEED.recipes) {
      addRecipe.run(r.id, r.name, r.meal, r.time);
      r.ingredients.forEach((t, i) => addIng.run(r.id, i + 1, t));
      r.method.forEach((t, i) => addStep.run(r.id, i + 1, t));
    }

    const addWeek = db.prepare('INSERT INTO weeks (week, from_day, to_day) VALUES (?, ?, ?)');
    const addItem = db.prepare('INSERT INTO shopping_items (week, category, name) VALUES (?, ?, ?)');
    for (const w of SEED.weeks) {
      addWeek.run(w.week, w.fromDay, w.toDay);
      for (const c of w.shopping) for (const name of c.items) addItem.run(w.week, c.category, name);
    }

    const addDay = db.prepare(`INSERT INTO plan_days
      (day, week, breakfast_id, lunch_id, dinner_id, workout, is_recovery, affirmation, brainstack, book, page_from, page_to, milestone)
      VALUES (@n, @week, @breakfast, @lunch, @dinner, @workout, @recovery, @affirmation, @brainstack, @book, @from, @to, @milestone)`);
    for (const d of SEED.days) {
      addDay.run({ ...d, recovery: d.recovery ? 1 : 0, book: d.reading.book, from: d.reading.from, to: d.reading.to, milestone: d.milestone ?? null });
    }

    const addPrompt = db.prepare('INSERT INTO journal_prompts (week, title, prompt, collect) VALUES (?, ?, ?, ?)');
    for (const j of SEED.journal) addPrompt.run(j.week, j.title, j.prompt, j.collect);

    db.prepare('INSERT INTO users (name, start_date) VALUES (?, ?)').run(userName, SEED.start);
  });
  insert();
  return { seeded: true };
}
