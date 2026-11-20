import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

export default function RecipeModal({ id, onClose }) {
  const ref = useRef(null);
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    ref.current?.showModal?.();
    api.recipe(id).then(setRecipe).catch((e) => setError(e.message));
  }, [id]);

  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="in">
        <div className="row">
          <h2>{recipe?.name ?? 'Loading…'}</h2>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        {error && <p role="alert">{error}</p>}
        {recipe && (
          <>
            <p className="muted"><span className={`tag ${recipe.meal}`}>{recipe.meal}</span> ⏱ {recipe.time}</p>
            <h3>Ingredients</h3>
            <ul>{recipe.ingredients.map((i) => <li key={i}>{i}</li>)}</ul>
            <h3>Method</h3>
            <ol>{recipe.method.map((s) => <li key={s}>{s}</li>)}</ol>
          </>
        )}
      </div>
    </dialog>
  );
}
