import { useEffect, useState } from 'react';
import { api, todayIso } from '../api.js';

const RITUALS = [
  ['nourish', '🥗 Nourish', 'var(--lilac)'],
  ['move', '🧘‍♀️ Move', 'var(--rose)'],
  ['water', '💧 Water', 'var(--sky)'],
  ['read', '📖 Read', 'var(--sage)'],
];

export default function Progress() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.progress(todayIso()).then(setS).catch((e) => setError(e.message)); }, []);

  if (error) return <p className="empty" role="alert">{error}</p>;
  if (!s) return <p className="empty">Adding up your progress…</p>;

  const W = 640, H = 200, left = 28, bottom = 26, cw = (W - left - 8) / 75;
  const y = (v) => H - bottom - ((H - bottom - 10) * v) / 4;

  return (
    <section className="view">
      <h2>My progress</h2>
      <div className="stats">
        <Stat value={s.rituals} label={`rituals done of ${s.possible} so far`} />
        <Stat value={s.streak} label="day streak of perfect days" />
        <Stat value={s.perfectDays} label="perfect days (all 4)" />
        <Stat value={s.bestStreak} label="best streak" />
        <Stat value={s.brainstackBonuses} label="brainstack bonuses ✨" />
        <Stat value={s.daysLeft} label="days to go" />
      </div>

      <div className="card">
        <h3>Rituals completed each day</h3>
        <div className="chart">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Rituals completed each day">
            {[0, 1, 2, 3, 4].map((v) => (
              <g key={v}>
                <line x1={left} x2={W - 8} y1={y(v)} y2={y(v)} stroke="var(--line)" />
                <text x={left - 8} y={y(v) + 4} fontSize="11" textAnchor="end" fill="var(--muted)">{v}</text>
              </g>
            ))}
            {s.pointsByDay.map((p, i) => (
              <rect key={i} x={left + i * cw + 1} y={y(p)} width={Math.max(cw - 2, 2)} height={y(0) - y(p)} rx="2"
                fill={i + 1 === s.day ? 'var(--ink)' : 'var(--rose)'} opacity={i + 1 > s.day ? 0.25 : 1}>
                <title>Day {i + 1}: {p}/4</title>
              </rect>
            ))}
            {[1, 15, 30, 45, 60, 75].map((n) => (
              <text key={n} x={left + (n - 0.5) * cw} y={H - 8} fontSize="11" textAnchor="middle" fill="var(--muted)">{n}</text>
            ))}
          </svg>
        </div>
      </div>

      <div className="card">
        <h3>Each ritual so far</h3>
        <div className="bars">
          {RITUALS.map(([k, label, color]) => (
            <div className="bar" key={k}>
              <span>{label}</span>
              <div className="track"><div className="fill" style={{ width: `${s.day ? (s.perRitual[k] / s.day) * 100 : 0}%`, background: color }} /></div>
              <em>{s.perRitual[k]}/{s.day}</em>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }) {
  return <div className="stat"><b>{value}</b><span>{label}</span></div>;
}
