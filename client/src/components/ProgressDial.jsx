export default function ProgressDial({ day, total = 75 }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <div className="dial" aria-label={`Day ${day} of ${total}`}>
      <svg viewBox="0 0 92 92">
        <circle cx="46" cy="46" r={r} fill="none" stroke="var(--line)" strokeWidth="7" />
        <circle cx="46" cy="46" r={r} fill="none" stroke="var(--rose)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(c * day) / total} ${c}`} />
      </svg>
      <div className="num"><div><b>{day}</b><span>of {total}</span></div></div>
    </div>
  );
}
