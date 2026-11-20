// A tiny wrapper around fetch for the 75 Soft API.
async function call(method, path, body) {
  const res = await fetch('/api' + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

import { demoApi } from './demoApi.js';

export const IS_DEMO = import.meta.env.VITE_DEMO === 'true';

const serverApi = {
  day: (n) => call('GET', `/days/${n}`),
  log: (n) => call('GET', `/logs/days/${n}`),
  logs: () => call('GET', '/logs/days'),
  saveLog: (n, changes) => call('PATCH', `/logs/days/${n}`, changes),
  recipes: (meal, q) => call('GET', `/recipes?${new URLSearchParams({ ...(meal !== 'all' && { meal }), ...(q && { q }) })}`),
  recipe: (id) => call('GET', `/recipes/${id}`),
  week: (w) => call('GET', `/weeks/${w}`),
  tick: (w, itemId, checked) => call('PUT', `/weeks/${w}/shopping/${itemId}`, { checked }),
  saveReflection: (w, changes) => call('PATCH', `/weeks/${w}/reflection`, changes),
  journal: () => call('GET', '/journal'),
  saveJournal: (w, changes) => call('PATCH', `/journal/${w}`, changes),
  progress: (today) => call('GET', `/progress?today=${today}`),
};

// On GitHub Pages there is no server, so the demo build uses the in-browser version.
export const api = IS_DEMO ? demoApi : serverApi;

export const START = '2026-11-19';
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const todayDay = () => {
  const n = Math.floor((Date.parse(todayIso()) - Date.parse(START)) / 86_400_000) + 1;
  return Math.min(75, Math.max(1, n));
};
export const fmtDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
