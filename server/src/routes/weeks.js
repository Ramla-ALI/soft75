import { Router } from 'express';
import { HttpError, intParam, pick, text, bool } from '../validate.js';

export const weeksRouter = Router();

const FIELDS = { went_well: 'wentWell', was_hard: 'wasHard', learned: 'learned', focus: 'focus', proud: 'proud' };

/** GET /api/weeks/:week — shopping list (with ticks) and Sunday reflection. */
weeksRouter.get('/:week', (req, res) => {
  const week = intParam(req.params.week, 'week', 1, 11);
  const w = req.db.prepare('SELECT * FROM weeks WHERE week = ?').get(week);
  if (!w) throw new HttpError(404, 'That week is not in the plan. Run npm run seed first.');

  const items = req.db.prepare(`
    SELECT s.id, s.category, s.name, (c.item_id IS NOT NULL) AS checked
    FROM shopping_items s
    LEFT JOIN shopping_checks c ON c.item_id = s.id AND c.user_id = ?
    WHERE s.week = ?
    ORDER BY s.id
  `).all(req.userId, week);

  const shopping = [];
  for (const it of items) {
    let group = shopping.find(g => g.category === it.category);
    if (!group) shopping.push(group = { category: it.category, items: [] });
    group.items.push({ id: it.id, name: it.name, checked: !!it.checked });
  }

  const recipes = req.db.prepare(`
    SELECT DISTINCT r.id, r.name, r.meal, r.time FROM plan_days d
    JOIN recipes r ON r.id IN (d.breakfast_id, d.lunch_id, d.dinner_id)
    WHERE d.week = ?
    ORDER BY CASE r.meal WHEN 'breakfast' THEN 1 WHEN 'lunch' THEN 2 ELSE 3 END, r.name
  `).all(week);

  const r = req.db.prepare('SELECT * FROM week_reflections WHERE user_id = ? AND week = ?').get(req.userId, week) || {};
  const reflection = Object.fromEntries(Object.entries(FIELDS).map(([col, key]) => [key, r[col] || '']));

  res.json({ week, fromDay: w.from_day, toDay: w.to_day, shopping, recipes, reflection });
});

/** PUT /api/weeks/:week/shopping/:itemId — tick or untick an item. Body: { checked: true } */
weeksRouter.put('/:week/shopping/:itemId', (req, res) => {
  const week = intParam(req.params.week, 'week', 1, 11);
  const itemId = intParam(req.params.itemId, 'itemId', 1, 1e9);
  const { checked } = pick(req.body, { checked: bool });
  const item = req.db.prepare('SELECT id FROM shopping_items WHERE id = ? AND week = ?').get(itemId, week);
  if (!item) throw new HttpError(404, 'That item is not on this week’s list.');
  if (checked) req.db.prepare('INSERT OR IGNORE INTO shopping_checks (user_id, item_id) VALUES (?, ?)').run(req.userId, itemId);
  else req.db.prepare('DELETE FROM shopping_checks WHERE user_id = ? AND item_id = ?').run(req.userId, itemId);
  res.json({ id: itemId, checked: !!checked });
});

/** PATCH /api/weeks/:week/reflection — save any of the reflection answers. */
weeksRouter.patch('/:week/reflection', (req, res) => {
  const week = intParam(req.params.week, 'week', 1, 11);
  const spec = Object.fromEntries(Object.values(FIELDS).map(k => [k, text(4000)]));
  const changes = pick(req.body, spec);
  const byCol = Object.fromEntries(Object.entries(FIELDS).filter(([, k]) => k in changes).map(([col, k]) => [col, changes[k]]));
  const cols = Object.keys(byCol);
  req.db.prepare(`
    INSERT INTO week_reflections (user_id, week, ${cols.join(', ')}) VALUES (@user_id, @week, ${cols.map(c => '@' + c).join(', ')})
    ON CONFLICT (user_id, week) DO UPDATE SET ${cols.map(c => `${c} = excluded.${c}`).join(', ')}, updated_at = datetime('now')
  `).run({ user_id: req.userId, week, ...byCol });
  res.json({ week, saved: Object.keys(changes) });
});
