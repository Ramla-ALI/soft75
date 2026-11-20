import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useDebounced } from '../useDebounced.js';

export default function Journal() {
  const [pages, setPages] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.journal().then(setPages).catch((e) => setError(e.message)); }, []);

  const saveNote = useDebounced((week, note) => api.saveJournal(week, { note }).catch((e) => setError(e.message)));
  const setDone = (week, done) => {
    setPages((ps) => ps.map((p) => (p.week === week ? { ...p, done } : p)));
    api.saveJournal(week, { done }).catch((e) => setError(e.message));
  };

  if (error) return <p className="empty" role="alert">{error}</p>;
  if (!pages) return <p className="empty">Loading your journal…</p>;

  return (
    <section className="view">
      <h2>Junk journal</h2>
      <p className="muted">One creative page a week. Collect bits and bobs, make the page, then jot down what you made.</p>
      <div className="notes">
        {pages.map((p) => (
          <article className="postit" key={p.week}>
            <span className="eyebrow">Week {p.week}</span>
            <h4>{p.title}</h4>
            <p>{p.prompt}</p>
            <p className="small"><b>Collect:</b> {p.collect}</p>
            <textarea aria-label={`Notes for ${p.title}`} defaultValue={p.note} placeholder="What did you make?" onChange={(e) => saveNote(p.week, e.target.value)} />
            <label className="done"><input type="checkbox" checked={p.done} onChange={(e) => setDone(p.week, e.target.checked)} /> Page finished</label>
          </article>
        ))}
      </div>
    </section>
  );
}
