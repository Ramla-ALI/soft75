import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Recipes({ openRecipe }) {
  const [meal, setMeal] = useState('all');
  const [q, setQ] = useState('');
  const [list, setList] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => api.recipes(meal, q).then(setList).catch((e) => setError(e.message)), 200);
    return () => clearTimeout(t);
  }, [meal, q]);

  return (
    <section className="view">
      <h2>Recipe book</h2>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or ingredient, e.g. salmon" aria-label="Search recipes" />
      <div className="chips">
        {['all', 'breakfast', 'lunch', 'dinner'].map((m) => (
          <button key={m} className="chip" aria-pressed={meal === m} onClick={() => setMeal(m)}>{m[0].toUpperCase() + m.slice(1)}</button>
        ))}
      </div>
      {error && <p className="empty" role="alert">{error}</p>}
      <div className="rlist">
        {list?.length === 0 && <p className="empty">No recipes match that search.</p>}
        {list?.map((r) => (
          <button key={r.id} className="ritem" onClick={() => openRecipe(r.id)}>
            <span><b>{r.name}</b><br /><small className="muted">{r.time} · {r.ingredientCount} ingredients</small></span>
            <span className={`tag ${r.meal}`}>{r.meal}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
