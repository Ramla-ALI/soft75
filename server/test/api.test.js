import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { openDb, seed } from '../src/db.js';
import { createApp } from '../src/app.js';
import { streaks, dayNumber } from '../src/stats.js';

let app;
beforeEach(() => {
  const db = openDb(':memory:'); // fresh database for every test
  seed(db);
  app = createApp(db);
});

describe('plan', () => {
  it('returns Day 1 with its meals, workout and reading', async () => {
    const res = await request(app).get('/api/days/1').expect(200);
    expect(res.body.date).toBe('2026-11-19');
    expect(res.body.meals.breakfast.name).toBe('Berry overnight oats');
    expect(res.body.reading).toEqual({ book: 'Atomic Habits', from: 1, to: 10 });
  });

  it('marks Day 7 as a recovery day with a milestone', async () => {
    const res = await request(app).get('/api/days/7').expect(200);
    expect(res.body.isRecovery).toBe(true);
    expect(res.body.milestone).toMatch(/One week/);
  });

  it('rejects a day outside 1–75', async () => {
    const res = await request(app).get('/api/days/76').expect(400);
    expect(res.body.error).toMatch(/1 to 75/);
  });

  it('searches recipes by ingredient and filters by meal', async () => {
    const res = await request(app).get('/api/recipes?q=salmon&meal=dinner').expect(200);
    expect(res.body.map(r => r.name)).toEqual(['Lemon herb salmon', 'Teriyaki salmon with pak choi']);
  });

  it('returns a full recipe with ingredients and method in order', async () => {
    const res = await request(app).get('/api/recipes/shakshuka-for-one').expect(200);
    expect(res.body.ingredients[0]).toBe('2 eggs');
    expect(res.body.method).toHaveLength(5);
  });
});

describe('day logs', () => {
  it('returns an empty log for a day with no ticks', async () => {
    const res = await request(app).get('/api/logs/days/3').expect(200);
    expect(res.body).toMatchObject({ day: 3, nourish: false, water: 0, points: 0 });
  });

  it('saves ticks and only counts water at 12 glasses', async () => {
    await request(app).patch('/api/logs/days/3').send({ nourish: true, move: true, read: true, water: 11 }).expect(200);
    let res = await request(app).get('/api/logs/days/3');
    expect(res.body.points).toBe(3);
    res = await request(app).patch('/api/logs/days/3').send({ water: 12 }).expect(200);
    expect(res.body.points).toBe(4);
    expect(res.body.nourish).toBe(true); // earlier fields are kept
  });

  it('rejects bad values with a clear message', async () => {
    const res = await request(app).patch('/api/logs/days/3').send({ water: 20 }).expect(400);
    expect(res.body.error).toMatch(/water/);
    await request(app).patch('/api/logs/days/3').send({ mood: 'grumpy' }).expect(400);
    await request(app).patch('/api/logs/days/3').send({ nourish: 'yes' }).expect(400);
    await request(app).patch('/api/logs/days/3').send({}).expect(400);
  });
});

describe('weeks', () => {
  it('returns the shopping list grouped by aisle and saves ticks', async () => {
    const week = await request(app).get('/api/weeks/1').expect(200);
    const first = week.body.shopping[0].items[0];
    await request(app).put(`/api/weeks/1/shopping/${first.id}`).send({ checked: true }).expect(200);
    const again = await request(app).get('/api/weeks/1');
    expect(again.body.shopping[0].items[0].checked).toBe(true);
  });

  it('will not tick an item from a different week', async () => {
    const week2 = await request(app).get('/api/weeks/2');
    const item = week2.body.shopping[0].items[0];
    await request(app).put(`/api/weeks/1/shopping/${item.id}`).send({ checked: true }).expect(404);
  });

  it('saves the Sunday reflection', async () => {
    await request(app).patch('/api/weeks/1/reflection').send({ wentWell: 'Walked every day' }).expect(200);
    const res = await request(app).get('/api/weeks/1');
    expect(res.body.reflection.wentWell).toBe('Walked every day');
    expect(res.body.reflection.focus).toBe('');
  });
});

describe('journal', () => {
  it('lists 11 prompts and saves a finished page', async () => {
    await request(app).patch('/api/journal/2').send({ done: true, note: 'Used a lemon sticker' }).expect(200);
    const res = await request(app).get('/api/journal').expect(200);
    expect(res.body).toHaveLength(11);
    expect(res.body[1]).toMatchObject({ title: 'Kitchen memories', done: true, note: 'Used a lemon sticker' });
  });
});

describe('progress', () => {
  it('counts rituals, perfect days and streaks up to today', async () => {
    const all = { nourish: true, move: true, read: true, water: 12 };
    await request(app).patch('/api/logs/days/1').send(all);
    await request(app).patch('/api/logs/days/2').send(all);
    await request(app).patch('/api/logs/days/3').send({ nourish: true, brain: true });
    const res = await request(app).get('/api/progress?today=2026-11-21').expect(200);
    expect(res.body).toMatchObject({ day: 3, rituals: 9, possible: 12, perfectDays: 2, streak: 2, bestStreak: 2, brainstackBonuses: 1 });
  });
});

describe('stats helpers', () => {
  it('works out the challenge day from a date', () => {
    expect(dayNumber('2026-11-19', '2026-11-19')).toBe(1);
    expect(dayNumber('2026-11-19', '2027-02-01')).toBe(75);
  });

  it('keeps the streak alive while today is unfinished', () => {
    expect(streaks([4, 4, 4, 1])).toEqual({ current: 3, best: 3 });
    expect(streaks([4, 0, 4, 4])).toEqual({ current: 2, best: 2 });
    expect(streaks([4, 4, 2, 0])).toEqual({ current: 0, best: 2 });
  });
});
