import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useDebounced } from '../useDebounced.js';

const QUESTIONS = [
  ['wentWell', '🌸 What went well this week?'],
  ['wasHard', '🌧️ What felt hard?'],
  ['learned', '💡 What did I learn about myself?'],
  ['focus', '🎯 One focus for next week'],
  ['proud', '🤍 Something I am proud of'],
];

export default function Weekly({ initialWeek, openRecipe }) {
  const [week, setWeek] = useState(initialWeek);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    api.week(week).then(setData).catch((e) => setError(e.message));
  }, [week]);

  const saveAnswer = useDebounced((changes) => api.saveReflection(week, changes).catch((e) => setError(e.message)));

  const tick = (item, checked) => {
    setData((d) => ({ ...d, shopping: d.shopping.map((g) => ({ ...g, items: g.items.map((i) => (i.id === item.id ? { ...i, checked } : i)) })) }));
    api.tick(week, item.id, checked).catch((e) => setError(e.message));
  };

  const total = data?.shopping.reduce((a, g) => a + g.items.length, 0) ?? 0;
  const done = data?.shopping.reduce((a, g) => a + g.items.filter((i) => i.checked).length, 0) ?? 0;

  return (
    <section className="view">
      <h2>Week {week}</h2>
      <div className="chips scroll">
        {Array.from({ length: 11 }, (_, i) => (
          <button key={i} className="chip" aria-pressed={week === i + 1} onClick={() => setWeek(i + 1)}>Week {i + 1}</button>
        ))}
      </div>
      {error && <p className="empty" role="alert">{error}</p>}
      {!data ? <p className="empty">Loading week {week}…</p> : (
        <>
          <p className="muted">Days {data.fromDay}–{data.toDay}</p>
          <div className="card">
            <div className="row"><h3>🛒 Shopping list</h3><span className="muted">{done} of {total} ticked</span></div>
            {data.shopping.map((g) => (
              <div className="shopcat" key={g.category}>
                <h3>{g.category}</h3>
                <ul>
                  {g.items.map((i) => (
                    <li key={i.id}>
                      <label>
                        <input type="checkbox" checked={i.checked} onChange={(e) => tick(i, e.target.checked)} />
                        <span>{i.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <details>
              <summary>This week’s {data.recipes.length} recipes</summary>
              <div className="rlist">
                {data.recipes.map((r) => (
                  <button key={r.id} className="ritem" onClick={() => openRecipe(r.id)}>
                    <b>{r.name}</b><span className={`tag ${r.meal}`}>{r.meal}</span>
                  </button>
                ))}
              </div>
            </details>
          </div>
          <div className="card form" key={week}>
            <h3>🌙 Sunday reflection</h3>
            {QUESTIONS.map(([k, label]) => (
              <label className="field" key={k}>
                <span>{label}</span>
                <textarea defaultValue={data.reflection[k]} onChange={(e) => saveAnswer({ [k]: e.target.value })} />
              </label>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
