// Demo mode: the same API as the Express server, running in the browser.
// Used for the GitHub Pages live demo, where there is no server.
// The plan comes from the server's seed data; the visitor's ticks are saved in localStorage.
import SEED from '../../server/db/seed-data.json';
import { streaks } from './streaks.js';

const KEY = 'soft75-demo-v1';
const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
};
const store = load();
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* private mode */ } };
const bucket = (name) => (store[name] ??= {});

const recipes = Object.fromEntries(SEED.recipes.map((r) => [r.id, r]));
const summary = (id) => { const { ingredients, method, ...rest } = recipes[id]; return rest; };
const MEAL_ORDER = { breakfast: 1, lunch: 2, dinner: 3 };
const reply = (value) => Promise.resolve(structuredClone(value));
const fail = (message) => Promise.reject(new Error(message));

const EMPTY_LOG = { nourish: false, move: false, water: 0, read: false, brain: false, mood: null, note: '' };
const points = (l) => Number(l.nourish) + Number(l.move) + Number(l.water >= 12) + Number(l.read);
const getLog = (n) => { const l = { day: n, ...EMPTY_LOG, ...bucket('days')[n] }; return { ...l, points: points(l) }; };

// Shopping items get stable ids like "3-12" (week 3, item 12).
const shoppingFor = (w) => {
  const checks = bucket('shopping');
  let i = 0;
  return SEED.weeks[w - 1].shopping.map((g) => ({
    category: g.category,
    items: g.items.map((name) => { const id = `${w}-${++i}`; return { id, name, checked: !!checks[id] }; }),
  }));
};

export const demoApi = {
  day(n) {
    const d = SEED.days[n - 1];
    if (!d) return fail('That day is not in the plan.');
    return reply({
      day: d.n, week: d.week, date: d.date, workout: d.workout, isRecovery: d.recovery,
      affirmation: d.affirmation, brainstack: d.brainstack, reading: d.reading, milestone: d.milestone ?? null,
      meals: { breakfast: summary(d.breakfast), lunch: summary(d.lunch), dinner: summary(d.dinner) },
    });
  },
  log: (n) => reply(getLog(n)),
  logs: () => reply(Object.keys(bucket('days')).map(Number).sort((a, b) => a - b).map(getLog)),
  saveLog(n, changes) {
    bucket('days')[n] = { ...bucket('days')[n], ...changes };
    persist();
    return reply(getLog(n));
  },
  recipes(meal, q) {
    const needle = (q || '').toLowerCase();
    const list = SEED.recipes
      .filter((r) => meal === 'all' || r.meal === meal)
      .filter((r) => !needle || (r.name + ' ' + r.ingredients.join(' ')).toLowerCase().includes(needle))
      .sort((a, b) => MEAL_ORDER[a.meal] - MEAL_ORDER[b.meal] || a.name.localeCompare(b.name))
      .map((r) => ({ ...summary(r.id), ingredientCount: r.ingredients.length }));
    return reply(list);
  },
  recipe: (id) => (recipes[id] ? reply(recipes[id]) : fail('No recipe with that id.')),
  week(w) {
    const wk = SEED.weeks[w - 1];
    const r = bucket('reflections')[w] || {};
    return reply({
      week: w, fromDay: wk.fromDay, toDay: wk.toDay, shopping: shoppingFor(w),
      recipes: wk.recipes.map(summary).sort((a, b) => MEAL_ORDER[a.meal] - MEAL_ORDER[b.meal] || a.name.localeCompare(b.name)),
      reflection: { wentWell: '', wasHard: '', learned: '', focus: '', proud: '', ...r },
    });
  },
  tick(w, itemId, checked) {
    if (checked) bucket('shopping')[itemId] = true; else delete bucket('shopping')[itemId];
    persist();
    return reply({ id: itemId, checked });
  },
  saveReflection(w, changes) {
    bucket('reflections')[w] = { ...bucket('reflections')[w], ...changes };
    persist();
    return reply({ week: w, saved: Object.keys(changes) });
  },
  journal() {
    const j = bucket('journal');
    return reply(SEED.journal.map((p) => ({ ...p, note: j[p.week]?.note ?? '', done: !!j[p.week]?.done })));
  },
  saveJournal(w, changes) {
    bucket('journal')[w] = { ...bucket('journal')[w], ...changes };
    persist();
    return reply({ week: w, ...bucket('journal')[w] });
  },
  progress(today) {
    const upTo = Math.min(75, Math.max(0, Math.floor((Date.parse(today) - Date.parse(SEED.start)) / 86_400_000) + 1));
    const byDay = Array.from({ length: 75 }, (_, i) => getLog(i + 1));
    const past = byDay.slice(0, upTo);
    const count = (f) => past.filter(f).length;
    const { current, best } = streaks(past.map((l) => l.points));
    return reply({
      day: upTo, daysLeft: 75 - upTo,
      rituals: past.reduce((a, l) => a + l.points, 0), possible: upTo * 4,
      perfectDays: count((l) => l.points === 4), brainstackBonuses: count((l) => l.brain),
      perRitual: { nourish: count((l) => l.nourish), move: count((l) => l.move), water: count((l) => l.water >= 12), read: count((l) => l.read) },
      streak: current, bestStreak: best, pointsByDay: byDay.map((l) => l.points),
    });
  },
};
