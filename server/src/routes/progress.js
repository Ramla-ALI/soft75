import { Router } from 'express';
import { streaks, dayNumber } from '../stats.js';

export const progressRouter = Router();

/** GET /api/progress?today=2026-12-01 — totals, streaks and per-ritual counts up to today. */
progressRouter.get('/', (req, res) => {
  const user = req.db.prepare('SELECT start_date FROM users WHERE id = ?').get(req.userId);
  const today = typeof req.query.today === 'string' ? req.query.today : new Date().toISOString().slice(0, 10);
  const upTo = Math.min(75, Math.max(0, dayNumber(user.start_date, today)));

  // All the counting happens in SQL, using the day_scores view.
  const totals = req.db.prepare(`
    SELECT COALESCE(SUM(l.nourish), 0) AS nourish,
           COALESCE(SUM(l.move), 0) AS move,
           COALESCE(SUM(l.water >= 12), 0) AS water,
           COALESCE(SUM(l.read), 0) AS read,
           COALESCE(SUM(l.brain), 0) AS brain,
           COALESCE(SUM(s.points = 4), 0) AS perfectDays,
           COALESCE(SUM(s.points), 0) AS rituals
    FROM day_logs l JOIN day_scores s ON s.user_id = l.user_id AND s.day = l.day
    WHERE l.user_id = ? AND l.day <= ?
  `).get(req.userId, upTo);

  const perDay = req.db.prepare('SELECT day, points FROM day_scores WHERE user_id = ? ORDER BY day').all(req.userId);
  const points = Array(76).fill(0);
  for (const r of perDay) points[r.day] = r.points;

  const { current, best } = streaks(points.slice(1, upTo + 1));

  res.json({
    day: upTo,
    daysLeft: 75 - upTo,
    rituals: totals.rituals,
    possible: upTo * 4,
    perfectDays: totals.perfectDays,
    brainstackBonuses: totals.brain,
    perRitual: { nourish: totals.nourish, move: totals.move, water: totals.water, read: totals.read },
    streak: current,
    bestStreak: best,
    pointsByDay: points.slice(1),
  });
});
