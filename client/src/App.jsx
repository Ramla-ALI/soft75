import { useEffect, useState } from 'react';
import Today from './pages/Today.jsx';
import Plan from './pages/Plan.jsx';
import Progress from './pages/Progress.jsx';
import Weekly from './pages/Weekly.jsx';
import Journal from './pages/Journal.jsx';
import Recipes from './pages/Recipes.jsx';
import RecipeModal from './components/RecipeModal.jsx';
import { todayDay, IS_DEMO } from './api.js';

const TABS = [
  { id: 'today', label: '☀️ Today' },
  { id: 'plan', label: '🗓️ 75 days' },
  { id: 'progress', label: '📈 Progress' },
  { id: 'week', label: '🛒 Weekly' },
  { id: 'journal', label: '🌼 Journal' },
  { id: 'recipes', label: '🍽️ Recipes' },
];

const tabFromHash = () => TABS.find((t) => '#' + t.id === window.location.hash)?.id ?? 'today';

export default function App() {
  const [tab, setTab] = useState(tabFromHash);
  const [day, setDay] = useState(todayDay);
  const [recipeId, setRecipeId] = useState(null);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const openDay = (n) => {
    setDay(n);
    window.location.hash = 'today';
  };

  return (
    <div className="wrap">
      <header className="top">
        <h1>
          75 Soft <em>Studio</em>
        </h1>
        <nav className="tabs" aria-label="Sections">
          {TABS.map((t) => (
            <a key={t.id} href={'#' + t.id} aria-current={tab === t.id ? 'page' : undefined}>
              {t.label}
            </a>
          ))}
        </nav>
      </header>
      {IS_DEMO && (
        <p className="demo">
          Live demo: your ticks are saved in this browser only. The full version runs on a Node/Express API and SQL database.{' '}
          <a href="https://github.com/Ramla-ALI/soft75">See the code</a>
        </p>
      )}
      <main>
        {tab === 'today' && <Today day={day} setDay={setDay} openRecipe={setRecipeId} />}
        {tab === 'plan' && <Plan openDay={openDay} />}
        {tab === 'progress' && <Progress />}
        {tab === 'week' && <Weekly initialWeek={Math.ceil(day / 7)} openRecipe={setRecipeId} />}
        {tab === 'journal' && <Journal />}
        {tab === 'recipes' && <Recipes openRecipe={setRecipeId} />}
      </main>
      {recipeId && <RecipeModal id={recipeId} onClose={() => setRecipeId(null)} />}
    </div>
  );
}
