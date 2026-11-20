/** One tappable ritual. The whole card toggles; children (like water glasses) can stop that. */
export default function RitualCard({ icon, name, detail, done, tone, wide, onToggle, children }) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={done}
      className={`rit tone-${tone}${wide ? ' wide' : ''}`}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <span className="tick" aria-hidden="true">✓</span>
      <span>
        <b>{icon} {name}</b>
        <small>{detail}</small>
        {children}
      </span>
    </div>
  );
}
