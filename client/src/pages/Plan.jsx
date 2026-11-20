import { useEffect, useState } from 'react';
import { api, todayDay } from '../api.js';

export default function Plan({ openDay }) {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.logs().then(setLogs).catch((e) => setError(e.message)); }, []);

  if (error) return <p className="empty" role="alert">{error}</p>;
  if (!logs) return <p className="empty">Loading your 75 days…</p>;

  const byDay = Object.fromEntries(logs.map((l) => [l.day, l]));
  const today = todayDay();

  return (
    <section className="view">
      <h2>All 75 days</h2>
      <p className="muted">Tap a day to open it. Darker pink means more rituals done. ✨ marks a Brainstack bonus.</p>
      {Array.from({ length: 11 }, (_, w) => (
        <div key={w}>
          <h3>Week {w + 1}</h3>
          <div className="grid75">
            {Array.from({ length: 7 }, (_, i) => w * 7 + i + 1).filter((n) => n <= 75).map((n) => {
              const l = byDay[n];
              const p = l?.points ?? 0;
              return (
                <button key={n} className={`tile s${p}${n === today ? ' today' : ''}${n > today ? ' future' : ''}`} onClick={() => openDay(n)} aria-label={`Day ${n}, ${p} of 4 done`}>
                  {l?.brain && <span className="star">✨</span>}
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
