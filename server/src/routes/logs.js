import { Router } from 'express';
import { intParam, pick, bool, text, intRange, oneOf } from '../validate.js';

export const logsRouter = Router();

const EMPTY = { nourish: false, move: false, water: 0, read: false, brain: false, mood: null, note: '' };

function toJson(row, day) {
  if (!row) return { day, ...EMPTY, points: 0 };
  const out = {
    day: row.day,
    nourish: !!row.nourish, move: !!row.move, water: row.water, read: !!row.read,
    brain: !!row.brain, mood: row.mood, note: row.note,
  };
  out.points = Number(out.nourish) + Number(out.move) + Number(out.water >= 12) + Number(out.read);
  return out;
}

/** GET /api/logs/days — every logged day (for the 75-day grid). */
logsRouter.get('/days', (req, res) => {
  const rows = req.db.prepare('SELECT * FROM day_logs WHERE user_id = ? ORDER BY day').all(req.userId);
  res.json(rows.map(r => toJson(r, r.day)));
});

/** GET /api/logs/days/:day — what was done on one day. */
logsRouter.get('/days/:day', (req, res) => {
  const day = intParam(req.params.day, 'day', 1, 75);
  const row = req.db.prepare('SELECT * FROM day_logs WHERE user_id = ? AND day = ?').get(req.userId, day);
  res.json(toJson(row, day));
});

/** PATCH /api/logs/days/:day — update any of the day's fields (creates the row if needed). */
logsRouter.patch('/days/:day', (req, res) => {
  const day = intParam(req.params.day, 'day', 1, 75);
  const changes = pick(req.body, {
    nourish: bool, move: bool, read: bool, brain: bool,
    water: intRange(0, 12),
    mood: oneOf('glowing', 'calm', 'tired', 'low'),
    note: text(2000),
  });
  const cols = Object.keys(changes);
  // Upsert: insert the row, or update only the fields that were sent.
  req.db.prepare(`
    INSERT INTO day_logs (user_id, day, ${cols.join(', ')}) VALUES (@user_id, @day, ${cols.map(c => '@' + c).join(', ')})
    ON CONFLICT (user_id, day) DO UPDATE SET ${cols.map(c => `${c} = excluded.${c}`).join(', ')}, updated_at = datetime('now')
  `).run({ user_id: req.userId, day, ...changes });
  const row = req.db.prepare('SELECT * FROM day_logs WHERE user_id = ? AND day = ?').get(req.userId, day);
  res.json(toJson(row, day));
});
