import { Router } from 'express';
import { intParam, pick, text, bool } from '../validate.js';

export const journalRouter = Router();

/** GET /api/journal — all 11 weekly prompts with the user's notes. */
journalRouter.get('/', (req, res) => {
  const rows = req.db.prepare(`
    SELECT p.week, p.title, p.prompt, p.collect, COALESCE(e.note, '') AS note, COALESCE(e.done, 0) AS done
    FROM journal_prompts p
    LEFT JOIN journal_entries e ON e.week = p.week AND e.user_id = ?
    ORDER BY p.week
  `).all(req.userId);
  res.json(rows.map(r => ({ ...r, done: !!r.done })));
});

/** PATCH /api/journal/:week — save a note or mark the page finished. */
journalRouter.patch('/:week', (req, res) => {
  const week = intParam(req.params.week, 'week', 1, 11);
  const changes = pick(req.body, { note: text(4000), done: bool });
  const cols = Object.keys(changes);
  req.db.prepare(`
    INSERT INTO journal_entries (user_id, week, ${cols.join(', ')}) VALUES (@user_id, @week, ${cols.map(c => '@' + c).join(', ')})
    ON CONFLICT (user_id, week) DO UPDATE SET ${cols.map(c => `${c} = excluded.${c}`).join(', ')}, updated_at = datetime('now')
  `).run({ user_id: req.userId, week, ...changes });
  const row = req.db.prepare('SELECT note, done FROM journal_entries WHERE user_id = ? AND week = ?').get(req.userId, week);
  res.json({ week, note: row.note, done: !!row.done });
});
