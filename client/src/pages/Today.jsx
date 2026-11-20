import { useEffect, useState } from 'react';
import { api, fmtDate, todayDay } from '../api.js';
import { useDebounced } from '../useDebounced.js';
import RitualCard from '../components/RitualCard.jsx';
import ProgressDial from '../components/ProgressDial.jsx';

const MOODS = [
  ['glowing', '🌸 Glowing'],
  ['calm', '🌿 Calm'],
  ['tired', '☁️ Tired'],
  ['low', '🌧️ Low'],
];

export default function Today({ day, setDay, openRecipe }) {
  const [plan, setPlan] = useState(null);
  const [log, setLog] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    setPlan(null);
    Promise.all([api.day(day), api.log(day)])
      .then(([p, l]) => live && (setPlan(p), setLog(l)))
      .catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, [day]);

  // Update the screen straight away, then save. If saving fails, show why.
  const update = (changes) => {
    setLog((old) => ({ ...old, ...changes }));
    api.saveLog(day, changes).then(setLog).catch((e) => setError(e.message));
  };
  const saveNote = useDebounced((note) => api.saveLog(day, { note }).catch((e) => setError(e.message)));

  if (error) return <p className="empty" role="alert">{error}</p>;
  if (!plan || !log) return <p className="empty">Loading Day {day}…</p>;

  const water = log.water;
  const points = Number(log.nourish) + Number(log.move) + Number(water >= 12) + Number(log.read);
  const isToday = day === todayDay();

  return (
    <section className="view">
      <div className="dayhead">
        <ProgressDial day={day} />
        <div>
          <h2>{isToday ? 'Today' : `Day ${day}`}, {fmtDate(plan.date)}</h2>
          <div className="daynav">
            <button className="btn" disabled={day <= 1} onClick={() => setDay(day - 1)}>← Previous</button>
            {!isToday && <button className="btn" onClick={() => setDay(todayDay())}>Back to today</button>}
            <button className="btn" disabled={day >= 75} onClick={() => setDay(day + 1)}>Next →</button>
            <span className="muted">Week {plan.week}</span>
          </div>
        </div>
      </div>

      <p className="aff">“{plan.affirmation}”</p>
      {plan.milestone && <div className="mile">🎉 {plan.milestone}</div>}

      <div className="card">
        <div className="row">
          <h3>Daily rituals</h3>
          <strong>{points}/4{log.brain ? ' ✨' : ''}</strong>
        </div>
        <div className="rituals">
          <RitualCard icon="🥗" name="Nourish" detail="Balanced meals today. Your plan is below." done={log.nourish} tone="lilac" onToggle={() => update({ nourish: !log.nourish })} />
          <RitualCard icon="🧘‍♀️" name="Move 45 mins" detail={plan.workout} done={log.move} tone="rose" onToggle={() => update({ move: !log.move })} />
          <RitualCard icon="💧" name="Water 3 litres" detail={`${water} of 12 glasses (250 ml each)`} done={water >= 12} tone="sky" onToggle={() => update({ water: water >= 12 ? 0 : 12 })}>
            <div className="glasses">
              {Array.from({ length: 12 }, (_, i) => (
                <button key={i} className={'glass' + (i < water ? ' full' : '')} aria-label={`${i + 1} glasses`}
                  onClick={(e) => { e.stopPropagation(); update({ water: water === i + 1 ? i : i + 1 }); }} />
              ))}
            </div>
          </RitualCard>
          <RitualCard icon="📖" name="Read 10 pages" detail={`${plan.reading.book}, pages ${plan.reading.from}–${plan.reading.to}`} done={log.read} tone="sage" onToggle={() => update({ read: !log.read })} />
          <RitualCard icon="🧠" name="Bonus Brainstack" detail={plan.brainstack} done={log.brain} tone="butter" wide onToggle={() => update({ brain: !log.brain })} />
        </div>
        {points === 4 && <p className="well-done">All four done. Beautifully kept promise to yourself. 🌷</p>}
      </div>

      <div className="card">
        <h3>Today’s meals</h3>
        <div className="meals">
          {Object.entries(plan.meals).map(([meal, r]) => (
            <button key={meal} className="meal" onClick={() => openRecipe(r.id)}>
              <span>{meal}</span>
              <b>{r.name}</b>
              <small className="muted">{r.time} · tap for recipe</small>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>How do I feel?</h3>
        <div className="chips">
          {MOODS.map(([value, label]) => (
            <button key={value} className="chip" aria-pressed={log.mood === value} onClick={() => update({ mood: log.mood === value ? null : value })}>
              {label}
            </button>
          ))}
        </div>
        <label className="field">
          <span>A soft note for today</span>
          <textarea defaultValue={log.note} key={day} placeholder="Wins, feelings, what you want to remember…" onChange={(e) => saveNote(e.target.value)} />
        </label>
      </div>
    </section>
  );
}
