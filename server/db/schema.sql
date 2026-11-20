-- 75 Soft Studio database schema (SQLite)
-- Two kinds of data:
--   1. The PLAN: recipes, the 75 planned days, weeks and journal prompts (seeded, read-only)
--   2. The LOGS: what a user actually did each day, week and journal page (read/write)

PRAGMA foreign_keys = ON;

-- ---------- users ----------
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  start_date  TEXT    NOT NULL,                 -- ISO date the user's challenge began
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------- recipes ----------
CREATE TABLE IF NOT EXISTS recipes (
  id         TEXT PRIMARY KEY,                  -- slug, e.g. 'berry-overnight-oats'
  name       TEXT NOT NULL,
  meal       TEXT NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner')),
  time       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id  TEXT    NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position   INTEGER NOT NULL,
  text       TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS recipe_steps (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id  TEXT    NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position   INTEGER NOT NULL,
  text       TEXT    NOT NULL
);

-- ---------- the 75-day plan ----------
CREATE TABLE IF NOT EXISTS weeks (
  week       INTEGER PRIMARY KEY CHECK (week BETWEEN 1 AND 11),
  from_day   INTEGER NOT NULL,
  to_day     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS plan_days (
  day           INTEGER PRIMARY KEY CHECK (day BETWEEN 1 AND 75),
  week          INTEGER NOT NULL REFERENCES weeks(week),
  breakfast_id  TEXT    NOT NULL REFERENCES recipes(id),
  lunch_id      TEXT    NOT NULL REFERENCES recipes(id),
  dinner_id     TEXT    NOT NULL REFERENCES recipes(id),
  workout       TEXT    NOT NULL,
  is_recovery   INTEGER NOT NULL DEFAULT 0,
  affirmation   TEXT    NOT NULL,
  brainstack    TEXT    NOT NULL,
  book          TEXT    NOT NULL,
  page_from     INTEGER NOT NULL,
  page_to       INTEGER NOT NULL,
  milestone     TEXT
);

CREATE TABLE IF NOT EXISTS shopping_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  week       INTEGER NOT NULL REFERENCES weeks(week),
  category   TEXT    NOT NULL,
  name       TEXT    NOT NULL,
  UNIQUE (week, name)
);

CREATE TABLE IF NOT EXISTS journal_prompts (
  week       INTEGER PRIMARY KEY REFERENCES weeks(week),
  title      TEXT NOT NULL,
  prompt     TEXT NOT NULL,
  collect    TEXT NOT NULL
);

-- ---------- what the user actually did ----------
CREATE TABLE IF NOT EXISTS day_logs (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day        INTEGER NOT NULL REFERENCES plan_days(day),
  nourish    INTEGER NOT NULL DEFAULT 0 CHECK (nourish IN (0, 1)),
  move       INTEGER NOT NULL DEFAULT 0 CHECK (move IN (0, 1)),
  water      INTEGER NOT NULL DEFAULT 0 CHECK (water BETWEEN 0 AND 12),   -- glasses of 250 ml
  read       INTEGER NOT NULL DEFAULT 0 CHECK (read IN (0, 1)),
  brain      INTEGER NOT NULL DEFAULT 0 CHECK (brain IN (0, 1)),
  mood       TEXT    CHECK (mood IN ('glowing', 'calm', 'tired', 'low')),
  note       TEXT    NOT NULL DEFAULT '',
  updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, day)
);

CREATE TABLE IF NOT EXISTS shopping_checks (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id    INTEGER NOT NULL REFERENCES shopping_items(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS week_reflections (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week       INTEGER NOT NULL REFERENCES weeks(week),
  went_well  TEXT NOT NULL DEFAULT '',
  was_hard   TEXT NOT NULL DEFAULT '',
  learned    TEXT NOT NULL DEFAULT '',
  focus      TEXT NOT NULL DEFAULT '',
  proud      TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, week)
);

CREATE TABLE IF NOT EXISTS journal_entries (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week       INTEGER NOT NULL REFERENCES journal_prompts(week),
  note       TEXT    NOT NULL DEFAULT '',
  done       INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, week)
);

-- A view that scores each logged day: water counts as done at 12 glasses (3 litres)
CREATE VIEW IF NOT EXISTS day_scores AS
SELECT user_id, day,
       nourish + move + (water >= 12) + read AS points,
       brain
FROM day_logs;

CREATE INDEX IF NOT EXISTS idx_plan_days_week ON plan_days(week);
CREATE INDEX IF NOT EXISTS idx_shopping_items_week ON shopping_items(week);
