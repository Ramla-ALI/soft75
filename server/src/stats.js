/** Which challenge day a date falls on (Day 1 = start date). */
export function dayNumber(startIso, todayIso) {
  const start = Date.parse(startIso + 'T00:00:00Z');
  const today = Date.parse(todayIso + 'T00:00:00Z');
  if (Number.isNaN(start) || Number.isNaN(today)) throw new TypeError('Dates must be in YYYY-MM-DD format.');
  return Math.floor((today - start) / 86_400_000) + 1;
}

/**
 * Perfect-day streaks from a list of daily points (0–4), oldest first.
 * The current streak counts back from the last day. If the last day is not
 * finished yet it does not break the streak, so a morning with no ticks
 * still shows yesterday's streak.
 */
export function streaks(points) {
  let best = 0;
  let run = 0;
  for (const p of points) {
    run = p === 4 ? run + 1 : 0;
    best = Math.max(best, run);
  }
  let current = 0;
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i] === 4) current++;
    else if (i === points.length - 1) continue;
    else break;
  }
  return { current, best };
}
