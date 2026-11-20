// Same streak rule as server/src/stats.js, used by the in-browser demo.
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
