import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import RitualCard from './components/RitualCard.jsx';
import Recipes from './pages/Recipes.jsx';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('RitualCard', () => {
  it('shows its state and toggles on click and keyboard', () => {
    const onToggle = vi.fn();
    render(<RitualCard icon="🥗" name="Nourish" detail="Balanced meals" done={false} tone="lilac" onToggle={onToggle} />);
    const card = screen.getByRole('button', { name: /Nourish/ });
    expect(card.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(card);
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onToggle).toHaveBeenCalledTimes(2);
  });
});

describe('Recipes page', () => {
  it('lists recipes from the API and filters by meal', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'lemon-herb-salmon', name: 'Lemon herb salmon', meal: 'dinner', time: '20 mins', ingredientCount: 6 }],
    });
    render(<Recipes openRecipe={() => {}} />);
    expect(await screen.findByText('Lemon herb salmon')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dinner' }));
    await screen.findByText('Lemon herb salmon');
    await new Promise((r) => setTimeout(r, 250));
    expect(fetchMock.mock.calls.at(-1)[0]).toContain('meal=dinner');
  });
});
