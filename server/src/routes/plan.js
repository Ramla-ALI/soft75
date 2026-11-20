import { Router } from 'express';
import { HttpError, intParam } from '../validate.js';

export const planRouter = Router();

function recipeSummary(db, id) {
  return db.prepare('SELECT id, name, meal, time FROM recipes WHERE id = ?').get(id);
}

function fullRecipe(db, id) {
  const recipe = recipeSummary(db, id);
  if (!recipe) return null;
  recipe.ingredients = db.prepare('SELECT text FROM recipe_ingredients WHERE recipe_id = ? ORDER BY position').all(id).map(r => r.text);
  recipe.method = db.prepare('SELECT text FROM recipe_steps WHERE recipe_id = ? ORDER BY position').all(id).map(r => r.text);
  return recipe;
}

/** GET /api/days/:day — the plan for one day, with its meals. */
planRouter.get('/days/:day', (req, res) => {
  const day = intParam(req.params.day, 'day', 1, 75);
  const row = req.db.prepare('SELECT * FROM plan_days WHERE day = ?').get(day);
  if (!row) throw new HttpError(404, 'That day is not in the plan. Run npm run seed first.');
  const user = req.db.prepare('SELECT start_date FROM users WHERE id = ?').get(req.userId);
  const date = new Date(user.start_date + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + day - 1);
  res.json({
    day: row.day,
    week: row.week,
    date: date.toISOString().slice(0, 10),
    workout: row.workout,
    isRecovery: Boolean(row.is_recovery),
    affirmation: row.affirmation,
    brainstack: row.brainstack,
    reading: { book: row.book, from: row.page_from, to: row.page_to },
    milestone: row.milestone,
    meals: {
      breakfast: recipeSummary(req.db, row.breakfast_id),
      lunch: recipeSummary(req.db, row.lunch_id),
      dinner: recipeSummary(req.db, row.dinner_id),
    },
  });
});

/** GET /api/recipes?meal=dinner&q=salmon — search the recipe book. */
planRouter.get('/recipes', (req, res) => {
  const { meal, q } = req.query;
  if (meal && !['breakfast', 'lunch', 'dinner'].includes(meal)) throw new HttpError(400, 'meal must be breakfast, lunch or dinner.');
  const like = q ? `%${String(q).toLowerCase()}%` : null;
  const rows = req.db.prepare(`
    SELECT r.id, r.name, r.meal, r.time, COUNT(i.id) AS ingredientCount
    FROM recipes r
    LEFT JOIN recipe_ingredients i ON i.recipe_id = r.id
    WHERE (@meal IS NULL OR r.meal = @meal)
      AND (@like IS NULL OR LOWER(r.name) LIKE @like
           OR r.id IN (SELECT recipe_id FROM recipe_ingredients WHERE LOWER(text) LIKE @like))
    GROUP BY r.id
    ORDER BY CASE r.meal WHEN 'breakfast' THEN 1 WHEN 'lunch' THEN 2 ELSE 3 END, r.name
  `).all({ meal: meal || null, like });
  res.json(rows);
});

/** GET /api/recipes/:id — one recipe with ingredients and method. */
planRouter.get('/recipes/:id', (req, res) => {
  const recipe = fullRecipe(req.db, req.params.id);
  if (!recipe) throw new HttpError(404, 'No recipe with that id.');
  res.json(recipe);
});
